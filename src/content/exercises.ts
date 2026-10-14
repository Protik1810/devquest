import type { Exercise, Lesson } from './types';

/** All exercises of a lesson, in order (lessons may define one `exercise` or several `exercises`). */
export const exercisesOf = (l: Lesson): Exercise[] => l.exercises ?? (l.exercise ? [l.exercise] : []);
