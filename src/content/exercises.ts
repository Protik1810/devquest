import type { Exercise, Lesson } from './types';

/** All exercises of a lesson, in order (lessons may define one `exercise` or several `exercises`). */
export const exercisesOf = (l: Lesson): Exercise[] => l.exercises ?? (l.exercise ? [l.exercise] : []);

/** Exercises that run code (shown beside the lesson text rather than under it). */
export const isHandsOn = (e: Exercise) => e.kind !== 'quiz';

/** A rough time estimate for a lesson, in minutes (reading plus each exercise), rounded to 5. */
export function lessonMinutes(l: Lesson): number {
  const words = l.body.match(/\S+/g)?.length ?? 0;
  let minutes = words / 180;
  for (const e of exercisesOf(l)) minutes += e.kind === 'quiz' ? e.questions.length * 0.6 : e.kind === 'code' ? 7 : e.kind === 'terminal' ? 6 : 4;
  return Math.max(5, Math.round(minutes / 5) * 5);
}

export const KIND_ICON = { quiz: '❓', code: '💻', terminal: '🐚', parsons: '🧩', fill: '✏️' } as const;
export const KIND_NAME = { quiz: 'Quiz', code: 'Exercise', terminal: 'Terminal', parsons: 'Puzzle', fill: 'Fill in' } as const;
