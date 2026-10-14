import { TRACKS } from '../content';
import { exercisesOf } from '../content/exercises';
import type { CodeExercise, Lesson, Track } from '../content/types';
import { today } from './levels';
import { runsInApp } from './localRun';
import type { DrillState, State } from './store';

/** A coding exercise from a finished lesson, practised again later (spaced practice of skills, not just facts). */
export type Drill = { key: string; track: Track; lesson: Lesson; ex: CodeExercise; due: string };

/** First practice two days after the lesson; after that, the schedule in State.drills. */
const FIRST_GAP = 2;

/** Drills due today, most overdue first. Only exercises that run inside the app (so they can be checked). */
export function dueDrills(s: Pick<State, 'completed' | 'drills'>, limit = 5): Drill[] {
  const t = today();
  const due: Drill[] = [];
  for (const track of TRACKS)
    for (const lesson of track.lessons) {
      const done = s.completed[lesson.id];
      if (!done) continue;
      exercisesOf(lesson).forEach((ex, i) => {
        if (ex.kind !== 'code' || !runsInApp(ex.lang)) return;
        const key = `${lesson.id}#${i}`;
        const state: DrillState | undefined = s.drills?.[key];
        const when = state ? state.due : addDays(done.at, FIRST_GAP);
        if (when <= t) due.push({ key, track, lesson, ex, due: when });
      });
    }
  return due.sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : 0)).slice(0, limit);
}

/** How many drills are due (for badges), without the limit. */
export const dueDrillCount = (s: Pick<State, 'completed' | 'drills'>) => dueDrills(s, Infinity).length;

function addDays(day: string, n: number) {
  const d = new Date(`${day}T12:00:00`);
  d.setDate(d.getDate() + n);
  return today(d);
}

