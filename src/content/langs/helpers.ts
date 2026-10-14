import type { CodeLang, Lesson, Track } from '../types';
import { exercisesOf } from '../exercises';

type Ex = { prompt: string; starter: string; solution: string; expected: string; hints: string[] };

/** One language lesson: markdown body + an exercise checked by exact program output. */
export function lesson(id: string, title: string, body: string, ex: Ex, cards: [string, string][] = [], xp = 45): Lesson {
  return {
    id,
    title,
    xp,
    body,
    exercise: { kind: 'code', lang: undefined as unknown as CodeLang, prompt: ex.prompt, starter: ex.starter, solution: ex.solution, hints: ex.hints, check: { type: 'stdout', expected: ex.expected } },
    cards: cards.map(([front, back]) => ({ front, back })),
  };
}

/** A language track: every exercise in it uses the track's language. */
export function langTrack(t: Omit<Track, 'kind' | 'depth' | 'tier'> & { lang: CodeLang; tier?: number }): Track {
  for (const l of t.lessons) for (const e of exercisesOf(l)) if (e.kind === 'code') e.lang = t.lang;
  return { ...t, tier: t.tier ?? 1, kind: 'language', depth: 'full' };
}
