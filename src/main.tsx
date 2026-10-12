import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { requestPersistentStorage, restoreFromDevice, SAVE_KEY } from './engine/deviceSave';
import { loadSecrets, migrateKeysOutOfSave, watchKeys } from './engine/secrets';
import './styles.css';
import './themes.css';
import './paths.css';
import './responsive.css';

/** Never let a slow or stuck platform call keep the app from rendering. */
function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([p.catch(() => fallback), new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))]);
}

// Before the store loads: put the on-device save back into localStorage if it was cleared, and move any
// API keys out of the save into secure storage. Then load the app and give it the keys.
// HashRouter so routes work from app:// and file:// inside the desktop app.
async function boot() {
  await withTimeout(restoreFromDevice(), 4000, 'none' as const);
  await withTimeout(migrateKeysOutOfSave(SAVE_KEY), 3000, undefined);
  const keys = await withTimeout(loadSecrets(), 3000, {} as Record<string, string>);
  const [{ default: App }, { useGame }] = await Promise.all([import('./App'), import('./engine/store')]);
  const st = useGame.getState().settings;
  const providers = { ...st.providers };
  for (const [id, key] of Object.entries(keys)) providers[id as keyof typeof providers] = { ...(providers[id as keyof typeof providers] ?? { model: '', baseUrl: '' }), apiKey: key };
  useGame.setState({ settings: { ...st, providers } });
  watchKeys((fn) => useGame.subscribe((s, prev) => s.settings.providers !== prev.settings.providers && fn(s.settings.providers)), keys);

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </StrictMode>,
  );
  // After first paint: ask the browser to keep our storage (may show a prompt in Firefox; never blocks the app)
  setTimeout(requestPersistentStorage, 1500);
}
void boot();
