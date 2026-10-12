import type { Shell } from '../engine/shell';

/** Languages that run inside the app (browser, desktop and Android). */
export type BrowserLang = 'python' | 'javascript' | 'typescript' | 'sql' | 'web' | 'lua' | 'postgres' | 'mongodb' | 'mysql' | 'redis';
/** Languages that need a compiler/interpreter on the learner's PC (desktop app), with AI checking as the fallback. */
export type NativeLang = 'go' | 'rust' | 'c' | 'cpp' | 'java' | 'kotlin' | 'swift' | 'csharp' | 'dart' | 'ruby' | 'php' | 'r' | 'bash' | 'powershell' | 'solidity';
export type CodeLang = BrowserLang | NativeLang;

export type QuizQuestion = {
  q: string;
  options: string[];
  answer: number;
  explain?: string;
};

export type CodeCheck =
  /**
   * Exact program output. `variants` are hidden-input swaps (find → replace on the whole program, applied to the
   * learner's code and to the reference solution); after a pass, both must print the same thing with the swaps.
   */
  | { type: 'stdout'; expected: string; variants?: [string, string][]; /** Hidden code run before the learner's (e.g. MongoDB seed data). */ setup?: string; /** Hidden checking commands run after the learner's code; their output must equal `expected` (Redis). */ verify?: string }
  | { type: 'tests'; code: string }
  /** SQL: compare the last result with the reference query (`expected`). With `verify`, compare that query's result after each script instead. */
  | { type: 'sql'; setup: string; expected: string; ordered?: boolean; verify?: string }
  /** JS run inside the learner's page after it loads. Use assert(cond, msg). */
  | { type: 'web'; tests: string };

export type CodeExercise = {
  kind: 'code';
  lang: CodeLang;
  prompt: string;
  starter: string;
  solution: string;
  hints: string[];
  check: CodeCheck;
};

export type TerminalMission = {
  task: string;
  hint: string;
  check: (sh: Shell, lastCmd: string) => boolean;
};

export type TerminalExercise = {
  kind: 'terminal';
  prompt: string;
  setup?: (sh: Shell) => void;
  missions: TerminalMission[];
};

export type QuizExercise = { kind: 'quiz'; questions: QuizQuestion[] };

export type Exercise = CodeExercise | TerminalExercise | QuizExercise;

export type Flashcard = { front: string; back: string };

export type Lesson = {
  id: string;
  title: string;
  /** Markdown. `{{ill:name}}` on its own line embeds an illustration, `{{viz:name}}` a visualizer. */
  body: string;
  exercise?: Exercise;
  cards?: Flashcard[];
  xp?: number;
};

export type Track = {
  id: string;
  title: string;
  icon: string;
  tier: number;
  color: string;
  blurb: string;
  /** 'full' = hands-on track; 'overview' = illustrated primer, more lessons coming */
  depth: 'full' | 'overview';
  /** core = CS & engineering fundamentals, language = one programming language, skill = a specialization */
  kind?: 'core' | 'language' | 'skill';
  /** For language tracks: the language its exercises use. */
  lang?: CodeLang;
  /** Fields where this track is used (shown on language cards). */
  fields?: string[];
  lessons: Lesson[];
};

export type Tier = { tier: number; name: string; subtitle: string };

export type Rubric = { criterion: string; points: number; description: string };

/** A bigger build, graded by automated tests (optional) plus an AI rubric. */
export type Project = {
  id: string;
  title: string;
  emoji: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  lang: 'python' | 'javascript' | 'web';
  /** Related track ids, for "practise what you learned" links. */
  tracks?: string[];
  brief: string;
  requirements: string[];
  rubric: Rubric[];
  starter: string;
  /** Automated checks, in the same format as code exercises. */
  tests?: string;
  hints?: string[];
  /** Shown only after the first graded submission. */
  solution?: string;
  xp: number;
  custom?: boolean;
};

/** A standalone practice problem in the Code Dojo. */
export type Challenge = {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  xp: number;
  exercise: CodeExercise;
};

/** A step in a career path: a fixed track, or a choice between tracks (e.g. which backend language). */
export type PathStep = string | { choose: string; label: string; options: string[] };

export type CareerPath = {
  id: string;
  title: string;
  icon: string;
  color: string;
  blurb: string;
  /** Typical job titles this path leads to. */
  roles: string[];
  /** What the learner will be able to do at the end. */
  outcomes: string[];
  /** Ordered stages: each stage groups steps. */
  stages: { name: string; steps: PathStep[] }[];
  /** Project ids recommended for this path. */
  projects: string[];
};
