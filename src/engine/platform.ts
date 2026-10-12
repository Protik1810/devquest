import { Capacitor } from '@capacitor/core';

/** Running inside the Android (Capacitor) app. */
export const isNativeApp = Capacitor.isNativePlatform();

/** Running inside the Electron desktop app. */
export const isDesktopApp = typeof (globalThis as { devquestNative?: unknown }).devquestNative !== 'undefined';

export const APP_AUTHOR = 'Protik';
export const APP_VERSION = '0.6.1';

/**
 * Android back button: go back through app screens, and only exit from the home screen.
 * Returns a cleanup function.
 */
export async function registerBackButton(goBack: () => void, isHome: () => boolean, closeOverlay: () => boolean) {
  if (!isNativeApp) return () => {};
  const { App } = await import('@capacitor/app');
  const handle = await App.addListener('backButton', () => {
    if (closeOverlay()) return;
    if (isHome()) App.exitApp();
    else goBack();
  });
  return () => void handle.remove();
}

/** Save a text file: a normal download on web/desktop, the share sheet on Android. */
export async function saveTextFile(filename: string, text: string, mime = 'application/json') {
  if (isNativeApp) {
    const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    const written = await Filesystem.writeFile({ path: filename, data: text, directory: Directory.Cache, encoding: Encoding.UTF8 });
    await Share.share({ title: filename, url: written.uri, dialogTitle: 'Save or send your DevQuest progress' });
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: mime }));
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
