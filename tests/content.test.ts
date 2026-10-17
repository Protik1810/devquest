import { describe, expect, it } from 'vitest';
import { ALL_CARDS, TRACKS } from '../src/content';
import { CHALLENGES } from '../src/content/dojo';
import { LANG_CHALLENGES } from '../src/content/dojoLangs';
import { PATHS, pathTrackIds } from '../src/content/paths';
import { PROJECTS } from '../src/content/projects';
import { LANG_META } from '../src/content/langMeta';
import type { CodeExercise } from '../src/content/types';
import { exercisesOf } from '../src/content/exercises';

const lessons = TRACKS.flatMap((t) => t.lessons.map((l) => ({ track: t, lesson: l })));

describe('curriculum integrity', () => {
  it('has unique ids across lessons, Dojo challenges and projects', () => {
    const ids = [...lessons.map((l) => l.lesson.id), ...CHALLENGES.map((c) => c.id), ...PROJECTS.map((p) => p.id)];
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes).toEqual([]);
  });

  it('every track has lessons, a title, an icon and a tier', () => {
    for (const t of TRACKS) {
      expect(t.lessons.length, t.id).toBeGreaterThan(0);
      expect(t.title && t.icon, t.id).toBeTruthy();
      expect(Number.isInteger(t.tier), t.id).toBe(true);
    }
  });

  it('every code exercise is complete and uses a known language', () => {
    const code = [...lessons.flatMap((l) => exercisesOf(l.lesson).map((ex) => ({ id: l.lesson.id, ex }))), ...CHALLENGES.map((c) => ({ id: c.id, ex: c.exercise }))].filter(
      (x): x is { id: string; ex: CodeExercise } => x.ex?.kind === 'code',
    );
    expect(code.length).toBeGreaterThan(250);
    for (const { id, ex } of code) {
      expect(LANG_META[ex.lang], `${id}: unknown language ${ex.lang}`).toBeTruthy();
      expect(ex.prompt.trim(), id).not.toBe('');
      expect(ex.solution.trim(), id).not.toBe('');
      expect(ex.solution, `${id}: starter equals solution`).not.toBe(ex.starter);
      expect(ex.check, id).toBeTruthy();
    }
  });

  it('every quiz answer points at one of its options', () => {
    for (const { lesson } of lessons) {
      for (const q of exercisesOf(lesson).flatMap((e) => (e.kind === 'quiz' ? e.questions : []))) {
        expect(q.answer, `${lesson.id}: ${q.q}`).toBeGreaterThanOrEqual(0);
        expect(q.answer, `${lesson.id}: ${q.q}`).toBeLessThan(q.options.length);
      }
    }
  });

  it('puzzles are well-formed and module tests have a quiz', () => {
    for (const { lesson } of lessons) {
      for (const ex of exercisesOf(lesson)) {
        if (ex.kind === 'parsons') {
          expect(ex.lines.length, lesson.id).toBeGreaterThanOrEqual(3);
          for (const d of ex.distractors) expect(ex.lines, `${lesson.id}: distractor is also a real line`).not.toContain(d);
        }
        if (ex.kind === 'fill') expect(ex.template.split('____').length - 1, lesson.id).toBe(ex.answers.length);
      }
      if (lesson.exam) expect(exercisesOf(lesson).some((e) => e.kind === 'quiz'), `${lesson.id}: a module test needs a quiz`).toBe(true);
      for (const g of lesson.goals ?? []) expect(g.trim(), lesson.id).not.toBe('');
    }
  });

  it('every Python, JavaScript, TypeScript and SQL course lesson states its goals', () => {
    for (const id of ['python', 'javascript', 'typescript', 'sql'])
      for (const l of TRACKS.find((t) => t.id === id)!.lessons) expect(l.goals?.length ?? 0, `${l.id} has no --- goals`).toBeGreaterThan(0);
  });

  it('hints are hints, not lesson text that ran into the last exercise', () => {
    for (const { lesson } of lessons)
      for (const ex of exercisesOf(lesson))
        for (const h of 'hints' in ex ? ex.hints : []) expect(h, `${lesson.id}: a hint looks like lesson text (move it above the first --- section)`).not.toMatch(/^#|\]\(#\//);
  });

  it('links inside lessons point at lessons, tracks, Dojo challenges and projects that exist', () => {
    const exists: Record<string, Set<string>> = {
      lesson: new Set(lessons.map((l) => l.lesson.id)),
      track: new Set(TRACKS.map((t) => t.id)),
      dojo: new Set(CHALLENGES.map((c) => c.id)),
      projects: new Set(PROJECTS.map((p) => p.id)),
    };
    for (const { lesson } of lessons)
      for (const [, kind, id] of lesson.body.matchAll(/\]\(#\/(\w+)\/([\w-]+)\)/g)) {
        expect(exists[kind], `${lesson.id}: unknown link kind ${kind}`).toBeTruthy();
        expect(exists[kind].has(id), `${lesson.id}: link to missing ${kind} ${id}`).toBe(true);
      }
  });

  it('every markdown table row has as many cells as its header', () => {
    // An unescaped | inside `code` in a table cell silently splits the cell (write \| instead)
    const cells = (row: string) => row.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).length;
    for (const { lesson } of lessons) {
      const lines = lesson.body.split('\n');
      for (let i = 1; i < lines.length; i++) {
        if (!/^\|[\s:|-]+\|$/.test(lines[i].trim()) || !lines[i - 1].trim().startsWith('|')) continue;
        const want = cells(lines[i - 1]);
        for (let j = i + 1; j < lines.length && lines[j].trim().startsWith('|'); j++) expect(cells(lines[j]), `${lesson.id}: ${lines[j]}`).toBe(want);
      }
    }
  });

  it('every flashcard has both sides', () => {
    for (const c of ALL_CARDS) expect(c.front.trim() && c.back.trim(), c.id).toBeTruthy();
  });

  it('career paths only reference tracks and projects that exist', () => {
    const trackIds = new Set(TRACKS.map((t) => t.id));
    const projectIds = new Set(PROJECTS.map((p) => p.id));
    for (const p of PATHS) {
      for (const id of pathTrackIds(p, {})) expect(trackIds.has(id), `${p.id} → ${id}`).toBe(true);
      for (const stage of p.stages) for (const step of stage.steps) if (typeof step !== 'string') for (const o of step.options) expect(trackIds.has(o), `${p.id} option ${o}`).toBe(true);
      for (const id of p.projects) expect(projectIds.has(id), `${p.id} project ${id}`).toBe(true);
    }
  });

  it('includes the new database and foundations tracks', () => {
    const byId = Object.fromEntries(TRACKS.map((t) => [t.id, t]));
    expect(byId.programming.lessons.length).toBe(13);
    expect(byId.postgresql.lessons.length).toBe(9);
    expect(byId.mongodb.lessons.length).toBe(8);
  });

  it('parses 3 Dojo challenges for each of 16 extra languages, all with hidden-input variants', () => {
    expect(LANG_CHALLENGES.length).toBe(48);
    for (const c of LANG_CHALLENGES) {
      expect(c.exercise.check.type).toBe('stdout');
      if (c.exercise.check.type === 'stdout') expect(c.exercise.check.variants?.length, c.id).toBeGreaterThan(0);
    }
  });
});
