import { create } from 'zustand';
import type { CodeLang, NativeLang } from '../content/types';

/** Desktop-only bridge to compilers/interpreters installed on the learner's PC (electron/toolchains.cjs). */
type ToolsBridge = {
  detect: (force?: boolean) => Promise<Partial<Record<NativeLang, { tool: string; compileOnly?: boolean } | null>>>;
  run: (lang: NativeLang, code: string) => Promise<{ ok: boolean; output: string; error?: string; compileError?: boolean; missing?: boolean }>;
};

const bridge = (globalThis as { devquestTools?: ToolsBridge }).devquestTools;

export const BROWSER_LANGS: CodeLang[] = ['python', 'javascript', 'typescript', 'sql', 'web', 'lua', 'postgres', 'mongodb', 'mysql', 'redis'];
export const runsInApp = (lang: CodeLang) => BROWSER_LANGS.includes(lang);
export const hasToolBridge = !!bridge;

type ToolState = { langs: Partial<Record<NativeLang, { tool: string; compileOnly?: boolean } | null>>; loaded: boolean; refresh: (force?: boolean) => Promise<void> };

/** Which local toolchains the desktop app found (empty on web/Android). */
export const useTools = create<ToolState>((set) => ({
  langs: {},
  loaded: !bridge,
  refresh: async (force = false) => {
    if (!bridge) return;
    set({ langs: await bridge.detect(force), loaded: true });
  },
}));

if (bridge) void useTools.getState().refresh();

export function localTool(lang: CodeLang) {
  return useTools.getState().langs[lang as NativeLang] ?? null;
}

export async function runLocal(lang: NativeLang, code: string) {
  if (!bridge) throw new Error('Local toolchains are only available in the desktop app.');
  return bridge.run(lang, code);
}

/** Official download pages, shown when a toolchain is missing. */
export const INSTALL_URL: Record<NativeLang, string> = {
  go: 'https://go.dev/dl/',
  rust: 'https://rustup.rs/',
  c: 'https://visualstudio.microsoft.com/visual-cpp-build-tools/',
  cpp: 'https://visualstudio.microsoft.com/visual-cpp-build-tools/',
  java: 'https://adoptium.net/',
  kotlin: 'https://kotlinlang.org/docs/command-line.html',
  swift: 'https://www.swift.org/install/',
  csharp: 'https://dotnet.microsoft.com/download',
  dart: 'https://dart.dev/get-dart',
  ruby: 'https://rubyinstaller.org/',
  php: 'https://windows.php.net/download/',
  r: 'https://cran.r-project.org/',
  bash: 'https://git-scm.com/downloads',
  powershell: 'https://aka.ms/powershell',
  solidity: 'https://docs.soliditylang.org/en/latest/installing-solidity.html',
};
