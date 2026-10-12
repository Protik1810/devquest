import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { AGENT_KEY, deviceStorage } from '../deviceSave';
import type { AgentMode } from './agent';
import type { AgentMsg, Protocol } from './llm';

export type TermLine = { by: 'you' | 'owl' | 'sys'; cmd?: string; text: string; ok?: boolean };

const WELCOME_FILES: Record<string, string> = {
  'README.md': `# Agent Lab workspace

This folder is a sandbox shared by you and Owl, the AI mentor.

- Files here live only inside DevQuest on this device.
- The terminal is simulated: try \`ls\`, \`cat README.md\`, \`python hello.py\`.
- Programs run in an isolated sandbox with no network access.
`,
  'hello.py': 'name = "DevQuest"\nprint(f"Hello from the {name} sandbox!")\n',
};

type AgentState = {
  mode: AgentMode;
  messages: AgentMsg[];
  files: Record<string, string>;
  /** Files the learner created or edited (protected from the agent in Tutor and Debug modes). */
  learnerFiles: string[];
  openPath: string | null;
  terminal: TermLine[];
  /** 'auto' starts with native tool calling and falls back to the text protocol when the model lacks it. */
  protocol: 'auto' | 'text';
  /** Remembered per provider+model once a model turned out not to support native tools. */
  textOnly: Record<string, true>;
  /** Tokens used by this chat (as reported by the provider), to keep costs visible. */
  usage: { input: number; output: number; calls: number };
  addUsage: (u: { input: number; output: number }) => void;
  setMode: (m: AgentMode) => void;
  addMessage: (m: AgentMsg) => void;
  setFiles: (files: Record<string, string>) => void;
  markLearnerFile: (path: string) => void;
  setOpenPath: (p: string | null) => void;
  addTerminal: (l: TermLine) => void;
  clearTerminal: () => void;
  newChat: () => void;
  resetWorkspace: () => void;
  setProtocol: (p: 'auto' | 'text') => void;
  rememberTextOnly: (key: string) => void;
  effectiveProtocol: (key: string) => Protocol;
};

export const useAgent = create<AgentState>()(
  persist(
    (set, get) => ({
      mode: 'tutor',
      messages: [],
      files: WELCOME_FILES,
      learnerFiles: [],
      openPath: 'hello.py',
      terminal: [],
      protocol: 'auto',
      textOnly: {},
      usage: { input: 0, output: 0, calls: 0 },
      addUsage: (u) => {
        const cur = get().usage ?? { input: 0, output: 0, calls: 0 };
        set({ usage: { input: cur.input + u.input, output: cur.output + u.output, calls: cur.calls + 1 } });
      },
      setMode: (mode) => set({ mode }),
      addMessage: (m) => set({ messages: [...get().messages, m].slice(-300) }),
      setFiles: (files) => {
        const learnerFiles = get().learnerFiles.filter((f) => f in files);
        const openPath = get().openPath && get().openPath! in files ? get().openPath : null;
        set({ files, learnerFiles, openPath });
      },
      markLearnerFile: (path) => {
        if (!get().learnerFiles.includes(path)) set({ learnerFiles: [...get().learnerFiles, path] });
      },
      setOpenPath: (openPath) => set({ openPath }),
      addTerminal: (l) => set({ terminal: [...get().terminal, { ...l, text: l.text.slice(0, 4000) }].slice(-200) }),
      clearTerminal: () => set({ terminal: [] }),
      newChat: () => set({ messages: [], usage: { input: 0, output: 0, calls: 0 } }),
      resetWorkspace: () => set({ files: WELCOME_FILES, learnerFiles: [], openPath: 'hello.py', terminal: [], messages: [], usage: { input: 0, output: 0, calls: 0 } }),
      setProtocol: (protocol) => set({ protocol }),
      rememberTextOnly: (key) => set({ textOnly: { ...get().textOnly, [key]: true } }),
      effectiveProtocol: (key) => (get().protocol === 'text' || get().textOnly[key] ? 'text' : 'native'),
    }),
    // Saved on this device (localStorage + a mirrored file in the desktop/Android app data folder)
    { name: AGENT_KEY, version: 1, storage: createJSONStorage(() => deviceStorage) },
  ),
);
