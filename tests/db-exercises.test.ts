import { beforeAll, describe, expect, it } from 'vitest';
import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';
import { TRACKS } from '../src/content';
import { exercisesOf } from '../src/content/exercises';
import { registerMysql, translateMysql } from '../src/engine/mysql';
import { RedisEngine } from '../src/engine/redis';
import type { CodeCheck, CodeExercise } from '../src/content/types';

let SQL: SqlJsStatic;
beforeAll(async () => {
  SQL = await initSqlJs();
});

/** Mirrors runners.ts → runSql(…, 'mysql'): compare the last result (or the verify query) with the reference. */
function mysqlPasses(code: string, check: CodeCheck) {
  if (check.type !== 'sql') throw new Error('expected a sql check');
  const run = (script: string) => {
    const db: Database = new SQL.Database();
    registerMysql(db);
    try {
      if (check.setup) db.run(translateMysql(check.setup));
      const r = db.exec(translateMysql(script));
      const last = r[r.length - 1] ?? { columns: [], values: [] };
      if (!check.verify) return last;
      const v = db.exec(translateMysql(check.verify));
      return v[v.length - 1] ?? { columns: [], values: [] };
    } finally {
      db.close();
    }
  };
  let mine;
  try {
    mine = run(code);
  } catch {
    return false; // a script that errors can't pass
  }
  const want = run(check.expected);
  const norm = (rows: unknown[][]) => {
    const r = rows.map((x) => JSON.stringify(x));
    return check.ordered ? r : r.sort();
  };
  return JSON.stringify(norm(mine.values)) === JSON.stringify(norm(want.values));
}

/** Mirrors runners.ts → runRedis. */
function redisPasses(code: string, check: CodeCheck) {
  if (check.type !== 'stdout') throw new Error('expected a stdout check');
  const r = new RedisEngine();
  if (check.setup) r.run(check.setup);
  const out = r.run(code);
  const got = check.verify ? r.run(check.verify) : out;
  return got.trim() === check.expected.trim();
}

for (const id of ['mysql', 'redis']) {
  const track = TRACKS.find((t) => t.id === id)!;
  describe(`${track.title} exercises`, () => {
    it('has 8 lessons', () => expect(track.lessons.length).toBe(8));
    for (const lesson of track.lessons) {
      const ex = exercisesOf(lesson)[0];
      if (ex?.kind !== 'code') continue;
      const code = ex as CodeExercise;
      const passes = id === 'mysql' ? mysqlPasses : redisPasses;
      it(`${lesson.id}: the reference solution passes and the starter doesn't`, () => {
        expect(passes(code.solution, code.check), 'solution').toBe(true);
        expect(passes(code.starter, code.check), 'starter').toBe(false);
      });
    }
  });
}
