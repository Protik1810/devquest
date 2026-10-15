// Runs every PostgreSQL exercise and SQL lesson example in Node on PGlite (real PostgreSQL), with the app's own
// code (src/engine/pgCore.ts): each solution must give the same result as its reference, each starter must not,
// and every ```sql <dataset> example in lesson text must run (unless it contains a "-- error" comment, then it
// must fail).
//   node scripts/verify-sql.mjs            everything
//   node scripts/verify-sql.mjs sql-join   only lessons whose id contains "sql-join"
//   VERBOSE=1 shows each item as it runs
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { PGlite } from '@electric-sql/pglite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const filter = process.argv[2] ?? '';
const verbose = !!process.env.VERBOSE;

/** Puzzles as scripts: a Parsons problem's solution is its lines in order; a fill-in's is the template with the answers. */
function asProgram(e) {
  if (e.kind === 'parsons') return { ...e, starter: '', solution: e.lines.join('\n') + '\n' };
  if (e.kind === 'fill') {
    const parts = e.template.split('____');
    return { ...e, starter: e.template, solution: parts.map((p, i) => p + (e.answers[i] ?? '')).join('') };
  }
  return e;
}

const server = await createServer({ root, configFile: path.join(root, 'vite.config.ts'), server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
let TRACKS, exercisesOf, DATASETS, core;
try {
  ({ TRACKS } = await server.ssrLoadModule('/src/content/index.ts'));
  ({ exercisesOf } = await server.ssrLoadModule('/src/content/exercises.ts'));
  ({ DATASETS } = await server.ssrLoadModule('/src/content/sqlDatasets.ts'));
  core = await server.ssrLoadModule('/src/engine/pgCore.ts');
} finally {
  await server.close();
}

const db = new PGlite(core.PG_OPTIONS);
await db.waitReady;
let first = true;
async function run(code, setup, verify) {
  await core.resetDatabase(db, first);
  first = false;
  return core.runScript(db, code, setup, verify);
}

const key = (row) => JSON.stringify(row.map((v) => (v === null ? null : String(v))));
function sameTable(a, b, ordered) {
  if (!a || !b) return a === b;
  if (a.columns.join() !== b.columns.join()) return false;
  const ra = a.values.map(key);
  const rb = b.values.map(key);
  if (!ordered) {
    ra.sort();
    rb.sort();
  }
  return ra.length === rb.length && ra.every((r, i) => r === rb[i]);
}

/** Does `code` pass the exercise's check, as the app's runPostgres decides? */
async function passes(code, check) {
  const mine = await run(code, check.setup, check.verify);
  if (!mine.ok) return { ok: false, why: mine.error };
  const ref = await run(check.expected, check.setup, check.verify);
  if (!ref.ok) return { ok: false, why: `reference failed: ${ref.error}` };
  const same = check.verify ? sameTable(mine.verify, ref.verify, !!check.ordered) : sameTable(mine.table, ref.table, !!check.ordered);
  const shown = (t) => (t ? `${t.columns.join(', ')}: ${t.values.slice(0, 4).map(key).join(' ')}${t.values.length > 4 ? ` (+${t.values.length - 4})` : ''}` : 'no table');
  return same ? { ok: true } : { ok: false, why: `got ${shown(check.verify ? mine.verify : mine.table)}\n  want ${shown(check.verify ? ref.verify : ref.table)}` };
}

const problems = [];
let exercises = 0;
let examples = 0;
for (const t of TRACKS)
  for (const l of t.lessons) {
    if (filter && !l.id.includes(filter)) continue;
    const list = exercisesOf(l).filter((e) => e.kind !== 'quiz' && e.kind !== 'terminal' && e.lang === 'postgres' && e.check?.type === 'sql').map(asProgram);
    for (const [i, e] of list.entries()) {
      const id = list.length > 1 ? `${l.id}#${i + 1}` : l.id;
      if (verbose) console.log('exercise', id);
      exercises++;
      const sol = await passes(e.solution, e.check);
      if (!sol.ok) problems.push(`✗ ${id}: solution fails\n  ${sol.why}`);
      const start = await passes(e.starter, e.check);
      if (start.ok) problems.push(`✗ ${id}: the starter already passes`);
    }
    for (const m of (l.body ?? '').matchAll(/^```sql[ \t]+([\w-]+)[ \t]*\n([\s\S]*?)^```[ \t]*$/gm)) {
      const [, dataset, code] = m;
      if (!(dataset in DATASETS)) continue;
      examples++;
      if (verbose) console.log('example', l.id, code.split('\n')[0]);
      const r = await run(code, DATASETS[dataset]);
      const shouldFail = /^\s*-- error\b/im.test(code);
      if (r.ok && shouldFail) problems.push(`✗ ${l.id}: example marked "-- error" ran without error:\n  ${code.split('\n')[0]}`);
      if (!r.ok && !shouldFail) problems.push(`✗ ${l.id}: example fails:\n  ${code.trim().split('\n').slice(0, 3).join('\n  ')}\n  ${r.error}`);
    }
  }

for (const p of problems) console.log(p);
console.log(`${exercises - problems.filter((p) => / solution fails| starter already/.test(p)).length}/${exercises} SQL exercises verified, ${examples} lesson examples run${problems.length ? `, ${problems.length} problem(s)` : ''}`);
await db.close();
process.exit(problems.length ? 1 : 0);
