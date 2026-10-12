import { Capacitor } from '@capacitor/core';
import { mergeSaves } from './mergeSave';

/**
 * Keeps the learner's profile, progress and Agent Lab workspace safe on this device.
 *
 * The stores save to localStorage. This module mirrors those saves into real files in the app's
 * private data folder, which survive cleared browser data or a reset WebView:
 *   - Desktop (Electron): <userData>/save/<name>.json, plus one backup of the progress save per day for a week
 *   - Android (Capacitor): app-private storage (Directory.Data)/<name>.json, plus the previous copy
 *   - Web: asks the browser to keep this site's storage persistent (not evicted under storage pressure)
 * Before the app renders, restoreFromDevice() puts a file back into localStorage if that copy is missing or has less in it.
 */
export const SAVE_KEY = 'devquest-save';
export const AGENT_KEY = 'devquest-agent';
const MIRRORED = [SAVE_KEY, AGENT_KEY];

type DesktopSave = {
  read: (name: string) => Promise<string | null>;
  write: (text: string, name: string) => Promise<{ path: string; savedAt: number }>;
  info: () => Promise<{ path: string; exists: boolean; savedAt: number; backups: string[] }>;
  readBackup: (name: string) => Promise<string>;
  reveal: () => Promise<void>;
  syncGet: () => Promise<string | null>;
  syncChoose: () => Promise<string | null>;
  syncClear: () => Promise<null>;
  syncRead: () => Promise<string | null>;
  syncWrite: (text: string) => Promise<boolean>;
};

const desktop = (globalThis as { devquestSave?: DesktopSave }).devquestSave;
const android = Capacitor.isNativePlatform();

export type SaveStatus = { where: 'file' | 'browser'; location: string; savedAt: number; error?: string; backups: string[]; syncFolder?: string | null; syncedAt?: number };

let status: SaveStatus = { where: desktop || android ? 'file' : 'browser', location: desktop ? 'App data folder' : android ? 'App storage' : 'Browser storage', savedAt: 0, backups: [] };
const listeners = new Set<(s: SaveStatus) => void>();
const setStatus = (s: Partial<SaveStatus>) => {
  status = { ...status, ...s };
  listeners.forEach((l) => l(status));
};
export const getSaveStatus = () => status;
export const onSaveStatus = (l: (s: SaveStatus) => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};

async function readDeviceFile(name: string): Promise<string | null> {
  if (desktop) return desktop.read(name);
  if (android) {
    const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
    for (const path of [`${name}.json`, `${name}.prev.json`]) {
      try {
        const r = await Filesystem.readFile({ path, directory: Directory.Data, encoding: Encoding.UTF8 });
        if (typeof r.data === 'string' && parseSave(r.data)) return r.data;
      } catch {
        /* not written yet, or unreadable: try the previous copy */
      }
    }
  }
  return null;
}

/** Desktop sync folder: merge our progress with the copy there (another computer may have written it) and save it back. */
async function pushToSyncFolder(text: string) {
  if (!desktop || !status.syncFolder) return;
  const remote = await desktop.syncRead();
  const merged = remote && parseSave(remote) ? mergeSaves(text, remote) : text;
  if (await desktop.syncWrite(merged)) setStatus({ syncedAt: Date.now() });
}

async function writeDeviceFile(name: string, text: string) {
  if (desktop) {
    const r = await desktop.write(text, name);
    if (name === SAVE_KEY) {
      setStatus({ location: r.path, savedAt: r.savedAt, error: undefined });
      await pushToSyncFolder(text);
    }
    return;
  }
  if (android) {
    const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
    try {
      await Filesystem.rename({ from: `${name}.json`, to: `${name}.prev.json`, directory: Directory.Data, toDirectory: Directory.Data });
    } catch {
      /* first save: nothing to keep */
    }
    const r = await Filesystem.writeFile({ path: `${name}.json`, data: text, directory: Directory.Data, encoding: Encoding.UTF8 });
    if (name === SAVE_KEY) setStatus({ location: r.uri, savedAt: Date.now(), error: undefined });
  }
}

type Persisted = { state: Record<string, unknown> & { name?: string; xp?: number; completed?: Record<string, unknown>; files?: Record<string, string>; messages?: unknown[] } };

/** A parsed zustand-persist save, or null when the text isn't one. */
function parseSave(text: string | null): Persisted | null {
  if (!text) return null;
  try {
    const j = JSON.parse(text);
    return j && typeof j === 'object' && j.state && typeof j.state === 'object' ? j : null;
  } catch {
    return null;
  }
}

/** How much a save holds, to decide which copy to trust. */
function weight(s: Persisted | null) {
  if (!s) return -1;
  const st = s.state;
  return (st.name ? 1 : 0) + (st.xp ?? 0) + Object.keys(st.completed ?? {}).length + Object.keys(st.files ?? {}).length + (st.messages?.length ?? 0);
}

function readLocal(name: string): string | null {
  try {
    return localStorage.getItem(name);
  } catch {
    return null;
  }
}

/**
 * Call once before the stores are created. Restores each device file into localStorage when localStorage
 * is empty or holds less (e.g. browser data was cleared and the app started fresh).
 */
export async function restoreFromDevice(): Promise<'restored' | 'kept' | 'none'> {
  // Web: nothing to restore. (Persistent storage is requested after the app renders, see requestPersistentStorage.)
  if (!desktop && !android) return 'none';
  let result: 'restored' | 'kept' = 'kept';
  try {
    if (desktop) {
      const info = await desktop.info();
      setStatus({ location: info.path, savedAt: info.savedAt, backups: info.backups, syncFolder: await desktop.syncGet() });
    }
    for (const name of MIRRORED) {
      const fileText = await readDeviceFile(name);
      if (fileText && weight(parseSave(fileText)) > weight(parseSave(readLocal(name)))) {
        localStorage.setItem(name, fileText);
        if (name === SAVE_KEY) result = 'restored';
      }
    }
    // Pull in progress made on other computers through the sync folder
    if (desktop && status.syncFolder) {
      const remote = await desktop.syncRead();
      const local = readLocal(SAVE_KEY);
      if (remote && parseSave(remote)) {
        localStorage.setItem(SAVE_KEY, local && parseSave(local) ? mergeSaves(local, remote) : remote);
        setStatus({ syncedAt: Date.now() });
      }
    }
    return result;
  } catch (e) {
    setStatus({ error: (e as Error).message });
    return 'none';
  }
}

const pending = new Map<string, string>();
let timer: ReturnType<typeof setTimeout> | undefined;

async function flush() {
  clearTimeout(timer);
  timer = undefined;
  const items = [...pending];
  pending.clear();
  for (const [name, text] of items) {
    try {
      await writeDeviceFile(name, text);
    } catch (e) {
      setStatus({ error: (e as Error).message });
    }
  }
}

/** Storage for zustand persist: localStorage now, plus a debounced copy to the device file. */
export const deviceStorage = {
  getItem: (name: string) => readLocal(name),
  setItem: (name: string, value: string) => {
    try {
      localStorage.setItem(name, value);
    } catch (e) {
      setStatus({ error: `Browser storage is full or blocked: ${(e as Error).message}` });
    }
    if (status.where === 'browser' && name === SAVE_KEY) setStatus({ savedAt: Date.now() });
    if (!MIRRORED.includes(name) || (!desktop && !android)) return;
    pending.set(name, value);
    clearTimeout(timer);
    timer = setTimeout(flush, 1500);
  },
  removeItem: (name: string) => {
    try {
      localStorage.removeItem(name);
    } catch {
      /* nothing to remove */
    }
  },
};

// Write any pending save before the app is hidden or closed
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => void flush());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flush();
  });
}

/** Desktop only: read one of the daily backups. Returns the save text to import. */
export async function readBackup(name: string) {
  if (!desktop) throw new Error('Backups are kept by the desktop app');
  return desktop.readBackup(name);
}

export const revealSaveFile = () => desktop?.reveal();
export const hasSaveFolder = !!desktop;

/** Desktop: choose (or stop using) a folder that mirrors progress for other computers, e.g. inside OneDrive or Dropbox. */
export async function chooseSyncFolder() {
  if (!desktop) return null;
  const folder = await desktop.syncChoose();
  setStatus({ syncFolder: folder });
  const local = readLocal(SAVE_KEY);
  if (folder && local) await pushToSyncFolder(local);
  return folder;
}

export async function stopSync() {
  if (!desktop) return;
  await desktop.syncClear();
  setStatus({ syncFolder: null, syncedAt: undefined });
}

/**
 * Web: ask the browser not to evict this site's storage. Never awaited during boot: Firefox may show a
 * permission prompt, and the app must render whether the learner answers it or not.
 */
export function requestPersistentStorage() {
  if (desktop || android) return;
  try {
    void navigator.storage?.persist?.().catch(() => undefined);
  } catch {
    /* unsupported: storage still works without the guarantee */
  }
}
