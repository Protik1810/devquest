import type { Track } from './types';
import { TRACKS } from './index';

type Completed = Record<string, unknown>;

export const trackProgress = (t: Track, done: Completed) => {
  const n = t.lessons.filter((l) => done[l.id]).length;
  return { done: n, total: t.lessons.length, pct: t.lessons.length ? n / t.lessons.length : 0 };
};

/** A lesson is open once the one before it is done (the first is always open). */
export const isUnlocked = (t: Track, index: number, done: Completed) => index === 0 || !!done[t.lessons[index - 1].id] || !!done[t.lessons[index].id];

export const nextLessonIn = (t: Track, done: Completed) => t.lessons.find((l) => !done[l.id]);

/**
 * The recommended next lesson. With a focus (career path or language), follow its track order;
 * otherwise continue a started track, or start the next one in tier order.
 */
export function nextLesson(done: Completed, focus: Track[] = []) {
  if (focus.length) {
    for (const t of focus) {
      const l = nextLessonIn(t, done);
      if (l) return { track: t, lesson: l };
    }
    return null;
  }
  const ordered = [...TRACKS].sort((a, b) => a.tier - b.tier);
  for (const t of ordered) {
    const p = trackProgress(t, done);
    if (p.done > 0 && p.done < p.total) return { track: t, lesson: nextLessonIn(t, done)! };
  }
  for (const t of ordered) {
    const l = nextLessonIn(t, done);
    if (l) return { track: t, lesson: l };
  }
  return null;
}

/** Overall progress through a list of tracks (e.g. a career path). */
export function tracksProgress(tracks: Track[], done: Completed) {
  const total = tracks.reduce((a, t) => a + t.lessons.length, 0);
  const n = tracks.reduce((a, t) => a + t.lessons.filter((l) => done[l.id]).length, 0);
  return { done: n, total, pct: total ? n / total : 0 };
}
