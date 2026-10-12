// Bridges between the DevQuest page and the main process. They are exposed ONLY to DevQuest's own pages
// (app://devquest, or the Vite dev server during development); the main process checks the sender again.
const { contextBridge, ipcRenderer } = require('electron');

const devArg = process.argv.find((a) => a.startsWith('--dq-dev-url='));
const devUrl = devArg ? devArg.slice('--dq-dev-url='.length) : '';
const trusted = location.origin === 'app://devquest' || (!!devUrl && location.href.startsWith(devUrl));

if (trusted) {
  // Streaming fetch from the main process, which isn't subject to browser CORS
  // (needed for local AI servers like Solframe Studio or LM Studio).
  contextBridge.exposeInMainWorld('devquestNative', {
    start: (req) => ipcRenderer.invoke('net:start', req),
    read: (id) => ipcRenderer.invoke('net:read', id),
    abort: (id) => ipcRenderer.invoke('net:abort', id),
  });

  // Local compilers/interpreters for languages that can't run in the browser (see toolchains.cjs)
  contextBridge.exposeInMainWorld('devquestTools', {
    detect: (force) => ipcRenderer.invoke('tools:detect', force),
    run: (lang, code) => ipcRenderer.invoke('tools:run', { lang, code }),
  });

  // Durable save file in the app data folder (mirrors localStorage; see src/engine/deviceSave.ts)
  contextBridge.exposeInMainWorld('devquestSave', {
    read: (name) => ipcRenderer.invoke('save:read', name),
    write: (text, name) => ipcRenderer.invoke('save:write', text, name),
    info: () => ipcRenderer.invoke('save:info'),
    readBackup: (name) => ipcRenderer.invoke('save:readBackup', name),
    reveal: () => ipcRenderer.invoke('save:reveal'),
    syncGet: () => ipcRenderer.invoke('sync:get'),
    syncChoose: () => ipcRenderer.invoke('sync:choose'),
    syncClear: () => ipcRenderer.invoke('sync:clear'),
    syncRead: () => ipcRenderer.invoke('sync:read'),
    syncWrite: (text) => ipcRenderer.invoke('sync:write', text),
  });

  // API keys, encrypted with the operating system's keychain (Electron safeStorage)
  contextBridge.exposeInMainWorld('devquestSecrets', {
    getAll: () => ipcRenderer.invoke('secrets:getAll'),
    set: (id, value) => ipcRenderer.invoke('secrets:set', id, value),
    available: () => ipcRenderer.invoke('secrets:available'),
  });
}
