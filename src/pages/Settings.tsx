import { useEffect, useRef, useState } from 'react';
import { chooseSyncFolder, getSaveStatus, hasSaveFolder, onSaveStatus, readBackup, revealSaveFile, stopSync } from '../engine/deviceSave';
import { useGame, type State } from '../engine/store';
import { toast } from '../engine/toast';
import { AiSettings } from '../components/AiSettings';
import { APP_AUTHOR, APP_VERSION, isDesktopApp, isNativeApp, saveTextFile } from '../engine/platform';
import type { ThemeId } from '../engine/store';
import { hasToolBridge, INSTALL_URL, useTools } from '../engine/localRun';
import { LANG_META } from '../content/langMeta';
import type { NativeLang } from '../content/types';

/** Where the profile and progress are stored on this device, and (desktop) daily backups. */
function SaveLocation({ onRestore }: { onRestore: (text: string) => void }) {
  const [st, setSt] = useState(getSaveStatus);
  useEffect(() => onSaveStatus(setSt), []);
  const when = st.savedAt ? new Date(st.savedAt).toLocaleString() : 'not yet';
  return (
    <div className="save-status small">
      <div>
        {st.where === 'file' ? "🔒 Saved in this app's private storage on this device" : '🌐 Saved in this browser on this device'}
        {' · last saved '}{when}
      </div>
      {st.where === 'file' && <div className="muted mono-path" title={st.location}>{st.location}</div>}
      {st.where === 'browser' && <div className="muted">Clearing this site's data erases it, so export a backup now and then (or use the desktop/Android app, which also keeps a save file).</div>}
      {st.error && <div className="bad-text">⚠️ {st.error}</div>}
      {hasSaveFolder && (
        <div className="row">
          <button className="ghost small" onClick={() => revealSaveFile()}>📂 Show save file</button>
          {st.backups.length > 0 && (
            <select defaultValue="" onChange={async (e) => {
              const name = e.target.value;
              e.target.value = '';
              if (name && confirm(`Replace your current progress with the backup from ${name.slice(14, 24)}?`)) onRestore(await readBackup(name));
            }}>
              <option value="" disabled>♻️ Restore a daily backup…</option>
              {st.backups.map((b) => <option key={b} value={b}>{b.slice(14, 24)}</option>)}
            </select>
          )}
      {hasSaveFolder && (
        <div className="sync-box">
          <b>🔄 Sync between computers</b>
          <div className="muted">
            Pick a folder that your cloud drive syncs (OneDrive, Dropbox, Google Drive, Syncthing…). DevQuest merges progress from every computer that uses the same folder; API keys are never written there.
          </div>
          {st.syncFolder ? (
            <>
              <div className="mono-path">{st.syncFolder}</div>
              <div className="muted">{st.syncedAt ? `Last synced ${new Date(st.syncedAt).toLocaleString()}` : 'Syncs on the next save.'}</div>
              <div className="row">
                <button className="ghost small" onClick={() => void chooseSyncFolder()}>Change folder</button>
                <button className="ghost small" onClick={() => void stopSync()}>Stop syncing</button>
              </div>
            </>
          ) : (
            <button className="small" onClick={() => void chooseSyncFolder()}>📁 Choose sync folder…</button>
          )}
        </div>
      )}
        </div>
      )}
    </div>
  );
}

/** Desktop only: which compilers/interpreters were found on this PC. */
function Toolchains() {
  const { langs, loaded, refresh } = useTools();
  const [busy, setBusy] = useState(false);
  if (!hasToolBridge) return null;
  const all = Object.keys(INSTALL_URL) as NativeLang[];
  const found = all.filter((l) => langs[l]).length;
  const rescan = async () => {
    setBusy(true);
    await refresh(true);
    setBusy(false);
  };
  return (
    <section className="card">
      <div className="row">
        <h3 className="grow">⚙️ Local compilers ({found}/{all.length})</h3>
        <button className="ghost small" disabled={busy} onClick={rescan}>{busy ? 'Scanning…' : '↻ Re-scan'}</button>
      </div>
      <p className="muted small">Compiled languages run on your own toolchains. Missing ones fall back to AI checking (when an AI provider is connected) or self-check. Install one, then re-scan.</p>
      {!loaded ? <p className="muted small">Scanning…</p> : (
        <div className="toolchain-list">
          {all.map((l) => {
            const t = langs[l];
            return (
              <div key={l} className={`toolchain ${t ? 'ok' : ''}`}>
                <span>{LANG_META[l].icon} {LANG_META[l].label}</span>
                {t ? <small className="muted" title={t.tool}>✓ {t.tool}{t.compileOnly ? ' (compile only)' : ''}</small> : <a className="small" href={INSTALL_URL[l]} target="_blank" rel="noreferrer">Install →</a>}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

const THEMES: [ThemeId, string, string][] = [
  ['dark', '🌙 Classic dark', 'linear-gradient(135deg, #0f1020, #242848)'],
  ['light', '☀️ Classic light', 'linear-gradient(135deg, #f4f5fb, #dcdff0)'],
  ['void', '🌌 Dark Void', 'url(./art/theme-void.webp) center / cover'],
  ['neon', '🌃 Neon Cyber', 'url(./art/theme-neon.webp) center / cover'],
  ['cinema', '🎬 Cinema Gold', 'url(./art/theme-cinema.webp) center / cover'],
  ['synthwave', '🌅 Synthwave', 'url(./art/theme-synthwave.webp) center / cover'],
  ['anime', '🏯 Anime Fantasy', 'url(./art/theme-anime.webp) center / cover'],
  ['matrix', '🟩 Emerald Matrix', 'url(./art/theme-matrix.webp) center / cover'],
];


export function Settings() {
  const s = useGame();
  const [name, setName] = useState(s.name);
  const fileRef = useRef<HTMLInputElement>(null);

  const exportSave = async () => {
    const { name, xp, gems, completed, streak, freezes, achievements, srs, stats, xpLog, projects, customProjects } = useGame.getState();
    const text = JSON.stringify({ devquest: 1, name, xp, gems, completed, streak, freezes, achievements, srs, stats, xpLog, projects, customProjects }, null, 2);
    try {
      await saveTextFile(`devquest-save-${new Date().toISOString().slice(0, 10)}.json`, text);
    } catch (e) {
      toast({ kind: 'error', title: 'Export failed', body: String((e as Error).message) });
    }
  };

  const importSave = async (f: File) => {
    try {
      const data = JSON.parse(await f.text()) as Partial<State> & { devquest?: number };
      if (!data.devquest || typeof data.xp !== 'number') throw new Error('not a DevQuest save file');
      const { devquest: _v, ...rest } = data;
      s.importState({ ...rest, settings: s.settings });
      toast({ kind: 'info', title: '📥 Progress imported' });
    } catch (e) {
      toast({ kind: 'error', title: 'Import failed', body: String((e as Error).message) });
    }
  };

  return (
    <div className="settings">
      <h1>⚙️ Settings</h1>

      <section className="card">
        <h3>👤 Profile</h3>
        <div className="row">
          <input aria-label="Your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} />
          <button onClick={() => name.trim() && s.setName(name.trim())}>Save name</button>
        </div>
      </section>

      <section className="card">
        <h3>🎨 Appearance</h3>
        <div className="theme-grid">
          {THEMES.map(([id, label, bg]) => (
            <button key={id} className={`theme-swatch ${s.settings.theme === id ? 'active' : ''}`} style={{ background: bg }} onClick={() => s.updateSettings({ theme: id })}>
              <span>{label}</span>
            </button>
          ))}
        </div>
        <p className="muted small">Wallpaper themes use artwork generated locally with Solframe Studio.</p>
      </section>

      <AiSettings />

      <Toolchains />

      <section className="card">
        <h3>💾 Your progress</h3>
        <p className="muted small">Your profile and progress are saved automatically on this device; nothing is uploaded. Export a file to back it up or to move between the web, desktop and Android apps.</p>
        <SaveLocation
          onRestore={(text) => {
            try {
              const { state } = JSON.parse(text) as { state: Partial<State> };
              s.importState({ ...state, settings: s.settings });
              toast({ kind: 'info', title: '♻️ Backup restored' });
            } catch (e) {
              toast({ kind: 'error', title: 'Restore failed', body: String((e as Error).message) });
            }
          }}
        />
        <div className="row">
          <button onClick={exportSave}>📤 Export save</button>
          <button onClick={() => fileRef.current?.click()}>📥 Import save</button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importSave(e.target.files[0])} />
          <span className="spacer" />
          <button className="danger" onClick={() => confirm('Erase ALL progress, XP, gems and achievements? This cannot be undone.') && s.reset()}>🗑️ Reset progress</button>
        </div>
      </section>

      <section className="card about">
        <h3>ℹ️ About DevQuest</h3>
        <div className="row">
          <img src="./icon.svg" alt="" width={56} height={56} />
          <div className="grow">
            <b>DevQuest v{APP_VERSION}</b>
            <div className="small">
              Created and developed by <b>{APP_AUTHOR}</b>
            </div>
            <div className="muted small">© 2026 {APP_AUTHOR}. Running as the {isNativeApp ? 'Android app' : isDesktopApp ? 'desktop app' : 'web app'}.</div>
          </div>
        </div>
        <p className="muted small">
          Python runs via Pyodide (downloaded on first use, so it needs internet once), SQL via sql.js (SQLite), JavaScript in a sandboxed Web Worker, and web pages in a sandboxed frame. The terminal is a simulated Linux shell; nothing touches your real files. Artwork was generated locally with Solframe Studio.
        </p>
      </section>
    </div>
  );
}
