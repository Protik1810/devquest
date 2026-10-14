// Runs every JavaScript and TypeScript exercise (lessons, Code Dojo, projects) in Node with the app's own JavaScript runtime
// (src/engine/jsRuntime.ts: Node-style console, prompt(), assert): each reference solution must pass its
// check, each starter must not, and hidden-input variants must still run.
//   node scripts/verify-js.mjs           all JavaScript exercises
//   node scripts/verify-js.mjs js-for    only exercises whose id contains "js-for"
//   VERBOSE=1 shows each exercise as it runs
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { transform } from 'sucrase';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const filter = process.argv[2] ?? '';

/** Puzzles as programs: a Parsons problem's solution is its lines in order; a fill-in's is the template with the answers. */
function asProgram(e) {
  if (e.kind === 'parsons') return { ...e, starter: '', solution: e.lines.join('\n') + '\n' };
  if (e.kind === 'fill') {
    const parts = e.template.split('____');
    return { ...e, starter: e.template, solution: parts.map((p, i) => p + (e.answers[i] ?? '')).join('') };
  }
  return e;
}

const server = await createServer({ root, configFile: path.join(root, 'vite.config.ts'), server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
let exercises, JS_RUNTIME, integrity;
try {
  const { TRACKS } = await server.ssrLoadModule('/src/content/index.ts');
  const { CHALLENGES } = await server.ssrLoadModule('/src/content/dojo.ts');
  const { PROJECTS } = await server.ssrLoadModule('/src/content/projects.ts');
  const { exercisesOf } = await server.ssrLoadModule('/src/content/exercises.ts');
  ({ JS_RUNTIME } = await server.ssrLoadModule('/src/engine/jsRuntime.ts'));
  integrity = await server.ssrLoadModule('/src/engine/integrity.ts');
  exercises = [];
  for (const t of TRACKS)
    for (const l of t.lessons)
      exercisesOf(l)
        .filter((e) => e.kind !== 'quiz' && e.kind !== 'terminal' && (e.lang === 'javascript' || e.lang === 'typescript'))
        .map(asProgram)
        .forEach((e, i, all) => exercises.push({ id: all.length > 1 ? `${l.id}#${i + 1}` : l.id, ex: e }));
  for (const c of CHALLENGES) if (c.exercise.lang === 'javascript' || c.exercise.lang === 'typescript') exercises.push({ id: c.id, ex: c.exercise });
  for (const p of PROJECTS) if (p.lang === 'javascript' && p.tests) exercises.push({ id: p.id, ex: { lang: 'javascript', starter: p.starter, solution: p.solution ?? '', check: { type: 'tests', code: p.tests } } });
} finally {
  await server.close();
}
exercises = exercises.filter((x) => x.id.includes(filter) && x.ex.solution);

/** A fresh, isolated JavaScript world per run, with the host's timers and web APIs, plus the DevQuest runtime. */
/** TypeScript runs as JavaScript after sucrase strips the types, as in the app (no type-checking). */
const strip = (src) => transform(src, { transforms: ['typescript'], disableESTransforms: true }).code;

async function run(code, tests, stdin, lang = 'javascript') {
  if (lang === 'typescript') {
    try {
      code = strip(code);
      if (tests) tests = strip(tests);
    } catch (e) {
      return { ok: false, output: '', error: `SyntaxError: ${e.message}` };
    }
  }
  const ctx = vm.createContext({
    setTimeout, clearTimeout, setInterval, clearInterval, queueMicrotask, structuredClone,
    URL, URLSearchParams, TextEncoder, TextDecoder, AbortController, AbortSignal, performance, crypto,
  });
  vm.runInContext(JS_RUNTIME, ctx, { filename: 'devquest-runtime.js' });
  const result = await Promise.race([
    ctx.__dqRun({ code, tests, stdin, strict: true }),
    new Promise((resolve) => setTimeout(() => resolve({ ok: false, output: '', error: 'timed out' }), 10000)),
  ]);
  return result;
}

async function passes(code, check, lang) {
  if (check.type === 'tests') {
    const r = await run(code, check.code, check.stdin, lang);
    return { pass: r.ok && !r.testError, why: r.error ?? r.testError ?? '' };
  }
  if (check.type === 'stdout') {
    for (const c of [{ stdin: check.stdin, expected: check.expected }, ...(check.cases ?? [])]) {
      const r = await run(code, undefined, c.stdin, lang);
      const pass = r.ok && integrity.sameOutput(r.output, c.expected);
      if (!pass) return { pass, why: r.error ?? `output differs${c.stdin !== check.stdin ? ` for input ${JSON.stringify(c.stdin)}` : ''}:\n--- got\n${r.output.trim()}\n--- expected\n${c.expected.trim()}` };
    }
    return { pass: true, why: '' };
  }
  return { pass: false, why: `unsupported check ${check.type}` };
}

let failed = 0;
const fail = (id, msg) => {
  failed++;
  console.log(`✗ ${id}: ${msg}`);
};
for (const { id, ex } of exercises) {
  if (process.env.VERBOSE) console.error(`… ${id}`);
  const sol = await passes(ex.solution, ex.check, ex.lang);
  if (!sol.pass) {
    fail(id, `solution fails\n${sol.why}`);
    continue;
  }
  const start = await passes(ex.starter, ex.check, ex.lang);
  if (start.pass) fail(id, 'starter already passes');
  if (ex.check.type === 'stdout') {
    if (integrity.looksHardcoded(ex.solution, ex.check.expected, { solution: ex.solution, starter: ex.starter })) fail(id, 'the solution looks hard-coded to the integrity check');
    if (ex.check.variants?.length) {
      const v = await run(integrity.applyVariants(ex.solution, ex.check.variants), undefined, ex.check.stdin, ex.lang);
      if (!v.ok) fail(id, `a variant breaks the solution\n${v.error}`);
      else if (integrity.sameOutput(v.output, ex.check.expected)) fail(id, 'variants do not change the output (they catch nothing)');
    }
  }
}
const extra = exercises.reduce((n, { ex }) => n + (ex.check.cases?.length ?? 0), 0);
console.log(`${exercises.length - failed}/${exercises.length} JavaScript/TypeScript exercises verified (plus ${extra} extra input cases)${failed ? `, ${failed} problem(s)` : ''}`);
process.exit(failed ? 1 : 0);
