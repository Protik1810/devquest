import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { deviceStorage, SAVE_KEY } from './deviceSave';
import { stripKeys } from './secrets';
import { daysBetween, levelFromXp, today } from './levels';
import { toast } from './toast';
import { cfgFor, type ProviderCfg, type ProviderId } from './providers';
import type { ProjectGrade } from './ai';
import type { Project } from '../content/types';
import { LANGUAGE_TRACKS } from '../content';
import { focusTracks } from '../content/focus';

const langsStarted = (s: State) => LANGUAGE_TRACKS.filter((t) => t.lessons.some((l) => s.completed[l.id])).length;
const trackDone = (s: State, ids: string[]) => ids.length > 0 && ids.every((id) => s.completed[id]);

export type SrsCard = { due: string; interval: number; ease: number; reps: number };
/** Schedule of a coding drill: an exercise from a finished lesson, practised again at growing intervals. */
export type DrillState = { due: string; interval: number; reps: number };

type Daily = {
  date: string;
  lessons: number;
  xp: number;
  reviews: number;
  commands: number;
  runs: number;
  claimed: string[];
};

type Stats = {
  commands: number;
  runs: number;
  perfect: number;
  hints: number;
  solutions: number;
  reviews: number;
  vizOpened: number;
  tutorQuestions: number;
  questsClaimed: number;
  placementsPassed: number;
  aiReviews: number;
  projectsGraded: number;
  agentTurns: number;
};

export type Settings = {
  provider: ProviderId;
  providers: Partial<Record<ProviderId, ProviderCfg>>;
  theme: ThemeId;
};

export type ThemeId = 'dark' | 'light' | 'void' | 'neon' | 'cinema' | 'synthwave' | 'anime' | 'matrix';

export type ProjectState = { code: string; grades: ProjectGrade[]; best: number };

export type State = {
  name: string;
  xp: number;
  gems: number;
  completed: Record<string, { xp: number; at: string }>;
  streak: { count: number; best: number; last: string };
  freezes: number;
  potionUntil: number;
  achievements: Record<string, string>;
  srs: Record<string, SrsCard>;
  daily: Daily;
  stats: Stats;
  xpLog: Record<string, number>;
  settings: Settings;
  projects: Record<string, ProjectState>;
  customProjects: Project[];
  /** Failed attempts per lesson/challenge, to suggest weak spots to practise. */
  struggles?: Record<string, number>;
  /** Coding drills by "<lessonId>#<step>". */
  drills?: Record<string, DrillState>;
  /** Chosen learning focus: a career path id, "lang:<trackId>" for a single language, or null = explore freely. undefined = not chosen yet. */
  path?: { id: string; choices: Record<string, string> } | null;
};

type Actions = {
  setName: (n: string) => void;
  completeLesson: (id: string, baseXp: number, opts?: { hints?: number; solution?: boolean; perfect?: boolean; scale?: number }) => number;
  addXp: (amount: number, reason: string) => number;
  bump: (stat: keyof Stats, by?: number) => void;
  noteStruggle: (id: string) => void;
  buy: (item: ShopItemId) => boolean;
  reviewCard: (id: string, grade: 0 | 1 | 2 | 3) => void;
  /** Record a coding drill: solved cleanly pushes it further out, otherwise it comes back tomorrow. */
  reviewDrill: (key: string, solvedCleanly: boolean) => void;
  claimQuest: (id: string) => void;
  updateSettings: (s: Partial<Settings>) => void;
  updateProvider: (id: ProviderId, cfg: Partial<ProviderCfg>) => void;
  importState: (s: Partial<State>) => void;
  saveProjectCode: (id: string, code: string) => void;
  addProjectGrade: (project: Project, grade: ProjectGrade) => number;
  addCustomProject: (p: Project) => void;
  removeCustomProject: (id: string) => void;
  setPath: (id: string | null, choices?: Record<string, string>) => void;
  setPathChoice: (key: string, trackId: string) => void;
  reset: () => void;
};

export type ShopItemId = 'freeze' | 'potion' | 'gemPack';

export const SHOP: { id: ShopItemId; name: string; emoji: string; cost: number; desc: string }[] = [
  { id: 'freeze', name: 'Streak Freeze', emoji: '🧊', cost: 50, desc: 'Used up automatically if you miss a day, so your streak survives. You can hold up to 3.' },
  { id: 'potion', name: 'XP Potion', emoji: '🧪', cost: 30, desc: '+50% XP on everything you do for the next 30 minutes.' },
];

const freshDaily = (): Daily => ({ date: today(), lessons: 0, xp: 0, reviews: 0, commands: 0, runs: 0, claimed: [] });

const initial: State = {
  name: '',
  xp: 0,
  gems: 20,
  completed: {},
  streak: { count: 0, best: 0, last: '' },
  freezes: 0,
  potionUntil: 0,
  achievements: {},
  srs: {},
  daily: freshDaily(),
  stats: { commands: 0, runs: 0, perfect: 0, hints: 0, solutions: 0, reviews: 0, vizOpened: 0, tutorQuestions: 0, questsClaimed: 0, placementsPassed: 0, aiReviews: 0, projectsGraded: 0, agentTurns: 0 },
  xpLog: {},
  settings: { provider: 'anthropic', providers: {}, theme: 'dark' },
  projects: {},
  customProjects: [],
};

// ---------- Quests ----------
export type Quest = { id: string; title: string; emoji: string; goal: number; key: keyof Omit<Daily, 'date' | 'claimed'>; gems: number; xp: number };

const QUEST_POOL: Quest[] = [
  { id: 'lessons3', title: 'Complete 3 lessons', emoji: '📘', goal: 3, key: 'lessons', gems: 15, xp: 30 },
  { id: 'lessons1', title: 'Complete a lesson', emoji: '✅', goal: 1, key: 'lessons', gems: 5, xp: 10 },
  { id: 'xp150', title: 'Earn 150 XP', emoji: '⭐', goal: 150, key: 'xp', gems: 15, xp: 0 },
  { id: 'xp60', title: 'Earn 60 XP', emoji: '✨', goal: 60, key: 'xp', gems: 8, xp: 0 },
  { id: 'reviews10', title: 'Review 10 flashcards', emoji: '🃏', goal: 10, key: 'reviews', gems: 10, xp: 20 },
  { id: 'reviews5', title: 'Review 5 flashcards', emoji: '🧠', goal: 5, key: 'reviews', gems: 6, xp: 10 },
  { id: 'cmd15', title: 'Run 15 terminal commands', emoji: '⌨️', goal: 15, key: 'commands', gems: 10, xp: 20 },
  { id: 'runs5', title: 'Run your code 5 times', emoji: '▶️', goal: 5, key: 'runs', gems: 8, xp: 15 },
];

/** Three quests per day, picked deterministically from the date. */
export function questsFor(date: string): Quest[] {
  let seed = [...date].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
  const pool = [...QUEST_POOL];
  const out: Quest[] = [];
  while (out.length < 3 && pool.length) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    const q = pool.splice(seed % pool.length, 1)[0];
    if (!out.some((o) => o.key === q.key)) out.push(q);
  }
  return out;
}

// ---------- Achievements ----------
export type Achievement = { id: string; name: string; emoji: string; desc: string; test: (s: State) => boolean };

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first', name: 'Hello, World', emoji: '👋', desc: 'Complete your first lesson', test: (s) => Object.keys(s.completed).length >= 1 },
  { id: 'ten', name: 'Getting Serious', emoji: '📚', desc: 'Complete 10 lessons', test: (s) => Object.keys(s.completed).length >= 10 },
  { id: 'fifty', name: 'Bookworm', emoji: '🐛', desc: 'Complete 50 lessons', test: (s) => Object.keys(s.completed).length >= 50 },
  { id: 'streak3', name: 'On Fire', emoji: '🔥', desc: 'Reach a 3-day streak', test: (s) => s.streak.best >= 3 },
  { id: 'streak7', name: 'Unstoppable', emoji: '☄️', desc: 'Reach a 7-day streak', test: (s) => s.streak.best >= 7 },
  { id: 'streak30', name: 'Habit Formed', emoji: '🏆', desc: 'Reach a 30-day streak', test: (s) => s.streak.best >= 30 },
  { id: 'lvl5', name: 'Level 5', emoji: '⭐', desc: 'Reach level 5', test: (s) => levelFromXp(s.xp).level >= 5 },
  { id: 'lvl10', name: 'Engineer', emoji: '⚙️', desc: 'Reach level 10', test: (s) => levelFromXp(s.xp).level >= 10 },
  { id: 'lvl20', name: 'Architect', emoji: '🏛️', desc: 'Reach level 20', test: (s) => levelFromXp(s.xp).level >= 20 },
  { id: 'shell50', name: 'Terminal Tamer', emoji: '🐚', desc: 'Run 50 terminal commands', test: (s) => s.stats.commands >= 50 },
  { id: 'runs25', name: 'Run It Back', emoji: '▶️', desc: 'Run code 25 times', test: (s) => s.stats.runs >= 25 },
  { id: 'perfect5', name: 'Flawless', emoji: '💎', desc: 'Finish 5 exercises with no hints', test: (s) => s.stats.perfect >= 5 },
  { id: 'review50', name: 'Memory Palace', emoji: '🧠', desc: 'Review 50 flashcards', test: (s) => s.stats.reviews >= 50 },
  { id: 'viz5', name: 'Visual Learner', emoji: '👀', desc: 'Play with 5 visualizers', test: (s) => s.stats.vizOpened >= 5 },
  { id: 'tutor', name: 'Curious Mind', emoji: '🦉', desc: 'Ask the AI tutor a question', test: (s) => s.stats.tutorQuestions >= 1 },
  { id: 'quests10', name: 'Quest Hunter', emoji: '🗺️', desc: 'Claim 10 daily quests', test: (s) => s.stats.questsClaimed >= 10 },
  { id: 'placement', name: 'Skip Ahead', emoji: '⏩', desc: 'Pass a placement test', test: (s) => s.stats.placementsPassed >= 1 },
  { id: 'reviewer', name: 'Open to Feedback', emoji: '🤖', desc: 'Get 5 AI code reviews', test: (s) => s.stats.aiReviews >= 5 },
  { id: 'builder', name: 'Builder', emoji: '🏗️', desc: 'Submit your first project for grading', test: (s) => s.stats.projectsGraded >= 1 },
  { id: 'honor', name: 'Honor Roll', emoji: '🅰️', desc: 'Score 90+ on a project', test: (s) => Object.values(s.projects).some((p) => p.best >= 90) },
  { id: 'portfolio', name: 'Portfolio Ready', emoji: '💼', desc: 'Score 80+ on 3 different projects', test: (s) => Object.values(s.projects).filter((p) => p.best >= 80).length >= 3 },
  { id: 'dojo10', name: 'Dojo Disciple', emoji: '🥋', desc: 'Solve 10 Code Dojo challenges', test: (s) => Object.keys(s.completed).filter((k) => k.startsWith('dojo-')).length >= 10 },
  { id: 'pathfinder', name: 'Pathfinder', emoji: '🧭', desc: 'Choose a career path or language focus', test: (s) => !!s.path },
  { id: 'polyglot3', name: 'Polyglot', emoji: '🗣️', desc: 'Complete lessons in 3 different languages', test: (s) => langsStarted(s) >= 3 },
  { id: 'polyglot8', name: 'Babel Fish', emoji: '🐟', desc: 'Complete lessons in 8 different languages', test: (s) => langsStarted(s) >= 8 },
  { id: 'langdone', name: 'Fluent', emoji: '🎓', desc: 'Finish every lesson of one language', test: (s) => LANGUAGE_TRACKS.some((t) => trackDone(s, t.lessons.map((l) => l.id))) },
  { id: 'pathdone', name: 'Job Ready', emoji: '💼', desc: 'Complete every track in your career path', test: (s) => !!s.path && !s.path.id.startsWith('lang:') && trackDone(s, focusTracks(s.path).flatMap((t) => t.lessons.map((l) => l.id))) },
  { id: 'labpartner', name: 'Lab Partner', emoji: '🧪', desc: 'Work with Owl in the Agent Lab', test: (s) => (s.stats.agentTurns ?? 0) >= 1 },
  { id: 'agent25', name: 'Agentic Apprentice', emoji: '🛠️', desc: 'Complete 25 Agent Lab sessions with Owl', test: (s) => (s.stats.agentTurns ?? 0) >= 25 },
  { id: 'rich', name: 'Gem Hoarder', emoji: '💰', desc: 'Hold 200 gems at once', test: (s) => s.gems >= 200 },
];

// ---------- helpers ----------
function rollDaily(s: State): Partial<State> {
  return s.daily.date === today() ? {} : { daily: freshDaily() };
}

/** Update the streak for activity today. Missed days are covered by freezes when available. */
function touchStreak(s: State): Partial<State> {
  const t = today();
  const { last, count, best } = s.streak;
  if (last === t) return {};
  let freezes = s.freezes;
  let next = 1;
  if (last) {
    const gap = daysBetween(last, t);
    const missed = gap - 1;
    if (gap === 1) next = count + 1;
    else if (missed > 0 && missed <= freezes) {
      freezes -= missed;
      next = count + 1;
      toast({ kind: 'info', title: `🧊 ${missed} Streak Freeze${missed > 1 ? 's' : ''} used`, body: 'Your streak survived!' });
    }
  }
  return { streak: { count: next, best: Math.max(best, next), last: t }, freezes };
}

function checkAchievements(s: State): Record<string, string> | null {
  const got = { ...s.achievements };
  let changed = false;
  for (const a of ACHIEVEMENTS) {
    if (!got[a.id] && a.test(s)) {
      got[a.id] = today();
      changed = true;
      toast({ kind: 'achievement', title: `${a.emoji} Achievement unlocked: ${a.name}`, body: a.desc });
    }
  }
  return changed ? got : null;
}

export const useGame = create<State & Actions>()(
  persist(
    (set, get) => {
      /** Apply XP (with potion), log it, detect level-ups, and re-check achievements. */
      const grant = (amount: number, gemsAdd = 0, extra: Partial<State> = {}) => {
        const s0 = { ...get(), ...rollDaily(get()) } as State;
        const potion = Date.now() < s0.potionUntil;
        const gained = Math.round(amount * (potion ? 1.5 : 1));
        const before = levelFromXp(s0.xp).level;
        const xp = s0.xp + gained;
        const after = levelFromXp(xp).level;
        let gems = s0.gems + gemsAdd;
        if (after > before) {
          gems += 25 * (after - before);
          toast({ kind: 'level', title: `🎉 Level up! You reached level ${after}`, body: '+25 💎 bonus' });
        }
        const t = today();
        const next: State = {
          ...s0,
          ...extra,
          ...touchStreak(s0),
          xp,
          gems,
          daily: { ...(extra.daily ?? s0.daily), xp: (extra.daily ?? s0.daily).xp + gained },
          xpLog: { ...s0.xpLog, [t]: (s0.xpLog[t] ?? 0) + gained },
        };
        const ach = checkAchievements(next);
        set(ach ? { ...next, achievements: ach } : next);
        return gained;
      };

      return {
        ...initial,
        setName: (name) => set({ name }),

        completeLesson: (id, baseXp, opts = {}) => {
          const s = get();
          if (s.completed[id]) return 0;
          // Each hint costs 15% of the lesson XP; viewing the solution forfeits it
          let mult = opts.scale ?? 1;
          if (opts.solution) mult = 0;
          else mult *= Math.max(0.25, 1 - 0.15 * (opts.hints ?? 0));
          const amount = Math.round(baseXp * mult);
          const s0 = { ...s, ...rollDaily(s) } as State;
          const stats = { ...s0.stats, perfect: s0.stats.perfect + (opts.perfect ? 1 : 0) };
          const daily = { ...s0.daily, lessons: s0.daily.lessons + 1 };
          const gems = opts.solution ? 0 : opts.perfect ? 5 : 2;
          const gained = grant(amount, gems, {
            completed: { ...s0.completed, [id]: { xp: amount, at: today() } },
            stats,
            daily,
          });
          toast({ kind: 'xp', title: `+${gained} XP`, body: gems ? `+${gems} 💎` : 'Solution viewed: no XP this time' });
          return gained;
        },

        addXp: (amount, reason) => {
          const gained = grant(amount);
          if (gained) toast({ kind: 'xp', title: `+${gained} XP`, body: reason });
          return gained;
        },

        noteStruggle: (id) => set({ struggles: { ...(get().struggles ?? {}), [id]: ((get().struggles ?? {})[id] ?? 0) + 1 } }),
        bump: (stat, by = 1) => {
          const s0 = { ...get(), ...rollDaily(get()) } as State;
          const daily = { ...s0.daily };
          if (stat === 'commands') daily.commands += by;
          if (stat === 'runs') daily.runs += by;
          if (stat === 'reviews') daily.reviews += by;
          const next = { ...s0, daily, stats: { ...s0.stats, [stat]: (s0.stats[stat] ?? 0) + by } };
          const ach = checkAchievements(next);
          set(ach ? { ...next, achievements: ach } : next);
        },

        buy: (item) => {
          const s = get();
          const def = SHOP.find((i) => i.id === item)!;
          if (s.gems < def.cost) return false;
          if (item === 'freeze') {
            if (s.freezes >= 3) return false;
            set({ gems: s.gems - def.cost, freezes: s.freezes + 1 });
          } else if (item === 'potion') {
            const start = Math.max(Date.now(), s.potionUntil);
            set({ gems: s.gems - def.cost, potionUntil: start + 30 * 60 * 1000 });
          }
          toast({ kind: 'info', title: `${def.emoji} ${def.name} purchased` });
          return true;
        },

        // Simplified SM-2: grade 0=again 1=hard 2=good 3=easy
        reviewCard: (id, grade) => {
          const s = get();
          const c = s.srs[id] ?? { due: today(), interval: 0, ease: 2.5, reps: 0 };
          let { interval, ease, reps } = c;
          if (grade === 0) {
            reps = 0;
            interval = 0;
            ease = Math.max(1.3, ease - 0.2);
          } else {
            reps += 1;
            ease = Math.max(1.3, ease + (grade - 2) * 0.15);
            interval = reps === 1 ? (grade === 3 ? 3 : 1) : reps === 2 ? 3 : Math.round(interval * ease * (grade === 1 ? 0.6 : 1));
          }
          const due = new Date();
          due.setDate(due.getDate() + interval);
          set({ srs: { ...s.srs, [id]: { due: today(due), interval, ease, reps } } });
          get().bump('reviews');
          grant(grade === 0 ? 1 : 3);
        },

        reviewDrill: (key, ok) => {
          const s = get();
          const c = s.drills?.[key] ?? { due: today(), interval: 0, reps: 0 };
          const reps = ok ? c.reps + 1 : 0;
          const interval = !ok ? 1 : reps === 1 ? 4 : Math.round(Math.max(4, c.interval) * 2.5);
          const due = new Date();
          due.setDate(due.getDate() + interval);
          set({ drills: { ...(s.drills ?? {}), [key]: { due: today(due), interval, reps } } });
          grant(ok ? 10 : 3);
          toast({ kind: 'xp', title: ok ? '🧠 Drill done: +10 XP' : '🧠 Drill done', body: ok ? `Next review in ${interval} days` : 'It will come back tomorrow for another try' });
        },

        claimQuest: (id) => {
          const s0 = { ...get(), ...rollDaily(get()) } as State;
          const q = questsFor(s0.daily.date).find((x) => x.id === id);
          if (!q || s0.daily.claimed.includes(id) || s0.daily[q.key] < q.goal) return;
          set({ daily: { ...s0.daily, claimed: [...s0.daily.claimed, id] }, stats: { ...s0.stats, questsClaimed: s0.stats.questsClaimed + 1 } });
          grant(q.xp, q.gems);
          toast({ kind: 'xp', title: `${q.emoji} Quest complete!`, body: `+${q.gems} 💎${q.xp ? `  +${q.xp} XP` : ''}` });
        },

        updateSettings: (p) => set({ settings: { ...get().settings, ...p } }),
        updateProvider: (id, cfg) => {
          const st = get().settings;
          set({ settings: { ...st, providers: { ...st.providers, [id]: { ...cfgFor(id, st.providers[id]), ...cfg } } } });
        },
        importState: (p) => set({ ...initial, ...p }),

        saveProjectCode: (id, code) => {
          const cur = get().projects[id] ?? { code: '', grades: [], best: 0 };
          set({ projects: { ...get().projects, [id]: { ...cur, code } } });
        },

        // XP is awarded only for improving on your best grade, so resubmitting can't farm XP
        addProjectGrade: (project, grade) => {
          const s0 = get();
          const cur = s0.projects[project.id] ?? { code: '', grades: [], best: 0 };
          const best = Math.max(cur.best, grade.score);
          const xpGain = Math.round((project.xp * (best - cur.best)) / 100);
          const firstB = cur.best < 80 && best >= 80;
          set({
            projects: { ...s0.projects, [project.id]: { ...cur, grades: [grade, ...cur.grades].slice(0, 20), best } },
            stats: { ...s0.stats, projectsGraded: s0.stats.projectsGraded + 1 },
          });
          const gained = xpGain || firstB ? grant(xpGain, firstB ? 15 : 0) : 0;
          if (!xpGain && !firstB) {
            const ach = checkAchievements(get());
            if (ach) set({ achievements: ach });
          }
          toast({ kind: 'xp', title: `${grade.letter} · ${grade.score}/100`, body: gained ? `+${gained} XP${firstB ? '  +15 💎' : ''}` : 'Beat your best score to earn more XP' });
          return gained;
        },

        setPath: (id, choices = {}) => set({ path: id === null ? null : { id, choices } }),
        setPathChoice: (key, trackId) => {
          const p = get().path;
          if (p) set({ path: { ...p, choices: { ...p.choices, [key]: trackId } } });
        },

        addCustomProject: (p) => set({ customProjects: [p, ...get().customProjects] }),
        removeCustomProject: (id) => {
          const { [id]: _drop, ...rest } = get().projects;
          set({ customProjects: get().customProjects.filter((x) => x.id !== id), projects: rest });
        },
        reset: () => set({ ...initial, daily: freshDaily() }),
      };
    },
    {
      name: SAVE_KEY,
      version: 4,
      // localStorage plus a mirrored save file in the app's data folder (desktop/Android), see deviceSave.ts
      storage: createJSONStorage(() => deviceStorage),
      // API keys live in secure storage (see secrets.ts), never in the save or its files
      partialize: (s) => ({ ...s, settings: { ...s.settings, providers: stripKeys(s.settings.providers) } }),
      // v1 stored a single Anthropic key/model; move it into the per-provider map
      migrate: (persisted, version) => {
        const st = persisted as State & { settings: Settings & { apiKey?: string; model?: string } };
        if (version < 2 && st?.settings) {
          const { apiKey = '', model = 'claude-opus-5-5', theme = 'dark' } = st.settings;
          st.settings = { provider: 'anthropic', providers: { anthropic: cfgFor('anthropic', { apiKey, model }) }, theme };
        }
        if (version < 3 && st) {
          st.projects ??= {};
          st.customProjects ??= [];
          st.stats = { ...initial.stats, ...st.stats };
        }
        return st;
      },
    },
  ),
);

/** Read today's daily counters, treating a stale day as empty. */
export const useDaily = () => {
  const d = useGame((s) => s.daily);
  return d.date === today() ? d : freshDaily();
};
