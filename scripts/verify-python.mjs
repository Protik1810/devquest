// Runs every Python exercise (lessons, Code Dojo, projects) in the bundled Pyodide, the same runtime the app
// uses: each reference solution must pass its check, each starter must not, and hidden-input variants must
// still run. Needs public/pyodide (npm run fetch-runtimes).
//   node scripts/verify-python.mjs            all Python exercises
//   node scripts/verify-python.mjs py-for     only exercises whose id contains "py-for"
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pyDir = path.join(root, 'public', 'pyodide');
if (!fs.existsSync(path.join(pyDir, 'pyodide.mjs'))) {
  console.error('public/pyodide is missing: run `npm run fetch:runtimes` first.');
  process.exit(1);
}
const filter = process.argv[2] ?? '';

/** Puzzles as programs: a Parsons problem's solution is its lines in order (an empty program must fail); a fill-in's is the template with the answers (with the gaps left in, it must fail). */
function asProgram(e) {
  if (e.kind === 'parsons') return { ...e, starter: '', solution: e.lines.join('\n') + '\n' };
  if (e.kind === 'fill') {
    const parts = e.template.split('____');
    return { ...e, starter: e.template, solution: parts.map((p, i) => p + (e.answers[i] ?? '')).join('') };
  }
  return e;
}

const server = await createServer({ root, configFile: path.join(root, 'vite.config.ts'), server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
let exercises, PY_TEST_HELPER, integrity;
try {
  const { TRACKS } = await server.ssrLoadModule('/src/content/index.ts');
  const { CHALLENGES } = await server.ssrLoadModule('/src/content/dojo.ts');
  const { PROJECTS } = await server.ssrLoadModule('/src/content/projects.ts');
  const { exercisesOf } = await server.ssrLoadModule('/src/content/exercises.ts');
  ({ PY_TEST_HELPER } = await server.ssrLoadModule('/src/engine/pyTestHelper.ts'));
  integrity = await server.ssrLoadModule('/src/engine/integrity.ts');
  exercises = [];
  for (const t of TRACKS)
    for (const l of t.lessons)
      exercisesOf(l)
        .filter((e) => e.kind !== 'quiz' && e.kind !== 'terminal' && e.lang === 'python')
        .map(asProgram)
        .forEach((e, i, all) => exercises.push({ id: all.length > 1 ? `${l.id}#${i + 1}` : l.id, ex: e }));
  for (const c of CHALLENGES) if (c.exercise.lang === 'python') exercises.push({ id: c.id, ex: c.exercise });
  for (const p of PROJECTS) if (p.lang === 'python' && p.tests) exercises.push({ id: p.id, ex: { lang: 'python', starter: p.starter, solution: p.solution ?? '', check: { type: 'tests', code: p.tests } } });
} finally {
  await server.close();
}
exercises = exercises.filter((x) => x.id.includes(filter) && x.ex.solution);

// Node reads pyodide.asm.js as CommonJS only outside this "type": "module" package, so link the runtime into .cache
const nodeDir = path.join(root, '.cache', 'pyodide-node');
fs.mkdirSync(nodeDir, { recursive: true });
fs.writeFileSync(path.join(nodeDir, 'package.json'), '{ "type": "commonjs" }\n');
for (const f of fs.readdirSync(pyDir)) {
  const from = path.join(pyDir, f);
  const to = path.join(nodeDir, f);
  if (fs.existsSync(to) && fs.statSync(to).mtimeMs >= fs.statSync(from).mtimeMs) continue;
  fs.rmSync(to, { force: true });
  try {
    fs.linkSync(from, to);
  } catch {
    fs.copyFileSync(from, to);
  }
}
const { loadPyodide } = await import(pathToFileURL(path.join(nodeDir, 'pyodide.mjs')).href);
const py = await loadPyodide({ indexURL: nodeDir + path.sep });
py.runPython(PY_TEST_HELPER, { filename: '<devquest>' });

// The step-through recorder must work: trace a small recursive program
{
  const ns = py.globals.get('dict')();
  const t = JSON.parse(py.globals.get('__dq_trace')('def f(n):\n    return 1 if n < 2 else n * f(n - 1)\nx = f(3)\nprint(x)\n', ns));
  const deepest = Math.max(...t.steps.map((s) => s.frames.length));
  if (t.error || t.out !== '6\n' || deepest !== 4 || !t.steps.some((s) => s.event === 'return' && s.ret === '6')) {
    console.error('✗ step-through recorder is broken', JSON.stringify(t).slice(0, 400));
    process.exit(1);
  }
  ns.destroy();
}

let fullHashlib = false;
/** Mirrors the app's Python worker (src/engine/runners.ts). */
async function run(code, tests, stdin) {
  let out = '';
  const dec = new TextDecoder();
  const write = { write: (buf) => ((out += dec.decode(buf, { stream: true })), buf.length) };
  py.setStdout(write);
  py.setStderr(write);
  const src = code + '\n' + (tests ?? '');
  const quiet = { messageCallback: () => {} };
  try {
    await py.loadPackagesFromImports(src, quiet);
  } catch {
    /* surfaces as ImportError */
  }
  // As in the app: the default hashlib lacks pbkdf2_hmac/scrypt, so load the full one once
  if (!fullHashlib && /\bhashlib\b/.test(src)) {
    await py.loadPackage('hashlib', quiet);
    py.runPython("import sys\nfor m in ('hashlib', '_hashlib'): sys.modules.pop(m, None)");
    fullHashlib = true;
  }
  const ns = py.globals.get('dict')();
  ns.set('__name__', '__main__');
  py.globals.get('__dq_prepare')(stdin ?? null);
  const flush = () => py.runPython('import sys\nsys.stdout.flush()\nsys.stderr.flush()');
  try {
    try {
      await py.runPythonAsync(py.globals.get('__dq_async_source')(code), { globals: ns });
    } finally {
      flush();
    }
    if (tests) {
      const before = out.length;
      try {
        py.globals.get('__dq_run_tests')(tests, ns);
      } catch (err) {
        return { ok: true, output: out.slice(0, before), testError: String(err.message ?? err).split('\n').slice(-3).join('\n') };
      }
      out = out.slice(0, before);
    }
    return { ok: true, output: out };
  } catch (err) {
    return { ok: false, output: out, error: String(err.message ?? err).split('\n').slice(-4).join('\n') };
  } finally {
    ns.destroy();
  }
}

async function passes(code, check) {
  if (check.type === 'tests') {
    const r = await run(code, check.code, check.stdin);
    return { pass: r.ok && !r.testError, why: r.error ?? r.testError ?? '', output: r.output };
  }
  if (check.type === 'stdout') {
    // The example run, then every extra input case, like the app's runner
    for (const c of [{ stdin: check.stdin, expected: check.expected }, ...(check.cases ?? [])]) {
      const r = await run(code, undefined, c.stdin);
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
  const sol = await passes(ex.solution, ex.check);
  if (!sol.pass) {
    fail(id, `solution fails\n${sol.why}`);
    continue;
  }
  const start = await passes(ex.starter, ex.check);
  if (start.pass) fail(id, 'starter already passes');
  if (ex.check.type === 'stdout') {
    if (integrity.looksHardcoded(ex.solution, ex.check.expected, { solution: ex.solution, starter: ex.starter })) fail(id, 'the solution looks hard-coded to the integrity check');
    if (ex.check.variants?.length) {
      const v = await run(integrity.applyVariants(ex.solution, ex.check.variants), undefined, ex.check.stdin);
      if (!v.ok) fail(id, `a variant breaks the solution\n${v.error}`);
      else if (integrity.sameOutput(v.output, ex.check.expected)) fail(id, 'variants do not change the output (they catch nothing)');
    }
  }
}
const extra = exercises.reduce((n, { ex }) => n + (ex.check.cases?.length ?? 0), 0);
console.log(`${exercises.length - failed}/${exercises.length} Python exercises verified (plus ${extra} extra input cases)${failed ? `, ${failed} problem(s)` : ''}`);
process.exit(failed ? 1 : 0);
