const { app, BrowserWindow, shell, protocol, net, ipcMain, session, safeStorage, dialog } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const toolchains = require('./toolchains.cjs');
const fs = require('fs');

const DIST = path.join(__dirname, '..', 'dist');

// Serve the built app from app://devquest/ instead of file:// so fetch() (used to load the SQLite WASM) works
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } },
]);

// ---- Security: only DevQuest's own pages may use the bridges ----
const APP_ORIGIN = 'app://devquest';
const DEV_URL = process.env.VITE_DEV_SERVER_URL || '';
const isAppUrl = (url) => typeof url === 'string' && (url.startsWith(APP_ORIGIN + '/') || (!!DEV_URL && url.startsWith(DEV_URL)));

/** Open a link in the system browser, but only web/mail links (never file:, custom protocols, etc.). */
function openExternalSafe(url) {
  try {
    const { protocol: p } = new URL(url);
    if (p === 'https:' || p === 'http:' || p === 'mailto:') shell.openExternal(url);
  } catch {
    /* not a URL: ignore */
  }
}

/** ipcMain.handle that rejects calls from anything but the app's own top-level page. */
function handle(channel, fn) {
  ipcMain.handle(channel, (e, ...args) => {
    const frame = e.senderFrame;
    if (!frame || frame !== e.sender.mainFrame || !isAppUrl(frame.url)) throw new Error('Blocked: request did not come from DevQuest');
    return fn(e, ...args);
  });
}

// Content Security Policy for the app's pages. Scripts only from the app itself; 'unsafe-eval' and inline
// scripts are needed by the in-app code runners (JavaScript exercises, Pyodide, the HTML exercise iframe).
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob:",
  "worker-src 'self' blob:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  // AI providers are user-chosen (cloud or local), so connections stay open; code runs are sandboxed separately
  "connect-src 'self' blob: data: https: http://localhost:* http://127.0.0.1:* ws://localhost:*",
  "frame-src 'self' blob: data: about:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ');

function serveApp() {
  protocol.handle('app', async (req) => {
    const { pathname } = new URL(req.url);
    const file = path.normalize(path.join(DIST, decodeURIComponent(pathname)));
    if (!file.startsWith(DIST)) return new Response('Not found', { status: 404 });
    const res = await net.fetch(pathToFileURL(file).toString());
    if (!file.endsWith('.html')) return res;
    const headers = new Headers(res.headers);
    headers.set('Content-Security-Policy', CSP);
    headers.set('X-Content-Type-Options', 'nosniff');
    return new Response(res.body, { status: res.status, headers });
  });
}

function hardenSessions() {
  // No camera, microphone, geolocation, notifications…: only writing to the clipboard (copy buttons)
  const allowed = new Set(['clipboard-sanitized-write']);
  session.defaultSession.setPermissionRequestHandler((_wc, permission, cb) => cb(allowed.has(permission)));
  session.defaultSession.setPermissionCheckHandler((_wc, permission) => allowed.has(permission));
}

app.on('web-contents-created', (_e, contents) => {
  contents.on('will-attach-webview', (e) => e.preventDefault());
  // Never navigate a DevQuest window away from the app; open other links in the browser instead
  const guard = (e, url) => {
    if (!isAppUrl(url)) {
      e.preventDefault();
      openExternalSafe(url);
    }
  };
  contents.on('will-navigate', guard);
  contents.on('will-redirect', guard);
  contents.setWindowOpenHandler(({ url }) => {
    openExternalSafe(url);
    return { action: 'deny' };
  });
});

// ---- Streaming fetch bridge for AI providers (see preload.cjs) ----
const streams = new Map(); // id -> { reader, controller }
let nextStream = 1;

function registerNetBridge() {
  handle('net:start', async (_e, { url, method = 'GET', headers = {}, body }) => {
    const u = new URL(url);
    const local = /^(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|169\.254\.\d+\.\d+|\[::1\]|[^.]+\.local)$/i.test(u.hostname);
    if (!(u.protocol === 'https:' || (u.protocol === 'http:' && local))) throw new Error('Only https:// URLs (or http:// to this device/local network) are allowed');
    const controller = new AbortController();
    const res = await net.fetch(url, { method, headers, body, signal: controller.signal });
    const id = nextStream++;
    streams.set(id, { reader: res.body ? res.body.getReader() : null, controller });
    return { id, status: res.status, statusText: res.statusText, headers: [...res.headers.entries()] };
  });
  handle('net:read', async (_e, id) => {
    const s = streams.get(id);
    if (!s || !s.reader) return null;
    const { done, value } = await s.reader.read();
    if (done) {
      streams.delete(id);
      return null;
    }
    return value;
  });
  registerSaveBridge();
  handle('tools:detect', (_e, force) => toolchains.detect(!!force).then((d) => d.langs));
  handle('tools:run', (_e, { lang, code }) => toolchains.runProgram(String(lang), String(code)));
  handle('net:abort', (_e, id) => {
    const s = streams.get(id);
    if (s) {
      s.controller.abort();
      streams.delete(id);
    }
  });
}

// ---- On-device save file (mirror of the app's localStorage save) ----
// Lives in the per-user app data folder, e.g. %APPDATA%\DevQuest\save on Windows or ~/.config/DevQuest/save on Linux.
const SAVE_KEEP_DAYS = 7;
const saveDir = () => path.join(app.getPath('userData'), 'save');
// Only these app saves are mirrored to disk (the main progress save and the Agent Lab workspace)
const SAVE_NAMES = new Set(['devquest-save', 'devquest-agent']);
const saveFile = (name = 'devquest-save') => {
  if (!SAVE_NAMES.has(name)) throw new Error('Unknown save name');
  return path.join(saveDir(), `${name}.json`);
};

function registerSaveBridge() {
  handle('save:read', (_e, name) => {
    try {
      return fs.readFileSync(saveFile(name), 'utf8');
    } catch {
      return null;
    }
  });
  handle('save:write', (_e, text, name = 'devquest-save') => {
    if (typeof text !== 'string' || text.length > 20 * 1024 * 1024) throw new Error('Invalid save');
    const dir = saveDir();
    fs.mkdirSync(path.join(dir, 'backups'), { recursive: true });
    const file = saveFile(name);
    // Keep one backup per day of the previous progress save, and only the most recent few
    if (name === 'devquest-save' && fs.existsSync(file)) {
      const day = new Date(fs.statSync(file).mtime).toISOString().slice(0, 10);
      const backup = path.join(dir, 'backups', `devquest-save-${day}.json`);
      if (!fs.existsSync(backup)) fs.copyFileSync(file, backup);
      const old = fs.readdirSync(path.join(dir, 'backups')).filter((f) => f.endsWith('.json')).sort().reverse().slice(SAVE_KEEP_DAYS);
      for (const f of old) fs.rmSync(path.join(dir, 'backups', f), { force: true });
    }
    // Write atomically so a crash mid-write never leaves a half-written save
    const tmp = file + '.tmp';
    fs.writeFileSync(tmp, text, 'utf8');
    fs.renameSync(tmp, file);
    return { path: file, savedAt: Date.now() };
  });
  handle('save:info', () => {
    const file = saveFile();
    const backups = fs.existsSync(path.join(saveDir(), 'backups')) ? fs.readdirSync(path.join(saveDir(), 'backups')).filter((f) => f.endsWith('.json')).sort().reverse() : [];
    return { path: file, exists: fs.existsSync(file), savedAt: fs.existsSync(file) ? fs.statSync(file).mtimeMs : 0, backups };
  });
  handle('save:readBackup', (_e, name) => {
    if (!/^devquest-save-\d{4}-\d{2}-\d{2}\.json$/.test(String(name))) throw new Error('Invalid backup name');
    return fs.readFileSync(path.join(saveDir(), 'backups', name), 'utf8');
  });
  handle('save:reveal', () => shell.showItemInFolder(saveFile()));

  // ---- Sync folder: mirror progress into a folder the learner picks (e.g. inside OneDrive/Dropbox/Syncthing) ----
  const syncCfg = () => path.join(app.getPath('userData'), 'sync.json');
  const syncFolder = () => {
    try {
      const f = JSON.parse(fs.readFileSync(syncCfg(), 'utf8')).folder;
      return typeof f === 'string' && fs.existsSync(f) ? f : null;
    } catch {
      return null;
    }
  };
  const syncFile = () => {
    const f = syncFolder();
    return f ? path.join(f, 'devquest-save.json') : null;
  };
  handle('sync:get', () => syncFolder());
  handle('sync:choose', async (e) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    const r = await dialog.showOpenDialog(win, { title: 'Choose a folder to sync DevQuest progress', properties: ['openDirectory', 'createDirectory'] });
    if (r.canceled || !r.filePaths[0]) return syncFolder();
    fs.writeFileSync(syncCfg(), JSON.stringify({ folder: r.filePaths[0] }), 'utf8');
    return r.filePaths[0];
  });
  handle('sync:clear', () => {
    fs.rmSync(syncCfg(), { force: true });
    return null;
  });
  handle('sync:read', () => {
    const f = syncFile();
    try {
      return f ? fs.readFileSync(f, 'utf8') : null;
    } catch {
      return null;
    }
  });
  handle('sync:write', (_e, text) => {
    const f = syncFile();
    if (!f || typeof text !== 'string' || text.length > 20 * 1024 * 1024) return false;
    fs.writeFileSync(f + '.tmp', text, 'utf8');
    fs.renameSync(f + '.tmp', f);
    return true;
  });
}

// ---- API keys: encrypted with the OS keychain (DPAPI on Windows, Keychain on macOS, libsecret/kwallet on Linux) ----
const secretsFile = () => path.join(app.getPath('userData'), 'secrets.json');
const strongEncryption = () =>
  safeStorage.isEncryptionAvailable() && (process.platform !== 'linux' || safeStorage.getSelectedStorageBackend() !== 'basic_text');

function readSecrets() {
  try {
    const raw = JSON.parse(fs.readFileSync(secretsFile(), 'utf8'));
    const out = {};
    for (const [id, b64] of Object.entries(raw)) {
      try {
        out[id] = safeStorage.decryptString(Buffer.from(String(b64), 'base64'));
      } catch {
        /* encrypted on another machine/user: skip */
      }
    }
    return out;
  } catch {
    return {};
  }
}

function registerSecrets() {
  handle('secrets:available', () => strongEncryption());
  handle('secrets:getAll', () => readSecrets());
  handle('secrets:set', (_e, id, value) => {
    if (typeof id !== 'string' || !/^[a-z0-9-]{1,40}$/.test(id) || typeof value !== 'string' || value.length > 4096) throw new Error('Invalid secret');
    if (!safeStorage.isEncryptionAvailable()) throw new Error('Secure storage is not available on this system');
    let raw = {};
    try {
      raw = JSON.parse(fs.readFileSync(secretsFile(), 'utf8'));
    } catch {
      /* first key */
    }
    if (value) raw[id] = safeStorage.encryptString(value).toString('base64');
    else delete raw[id];
    fs.writeFileSync(secretsFile(), JSON.stringify(raw), { encoding: 'utf8', mode: 0o600 });
    return true;
  });
}

/** Older versions stored API keys inside the save file and its backups; remove them from disk. */
function scrubKeysFromSaves() {
  const files = [];
  const dir = saveDir();
  for (const sub of ['', 'backups']) {
    const d = path.join(dir, sub);
    if (fs.existsSync(d)) for (const f of fs.readdirSync(d)) if (f.endsWith('.json')) files.push(path.join(d, f));
  }
  for (const f of files) {
    try {
      const j = JSON.parse(fs.readFileSync(f, 'utf8'));
      const providers = j?.state?.settings?.providers;
      if (!providers) continue;
      let changed = false;
      for (const cfg of Object.values(providers)) {
        if (cfg && typeof cfg === 'object' && cfg.apiKey) {
          cfg.apiKey = '';
          changed = true;
        }
      }
      if (changed) fs.writeFileSync(f, JSON.stringify(j), 'utf8');
    } catch {
      /* not a save file */
    }
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0f1020',
    title: 'DevQuest by Protik',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      webviewTag: false,
      preload: path.join(__dirname, 'preload.cjs'),
      additionalArguments: DEV_URL ? [`--dq-dev-url=${DEV_URL}`] : [],
    },
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  win.loadURL(devUrl || 'app://devquest/index.html');
}

app.setAboutPanelOptions({
  applicationName: 'DevQuest',
  applicationVersion: app.getVersion(),
  copyright: 'Copyright © 2026 Protik',
  authors: ['Protik'],
  credits: 'Created and developed by Protik',
});

app.whenReady().then(() => {
  hardenSessions();
  serveApp();
  registerSecrets();
  scrubKeysFromSaves();
  registerNetBridge();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
