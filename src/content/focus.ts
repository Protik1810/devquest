import type { CareerPath, Track } from './types';
import { PATHS, pathById, pathTrackIds } from './paths';
import { trackById } from './index';

/** A single-language focus is modelled as a tiny path: just that language (and its practice). */
export function languagePath(track: Track): CareerPath {
  return {
    id: `lang:${track.id}`,
    title: `${track.title}`,
    icon: track.icon,
    color: track.color,
    blurb: `Focus on ${track.title} only. Skip everything else and come back to other tracks whenever you like.`,
    roles: track.fields ?? [],
    outcomes: [`Read and write idiomatic ${track.title}`, 'Use its core data structures and error handling', 'Finish the mini project', 'Practise in the Code Dojo and Playground'],
    stages: [{ name: 'Language', steps: [track.id] }],
    projects: [],
  };
}

/** The learner's current focus as a path object, or null when exploring freely / not chosen. */
export function focusPath(focus: { id: string } | null | undefined): CareerPath | null {
  if (!focus) return null;
  if (focus.id.startsWith('lang:')) {
    const t = trackById(focus.id.slice(5));
    return t ? languagePath(t) : null;
  }
  return pathById(focus.id) ?? null;
}

/** Ordered track list for the learner's focus (all tracks when exploring freely). */
export function focusTracks(focus: { id: string; choices: Record<string, string> } | null | undefined): Track[] {
  const p = focusPath(focus);
  if (!p) return [];
  return pathTrackIds(p, focus?.choices ?? {})
    .map((id) => trackById(id))
    .filter((t): t is Track => !!t);
}

export { PATHS };
