import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import fengariUrl from 'fengari-web/dist/fengari-web.bundle.js?url';
import type { CodeCheck, CodeLang } from '../content/types';
import mongoShell from './mongoShell.js?raw';
import { runPostgres } from './postgres';
import { registerMysql, translateMysql } from './mysql';
import { RedisEngine } from './redis';
import { PY_TEST_HELPER } from './pyTestHelper';
import { sameOutput } from './integrity';
import { JS_RUNTIME, jsRuntimeOn } from './jsRuntime';
import { bundleModules, usesModules } from './jsModules';

/** `expected`: for a failed output check, the output that was expected (shown as a line-by-line comparison). */
export type RunResult = { ok: boolean; output: string; error?: string; passed?: boolean; message?: string; expected?: string; table?: { columns: string[]; values: unknown[][] } };

// Pyodide and the React-lesson libraries ship inside the app (public/pyodide, public/vendor; see
// scripts/fetch-runtimes.mjs), so Python works offline and no script is loaded from another site.
const PYODIDE_BASE = new URL('./pyodide/', location.href).href;
const PYODIDE_URL = PYODIDE_BASE + 'pyodide.js';

/** CDN library URLs written in lesson code, mapped to the copies bundled with the app. */
const VENDOR_MAP: Record<string, string> = {
  'https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.development.js': 'react.development.js',
  'https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.development.js': 'react-dom.development.js',
  'https://cdn.jsdelivr.net/npm/@babel/standalone@7.26.4/babel.min.js': 'babel.min.js',
};
const vendorText = new Map<string, string>();

/**
 * Load the bundled copies of any CDN libraries this page uses. They are later inlined into the preview:
 * a sandboxed (opaque-origin) iframe may not load scripts from the app's own server.
 */
export async function ensureVendors(html: string) {
  await Promise.all(
    Object.entries(VENDOR_MAP)
      .filter(([cdn, file]) => html.includes(cdn) && !vendorText.has(file))
      .map(async ([, file]) => {
        const res = await fetch(new URL(`./vendor/${file}`, location.href).href);
        // A literal "</script" inside the library would end the inline <script> early
        if (res.ok) vendorText.set(file, (await res.text()).split('</script').join('<\\/script'));
      }),
  );
}

/** Swap CDN <script src> tags for inline copies of the bundled files (falls back to the CDN if not loaded). */
const localizeVendors = (html: string) => {
  for (const [cdn, file] of Object.entries(VENDOR_MAP)) {
    const code = vendorText.get(file);
    if (!code) continue;
    html = html.split(`<script src="${cdn}"></script>`).join(`<script>${code}</script>`);
  }
  return html;
};

// ---------- worker plumbing ----------
// Each language runs in a Web Worker so an infinite loop can be killed with a timeout.


const PY_WORKER = `
importScripts('${PYODIDE_URL}');
let py;
const TEST_HELPER = ${JSON.stringify(PY_TEST_HELPER)};
const ready = loadPyodide({ indexURL: '${PYODIDE_BASE}' }).then(p => { py = p; py.runPython(TEST_HELPER, { filename: '<devquest>' }); postMessage({ ready: true }); });
onmessage = async (e) => {
  await ready;
  const src = e.data.code + '\\n' + (e.data.tests || '');
  try { await py.loadPackagesFromImports(src); } catch (err) { /* unknown packages surface as ImportError below */ }
  // The default hashlib lacks OpenSSL functions (pbkdf2_hmac, scrypt); load the full one once and drop the cached fallback
  if (!self.fullHashlib && /\\bhashlib\\b/.test(src)) {
    try { await py.loadPackage('hashlib'); py.runPython("import sys\\nfor m in ('hashlib', '_hashlib'): sys.modules.pop(m, None)"); self.fullHashlib = true; } catch (err) { /* offline: basic hashlib still works */ }
  }
  let out = '';
  // Raw writes keep the output exactly as printed, including a last line without a newline
  const dec = new TextDecoder();
  const write = { write: (buf) => { out += dec.decode(buf, { stream: true }); return buf.length; } };
  py.setStdout(write);
  py.setStderr(write);
  const flush = () => { try { py.runPython('import sys\\nsys.stdout.flush()\\nsys.stderr.flush()'); } catch (err) { /* nothing to flush */ } };
  const ns = py.globals.get('dict')();
  ns.set('__name__', '__main__');   // run like a script, so  if __name__ == "__main__":  blocks run
  py.globals.get('__dq_prepare')(e.data.stdin ?? null);
  try {
    if (e.data.prelude) py.globals.get('__dq_prelude')(e.data.prelude, ns);
    if (e.data.trace) {
      // Step-through: record every line instead of just running
      const trace = py.globals.get('__dq_trace')(e.data.code, ns);
      postMessage({ ok: true, output: '', trace });
      return;
    }
    try { await py.runPythonAsync(py.globals.get('__dq_async_source')(e.data.code), { globals: ns }); } finally { flush(); }
    if (e.data.tests) {
      const before = out.length;
      // Run the tests statement by statement, so a bare failing assert can be explained (line + expected/got)
      try { py.globals.get('__dq_run_tests')(e.data.tests, ns); }
      catch (err) { flush(); postMessage({ ok: true, output: out.slice(0, before), testError: testMessage(String(err.message || err)) }); return; }
      out = out.slice(0, before);
    }
    postMessage({ ok: true, output: out });
  } catch (err) {
    postMessage({ ok: false, output: out, error: cleanPy(String(err.message || err)) });
  } finally { ns.destroy(); }
};
function cleanPy(msg) {
  // Drop pyodide's internal frames and DevQuest's test-runner frames; keep the user's part of the traceback
  // (and the source line shown under such a frame, which is indented; the helpers' source usually isn't shown)
  const lines = msg.split('\\n').filter((l, i, all) => !l.includes('File "<devquest>"') && !(i > 0 && all[i - 1].includes('File "<devquest>"') && /^\\s/.test(l)));
  const i = lines.findIndex(l => l.includes('File "<exec>"') || l.includes('File "<tests>"'));
  return (i >= 0 ? ['Traceback (most recent call last):', ...lines.slice(i)] : lines).join('\\n').trim();
}
function testMessage(msg) {
  // A failed check explained by the runner: show just its explanation
  const a = msg.lastIndexOf('AssertionError: ');
  return a >= 0 ? msg.slice(a + 'AssertionError: '.length).trim() : cleanPy(msg);
}
`;

// The shared JavaScript runtime (Node-style console, prompt(), assert) answers each message
const JS_WORKER = `${JS_RUNTIME}
onmessage = async (e) => postMessage(await __dqRun(e.data));
`;

class Runner {
  private worker: Worker | null = null;
  private readyPromise: Promise<void> | null = null;
  /** `source` is worker JS code, or a factory for a bundled module worker. */
  constructor(private source: string | (() => Worker), private needsReady: boolean) {}

  private spawn() {
    this.worker = typeof this.source === 'function' ? this.source() : new Worker(URL.createObjectURL(new Blob([this.source], { type: 'text/javascript' })));
    this.readyPromise = this.needsReady
      ? new Promise((resolve, reject) => {
          const w = this.worker!;
          const onMsg = (e: MessageEvent) => {
            if (e.data?.ready) {
              w.removeEventListener('message', onMsg);
              resolve();
            }
          };
          w.addEventListener('message', onMsg);
          w.addEventListener('error', () => reject(new Error('Could not load the Python runtime.')));
        })
      : Promise.resolve();
  }

  warm() {
    if (!this.worker) this.spawn();
    return this.readyPromise!;
  }

  /** `extra`: Python's `prelude` snippets to run quietly first and `trace` to record a step-through; JavaScript's `strict` mode and `files` for its in-memory node:fs. */
  async run(code: string, tests?: string, timeoutMs = 8000, stdin?: string, extra: { prelude?: string[]; trace?: boolean; strict?: boolean; files?: Record<string, string> } = {}): Promise<{ ok: boolean; output: string; error?: string; testError?: string; trace?: string; syntax?: boolean }> {
    await this.warm();
    const w = this.worker!;
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        w.terminate();
        this.worker = null;
        resolve({ ok: false, output: '', error: `⏱ Timed out after ${timeoutMs / 1000}s. Is there an infinite loop?` });
      }, timeoutMs);
      const onMsg = (e: MessageEvent) => {
        if (e.data?.ready) return;
        clearTimeout(timer);
        w.removeEventListener('message', onMsg);
        resolve(e.data);
      };
      w.addEventListener('message', onMsg);
      w.postMessage({ code, tests, stdin, ...extra });
    });
  }
}

const python = new Runner(PY_WORKER, true);
const javascript = new Runner(JS_WORKER, false);
// Lua 5.3 via fengari (a Lua VM in JavaScript), loaded into a classic worker like Pyodide
const LUA_WORKER = `
// The bundle is CommonJS-shaped, so give it a module object to fill in
var module = { exports: {} };
var exports = module.exports;
importScripts(${JSON.stringify(new URL(fengariUrl, location.href).href)});
const { lua, lauxlib, lualib, to_luastring } = module.exports;
function capture(L, name, sep, onOut) {
  lua.lua_pushjsfunction(L, (Ls) => {
    const n = lua.lua_gettop(Ls), parts = [];
    for (let i = 1; i <= n; i++) { lauxlib.luaL_tolstring(Ls, i); parts.push(lua.lua_tojsstring(Ls, -1)); lua.lua_pop(Ls, 1); }
    onOut(parts.join(sep) + (name === 'print' ? '\\n' : ''));
    return 0;
  });
  lua.lua_setglobal(L, to_luastring(name));
}
function exec(L, code, chunk) {
  const st = lauxlib.luaL_loadbuffer(L, to_luastring(code), null, to_luastring(chunk));
  if (st !== lua.LUA_OK || lua.lua_pcall(L, 0, 0, 0) !== lua.LUA_OK) { const m = lua.lua_tojsstring(L, -1); lua.lua_pop(L, 1); return m; }
  return null;
}
onmessage = (e) => {
  let out = '';
  const L = lauxlib.luaL_newstate();
  lualib.luaL_openlibs(L);
  capture(L, 'print', '\\t', (s) => (out += s));
  capture(L, '__dq_write', '', (s) => (out += s));
  exec(L, 'io = io or {}; io.write = function(...) __dq_write(...) end', '=setup');
  const err = exec(L, e.data.code, '=main');
  if (err) return postMessage({ ok: false, output: out, error: err });
  if (e.data.tests) { const before = out.length; const t = exec(L, e.data.tests, '=tests'); return postMessage({ ok: true, output: out.slice(0, before), testError: t || undefined }); }
  postMessage({ ok: true, output: out });
};
`;
const lua = new Runner(LUA_WORKER, false);

// ---------- locked-down runners for the Agent Lab ----------
/**
 * Worker prelude that removes network and storage access before any learner/agent code runs.
 * fetch and importScripts only reach the allow-listed URL prefixes (Pyodide's package CDN), and
 * XMLHttpRequest, WebSocket, IndexedDB, caches, BroadcastChannel and nested workers are gone.
 * Each API is redefined, non-configurable, on the global object and every prototype that has it,
 * so deleting the override doesn't bring the original back.
 */
function lockdown(allow: string[]) {
  return `
(() => {
  const ALLOW = ${JSON.stringify(allow)};
  const allowed = (u) => {
    try { return ALLOW.some((a) => new URL(String(u && u.url ? u.url : u), self.location.href).href.startsWith(a)); } catch (e) { return false; }
  };
  const lock = (name, value) => {
    for (let o = self; o; o = Object.getPrototypeOf(o)) {
      if (o === self || Object.prototype.hasOwnProperty.call(o, name)) {
        try { Object.defineProperty(o, name, { value, writable: false, configurable: false }); } catch (e) { /* already locked */ }
      }
    }
  };
  const realFetch = self.fetch.bind(self);
  const realImport = self.importScripts.bind(self);
  lock('fetch', (u, o) => allowed(u) ? realFetch(u, o) : Promise.reject(new TypeError('Network access is disabled in the DevQuest sandbox.')));
  lock('importScripts', (...urls) => { if (!urls.every(allowed)) throw new Error('importScripts is disabled in the DevQuest sandbox.'); return realImport(...urls); });
  for (const name of ['XMLHttpRequest', 'WebSocket', 'EventSource', 'WebTransport', 'BroadcastChannel', 'indexedDB', 'caches', 'Worker', 'SharedWorker']) {
    lock(name, undefined);
  }
})();
`;
}

/** Insert the lockdown right after the worker's own runtime import (the first importScripts line). */
const afterFirstImport = (src: string, prelude: string) => src.replace(/(importScripts\([^)]*\);\n)/, `$1${prelude}`);

const sandboxRunners = {
  python: new Runner(afterFirstImport(PY_WORKER, lockdown([PYODIDE_BASE])), true),
  javascript: new Runner(lockdown([]) + JS_WORKER, false),
  lua: new Runner(afterFirstImport(LUA_WORKER, lockdown([])), false),
};

/**
 * Run code with no network access (used by the Agent Lab). Python, JavaScript, TypeScript and Lua run
 * in locked-down workers; SQL runs on an in-memory SQLite database; HTML runs in the sandboxed iframe.
 */
export async function runSandboxed(lang: CodeLang, code: string, tests?: string): Promise<RunResult> {
  if (lang === 'sql') return runSql(code);
  if (lang === 'postgres') return runPostgres(code);
  if (lang === 'mysql') return runSql(code, undefined, 'mysql');
  if (lang === 'redis') return runRedis(code);
  if (lang === 'web') return runWeb(code, tests);
  if (lang === 'mongodb') {
    const r = await sandboxRunners.javascript.run(mongoProgram(code), undefined, 8000);
    return r.ok ? { ok: true, output: r.output } : { ok: false, output: r.output, error: r.error };
  }
  if (lang !== 'python' && lang !== 'javascript' && lang !== 'typescript' && lang !== 'lua') return { ok: false, output: '', error: `${lang} can't run in the browser sandbox.` };
  const runner = lang === 'python' ? sandboxRunners.python : lang === 'lua' ? sandboxRunners.lua : sandboxRunners.javascript;
  try {
    if (lang === 'typescript') {
      code = await stripTypes(code);
      if (tests) tests = await stripTypes(tests);
    }
    const r = await runner.run(code, tests, lang === 'python' ? 20000 : 6000);
    if (!r.ok) return { ok: false, output: r.output, error: r.error };
    return { ok: true, output: r.output, passed: tests ? !r.testError : undefined, message: r.testError ? `Test failed: ${r.testError}` : tests ? 'All tests passed!' : undefined };
  } catch (e) {
    return { ok: false, output: '', error: String((e as Error).message ?? e) };
  }
}

/** The engine's SyntaxError messages have no position: find it with sucrase's parser and add the line. */
async function withSyntaxLocation(error: string, code: string, lang: CodeLang) {
  try {
    const { transform } = await import('sucrase');
    transform(code, { transforms: lang === 'typescript' ? ['typescript'] : [], disableESTransforms: true });
  } catch (e) {
    const m = String((e as Error).message).match(/\((\d+):(\d+)\)/);
    if (m) return `${error} (line ${m[1]})`;
  }
  return error;
}

/** TypeScript runs as JavaScript after sucrase strips the types (no type-checking). */
async function stripTypes(code: string) {
  const { transform } = await import('sucrase');
  return transform(code, { transforms: ['typescript'], disableESTransforms: true }).code;
}

export const warmPython = () => python.warm();

// ---------- SQL ----------
let SQL: SqlJsStatic | null = null;
async function sqlEngine() {
  if (!SQL) SQL = await initSqlJs({ locateFile: () => sqlWasmUrl });
  return SQL;
}

function lastResult(db: Database, query: string) {
  const res = db.exec(query);
  return res.length ? res[res.length - 1] : { columns: [], values: [] };
}

/**
 * SQL exercises on the in-app SQLite engine. `dialect: 'mysql'` translates MySQL syntax first (see mysql.ts).
 * With a `sql` check the learner's last result is compared with the reference query's; with `verify`, a checking
 * query runs after each script instead (for CREATE/INSERT/UPDATE tasks).
 */
async function runSql(code: string, check?: CodeCheck, dialect: 'sqlite' | 'mysql' = 'sqlite'): Promise<RunResult> {
  const S = await sqlEngine();
  const tr = (s: string) => (dialect === 'mysql' ? translateMysql(s) : s);
  const open = () => {
    const d = new S.Database();
    if (dialect === 'mysql') registerMysql(d);
    return d;
  };
  const setup = check?.type === 'sql' ? check.setup : '';
  const verify = check?.type === 'sql' ? check.verify : undefined;
  const db = open();
  try {
    if (setup) db.run(tr(setup));
    const mine = lastResult(db, tr(code));
    const checked = verify ? lastResult(db, tr(verify)) : mine;
    const output = mine.columns.length ? `${mine.values.length} row(s)` : 'Query OK';
    if (check?.type !== 'sql') return { ok: true, output, table: mine };
    const ref = open();
    let want: { columns: string[]; values: unknown[][] };
    try {
      if (setup) ref.run(tr(setup));
      const r = lastResult(ref, tr(check.expected));
      want = verify ? lastResult(ref, tr(verify)) : r;
    } finally {
      ref.close();
    }
    const norm = (rows: unknown[][]) => {
      const r = rows.map((x) => JSON.stringify(x));
      return check.ordered ? r : r.sort();
    };
    const passed = JSON.stringify(norm(checked.values)) === JSON.stringify(norm(want.values));
    return {
      ok: true,
      output,
      table: verify ? checked : mine,
      passed,
      message: passed
        ? verify
          ? 'The database ends up exactly as expected!'
          : 'Your result matches the expected rows.'
        : `Expected ${want.values.length} row(s) with columns [${want.columns.join(', ')}]${verify ? ' when checking the database after your script' : ''}, got ${checked.values.length} row(s).`,
    };
  } catch (e) {
    return { ok: false, output: '', error: String((e as Error).message ?? e) };
  } finally {
    db.close();
  }
}

/** Redis exercises: hidden setup, the learner's commands (their replies are the output), then hidden verify commands. */
function runRedis(code: string, check?: CodeCheck): RunResult {
  const r = new RedisEngine();
  const setup = check?.type === 'stdout' ? check.setup : undefined;
  if (setup) r.run(setup);
  const output = r.run(code);
  if (check?.type !== 'stdout') return { ok: true, output };
  const got = check.verify ? r.run(check.verify) : output;
  const passed = got.trim() === check.expected.trim();
  return {
    ok: true,
    output,
    passed,
    message: passed
      ? check.verify
        ? 'Redis now holds exactly the expected data!'
        : 'Output matches!'
      : check.verify
        ? `The checker inspected Redis after your commands and expected:\n${check.expected}\n\nbut got:\n${got}`
        : 'Your output differs from the expected output.',
    ...(passed || check.verify ? {} : { expected: check.expected }),
  };
}

// ---------- Web (HTML/CSS/JS) ----------
// Tests run inside a sandboxed iframe (scripts only, no same-origin access) and report back via postMessage.
// Collects the page's errors and console output from the start (so the page's own scripts are included),
// formatting logged values the way Node and the lessons' JavaScript runner do
const WEB_EARLY = `<script>window.__dqErrors=[];window.__dqLogs=[];addEventListener('error',function(e){__dqErrors.push(e.message)});
(function(){var rt={setTimeout:setTimeout.bind(window),clearTimeout:clearTimeout.bind(window),setInterval:setInterval.bind(window),clearInterval:clearInterval.bind(window)};
${jsRuntimeOn('rt')}
var show=function(a){return typeof a==='string'?a:rt.__dqInspect(a)};
['log','info','warn','error','debug'].forEach(function(m){var orig=console[m];console[m]=function(){__dqLogs.push([].map.call(arguments,show).join(' '));return orig.apply(console,arguments)}});})();</script>`;

function webHarness(id: string, tests: string) {
  return `<script>
(function(){
  var logs = window.__dqLogs || [];
  function report(passed, message){ parent.postMessage({ __dq: '${id}', passed: passed, message: message, logs: logs, errors: window.__dqErrors || [] }, '*'); }
  window.addEventListener('load', async function(){
    var assert = function(c, m){ if (!c) throw new Error(m || 'Assertion failed'); };
    var sleep = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); };
    var $ = function(s){ return document.querySelector(s); };
    var $$ = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };
    var click = function(el){ el.dispatchEvent(new MouseEvent('click', { bubbles: true })); };
    var type = function(el, v){ el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
    var press = function(el, key){ el.dispatchEvent(new KeyboardEvent('keydown', { key: key, bubbles: true })); };
    var css = function(el, prop){ return getComputedStyle(el).getPropertyValue(prop); };
    try { await (async function(){ ${tests} })(); report(true, 'All checks passed!'); }
    catch (e) { report(false, String(e && e.message || e)); }
  });
})();
</script>`;
}

/** Put the early error catcher in <head> (keeping <!doctype> first) and the harness at the end. */
export function instrumentHtml(html: string, harness = '') {
  html = localizeVendors(html);
  const withEarly = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => m + WEB_EARLY) : /<html[^>]*>/i.test(html) ? html.replace(/<html[^>]*>/i, (m) => m + WEB_EARLY) : WEB_EARLY + html;
  // Replacer functions, not strings: the harness contains `$$`, which a replacement string would mangle
  return /<\/body>/i.test(withEarly) ? withEarly.replace(/<\/body>(?![\s\S]*<\/body>)/i, () => harness + '</body>') : withEarly + harness;
}

// Pages that load scripts from a CDN (e.g. React lessons) get longer to finish loading
export function runWeb(html: string, tests?: string, timeoutMs = /<script[^>]+src=["']https?:/i.test(html) ? 20000 : 6000): Promise<RunResult> {
  const id = Math.random().toString(36).slice(2);
  const frame = document.createElement('iframe');
  const vendors = ensureVendors(html).catch(() => undefined);
  frame.setAttribute('sandbox', 'allow-scripts');
  frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:1024px;height:768px;border:0;';
  return new Promise((resolve) => {
    const done = (r: RunResult) => {
      window.removeEventListener('message', onMsg);
      clearTimeout(timer);
      frame.remove();
      resolve(r);
    };
    const onMsg = (e: MessageEvent) => {
      if (e.source !== frame.contentWindow || e.data?.__dq !== id) return;
      const { passed, message, logs, errors } = e.data as { passed: boolean; message: string; logs: string[]; errors: string[] };
      const errText = errors.length ? errors.join('\n') : undefined;
      if (!tests) return done({ ok: !errText, output: logs.join('\n'), error: errText });
      done({ ok: true, output: logs.join('\n'), passed, message: passed ? message : `Check failed: ${message}${errText ? `\nPage error: ${errText}` : ''}` });
    };
    const timer = setTimeout(() => done({ ok: false, output: '', error: '⏱ The page did not finish loading in time. Is there an infinite loop?', passed: tests ? false : undefined }), timeoutMs);
    window.addEventListener('message', onMsg);
    void vendors.then(() => {
      frame.srcdoc = instrumentHtml(html, webHarness(id, tests ?? ''));
      document.body.appendChild(frame);
    });
  });
}

// ---------- public API ----------
/** MongoDB lessons: the in-memory mongosh engine, then hidden seed data, then the learner's code (one JS run). */
const mongoProgram = (code: string, setup = '') => `${mongoShell}
;${setup}
;${code}`;

export type TraceFrame = { name: string; line: number; vars: [string, string][] };
export type TraceStep = { line: number; event: 'line' | 'return' | 'exception'; frames: TraceFrame[]; out: string; ret?: string; exc?: string };
export type TraceResult = { steps: TraceStep[]; error: string | null; truncated: boolean; out: string };

/** Records a Python program's execution line by line for the step-through viewer. */
export async function tracePython(code: string, stdin?: string, prelude?: string[]): Promise<TraceResult | { failed: string }> {
  const r = await python.run(code, undefined, 20000, stdin, { trace: true, prelude });
  if (!r.trace) return { failed: r.error ?? 'Could not record this program.' };
  return JSON.parse(r.trace) as TraceResult;
}

/** Runs an example from a lesson page; for Python, `prelude` (the page's earlier examples) runs quietly first. */
export async function runExample(lang: CodeLang, code: string, prelude?: string[], stdin?: string): Promise<RunResult> {
  if (lang !== 'python') return runCode(lang, code, undefined, stdin);
  const r = await python.run(code, undefined, 15000, stdin, { prelude });
  return r.ok ? { ok: true, output: r.output } : { ok: false, output: r.output, error: r.error };
}

/** `stdin` is what the learner "types" into input() (Python); by default the check's own. */
export async function runCode(lang: CodeLang, code: string, check?: CodeCheck, stdin = check && 'stdin' in check ? check.stdin : undefined): Promise<RunResult> {
  if (lang === 'sql') return runSql(code, check);
  if (lang === 'postgres') return runPostgres(code, check);
  if (lang === 'mysql') return runSql(code, check, 'mysql');
  if (lang === 'redis') return runRedis(code, check);
  if (lang === 'mongodb') {
    const r = await javascript.run(mongoProgram(code, check?.type === 'stdout' ? check.setup : ''), undefined, 8000);
    if (!r.ok) return { ok: false, output: r.output, error: r.error, passed: check ? false : undefined };
    if (check?.type !== 'stdout') return { ok: true, output: r.output };
    const passed = r.output.replace(/\s+$/, '') === check.expected.replace(/\s+$/, '');
    return { ok: true, output: r.output, passed, message: passed ? 'Output matches!' : 'Your output differs from the expected output.', ...(passed ? {} : { expected: check.expected }) };
  }
  if (lang === 'web') return runWeb(code, check?.type === 'web' ? check.tests : check?.type === 'tests' ? check.code : undefined);
  if (lang !== 'python' && lang !== 'javascript' && lang !== 'typescript' && lang !== 'lua') return { ok: false, output: '', error: `${lang} needs a local toolchain or AI checking.` };
  const runner = lang === 'python' ? python : lang === 'lua' ? lua : javascript;
  try {
    let tests = check?.type === 'tests' ? check.code : undefined;
    if (lang === 'typescript') {
      try {
        code = await stripTypes(code);
        if (tests) tests = await stripTypes(tests);
      } catch (e) {
        return { ok: false, output: '', error: `SyntaxError: ${(e as Error).message}`, passed: check ? false : undefined };
      }
    }
    // JavaScript lessons run in strict mode, like modern modules
    const extra: { strict?: boolean; files?: Record<string, string> } = lang === 'javascript' || lang === 'typescript' ? { strict: true } : {};
    const written = code;
    if ((lang === 'javascript' || lang === 'typescript') && usesModules(code)) {
      // import/export, several "// file:" sections or Node built-ins: bundle the files into one program
      const { transform } = await import('sucrase');
      try {
        const bundle = bundleModules(code, (src) => transform(src, { transforms: ['imports'], disableESTransforms: true }).code);
        code = bundle.code;
        extra.files = bundle.files;
      } catch (e) {
        return { ok: false, output: '', error: `SyntaxError: ${(e as Error).message}`, passed: check ? false : undefined };
      }
    }
    const r = await runner.run(code, tests, lang === 'python' ? 15000 : 5000, stdin, extra);
    if (r.syntax && (lang === 'javascript' || lang === 'typescript')) r.error = await withSyntaxLocation(r.error ?? 'SyntaxError', written, lang);
    if (!r.ok) return { ok: false, output: r.output, error: r.error, passed: check ? false : undefined };
    if (!check) return { ok: true, output: r.output };
    if (check.type === 'stdout') {
      const passed = sameOutput(r.output, check.expected);
      if (!passed) return { ok: true, output: r.output, passed, message: 'Your output differs from the expected output.', expected: check.expected };
      // The example passed: run the other inputs too, so every branch of the program gets checked
      for (const c of check.cases ?? []) {
        const o = await runner.run(code, undefined, 15000, c.stdin, extra);
        if (o.ok && sameOutput(o.output, c.expected)) continue;
        if (!o.ok) return { ok: false, output: o.output, error: o.error, passed: false, message: `Right for the example, but it crashed with another input. Typed in:\n${c.stdin}` };
        return { ok: true, output: o.output, passed: false, message: `Right for the example, but not for another input. Typed in:\n${c.stdin}`, expected: c.expected };
      }
      const n = check.cases?.length ?? 0;
      return { ok: true, output: r.output, passed, message: n ? `Output matches, for the example and ${n} other input${n > 1 ? 's' : ''}!` : 'Output matches!' };
    }
    if (check.type === 'tests') {
      const passed = !r.testError;
      return { ok: true, output: r.output, passed, message: passed ? 'All tests passed!' : `Test failed: ${r.testError}` };
    }
    return { ok: true, output: r.output };
  } catch (e) {
    return { ok: false, output: '', error: String((e as Error).message ?? e) };
  }
}
