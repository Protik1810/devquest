import { Capacitor, registerPlugin } from '@capacitor/core';

/**
 * API keys never go into the progress save, its mirrored files, or exports. They are kept here instead:
 * - Desktop: encrypted with the OS keychain (Electron safeStorage: DPAPI / Keychain / libsecret)
 * - Android: encrypted with an AES key held in the Android Keystore (in-app SecureStorage plugin)
 * - Web: a separate localStorage entry for this site only (browsers offer no keychain to web pages)
 */
type DesktopSecrets = { getAll: () => Promise<Record<string, string>>; set: (id: string, v: string) => Promise<boolean>; available: () => Promise<boolean> };
type AndroidSecrets = { getAll: () => Promise<Record<string, string>>; set: (o: { id: string; value: string }) => Promise<void> };

const desktop = (globalThis as { devquestSecrets?: DesktopSecrets }).devquestSecrets;
const android = Capacitor.isNativePlatform() ? registerPlugin<AndroidSecrets>('SecureStorage') : null;
const WEB_KEY = 'devquest-keys';

export const secretsBackend: 'os-keychain' | 'android-keystore' | 'browser' = desktop ? 'os-keychain' : android ? 'android-keystore' : 'browser';

export async function secureStorageStrong() {
  if (desktop) return desktop.available();
  return !!android;
}

export async function loadSecrets(): Promise<Record<string, string>> {
  try {
    if (desktop) return await desktop.getAll();
    if (android) return await android.getAll();
    return JSON.parse(localStorage.getItem(WEB_KEY) ?? '{}');
  } catch {
    return {};
  }
}

export async function setSecret(id: string, value: string) {
  if (desktop) return void (await desktop.set(id, value));
  if (android) return android.set({ id, value });
  const all = JSON.parse(localStorage.getItem(WEB_KEY) ?? '{}') as Record<string, string>;
  if (value) all[id] = value;
  else delete all[id];
  localStorage.setItem(WEB_KEY, JSON.stringify(all));
}

type ProviderMap = Record<string, { apiKey?: string } | undefined>;

/** Copy of a providers map with every apiKey blanked (what gets persisted). */
export function stripKeys<T extends ProviderMap>(providers: T): T {
  const out = {} as Record<string, unknown>;
  for (const [id, cfg] of Object.entries(providers)) out[id] = cfg ? { ...cfg, apiKey: '' } : cfg;
  return out as T;
}

/**
 * One-time migration before the store loads: move keys that older versions kept inside the save
 * into secure storage, and remove them from the save.
 */
export async function migrateKeysOutOfSave(saveKey: string) {
  try {
    const raw = localStorage.getItem(saveKey);
    if (!raw) return;
    const save = JSON.parse(raw);
    const providers = save?.state?.settings?.providers as ProviderMap | undefined;
    if (!providers) return;
    let moved = false;
    for (const [id, cfg] of Object.entries(providers)) {
      if (cfg?.apiKey) {
        await setSecret(id, cfg.apiKey);
        cfg.apiKey = '';
        moved = true;
      }
    }
    if (moved) localStorage.setItem(saveKey, JSON.stringify(save));
  } catch {
    /* keep going: the learner can re-enter a key */
  }
}

/** Keep secure storage in sync with keys typed into Settings. */
export function watchKeys(subscribe: (fn: (providers: ProviderMap) => void) => void, initial: Record<string, string>) {
  const known = { ...initial };
  subscribe((providers) => {
    for (const [id, cfg] of Object.entries(providers)) {
      const key = cfg?.apiKey ?? '';
      if ((known[id] ?? '') !== key) {
        known[id] = key;
        void setSecret(id, key);
      }
    }
  });
}
