import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import fengariUrl from 'fengari-web/dist/fengari-web.bundle.js?url';
import type { CodeCheck, CodeLang } from '../content/types';
import mongoShell from './mongoShell.js?raw';
import { runPostgres } from './postgres';
import { registerMysql, translateMysql } from './mysql';
import { RedisEngine } from './redis';

export type RunResult = { ok: boolean; output: string; error?: string; passed?: boolean; message?: string; table?: { columns: string[]; values: unknown[][] } };

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
/**
 * Runs exercise tests one top-level statement at a time. When a bare `assert` fails (no message), it explains
 * the failure instead of a bare AssertionError: the failing line, and for `assert a == b` the expected and actual values.
 */
const PY_TEST_HELPER = String.raw`
import ast as _dq_ast

def __dq_run_tests(src, ns):
    tree = _dq_ast.parse(src)
    lines = src.splitlines()
    for node in tree.body:
        code = compile(_dq_ast.Module(body=[node], type_ignores=[]), '<tests>', 'exec')
        try:
            exec(code, ns)
        except AssertionError as e:
            if str(e):
                raise
            raise AssertionError(__dq_explain(e, node, lines, ns)) from None

def __dq_explain(e, node, lines, ns):
    lineno = None
    tb = e.__traceback__
    while tb is not None:
        if tb.tb_frame.f_code.co_filename == '<tests>':
            lineno = tb.tb_lineno
        tb = tb.tb_next
    stmt = None
    for n in _dq_ast.walk(node):
        if isinstance(n, _dq_ast.Assert) and getattr(n, 'lineno', None) == lineno:
            stmt = n
    text = lines[lineno - 1].strip() if lineno else 'assert'
    nl = chr(10)
    detail = ''
    t = stmt.test if stmt is not None else None
    if isinstance(t, _dq_ast.Compare) and len(t.ops) == 1 and isinstance(t.ops[0], (_dq_ast.Eq, _dq_ast.Is)):
        try:
            got = eval(compile(_dq_ast.Expression(body=t.left), '<tests>', 'eval'), ns)
            want = eval(compile(_dq_ast.Expression(body=t.comparators[0]), '<tests>', 'eval'), ns)
            detail = nl + '  expected: ' + repr(want) + nl + '  got:      ' + repr(got)
        except Exception:
            pass
    return 'This check failed: ' + text + detail
`;

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
  py.setStdout({ batched: s => { out += s + '\\n'; } });
  py.setStderr({ batched: s => { out += s + '\\n'; } });
  const ns = py.globals.get('dict')();
  try {
    await py.runPythonAsync(e.data.code, { globals: ns });
    if (e.data.tests) {
      const before = out.length;
      // Run the tests statement by statement, so a bare failing assert can be explained (line + expected/got)
      try { py.globals.get('__dq_run_tests')(e.data.tests, ns); }
      catch (err) { postMessage({ ok: true, output: out.slice(0, before), testError: testMessage(String(err.message || err)) }); return; }
      out = out.slice(0, before);
    }
    postMessage({ ok: true, output: out });
  } catch (err) {
    postMessage({ ok: false, output: out, error: cleanPy(String(err.message || err)) });
  } finally { ns.destroy(); }
};
function cleanPy(msg) {
  // Drop pyodide's internal frames and DevQuest's test-runner frames; keep the user's part of the traceback
  const lines = msg.split('\\n').filter((l, i, all) => !l.includes('File "<devquest>"') && !(i > 0 && all[i - 1].includes('File "<devquest>"')));
  const i = lines.findIndex(l => l.includes('File "<exec>"') || l.includes('File "<tests>"'));
  return (i >= 0 ? ['Traceback (most recent call last):', ...lines.slice(i)] : lines).join('\\n').trim();
}
function testMessage(msg) {
  // A failed check explained by the runner: show just its explanation
  const a = msg.lastIndexOf('AssertionError: ');
  return a >= 0 ? msg.slice(a + 'AssertionError: '.length).trim() : cleanPy(msg);
}
`;

const JS_WORKER = `
onmessage = async (e) => {
  let out = '';
  const fmt = (a) => typeof a === 'string' ? a : (() => { try { return JSON.stringify(a); } catch { return String(a); } })();
  const log = (...args) => { out += args.map(fmt).join(' ') + '\\n'; };
  self.console = { log, info: log, warn: log, error: log, debug: log };
  try {
    const AsyncFunction = (async () => {}).constructor;
    await new AsyncFunction(e.data.code)();
    if (e.data.tests) {
      const before = out.length;
      try { await new AsyncFunction(e.data.code + '\\n' + e.data.tests)(); }
      catch (err) { postMessage({ ok: true, output: out.slice(0, before), testError: String(err && err.message || err) }); return; }
      out = out.slice(0, before);
    }
    postMessage({ ok: true, output: out });
  } catch (err) {
    postMessage({ ok: false, output: out, error: (err && err.name ? err.name + ': ' : '') + String(err && err.message || err) });
  }
};
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

  async run(code: string, tests?: string, timeoutMs = 8000): Promise<{ ok: boolean; output: string; error?: string; testError?: string }> {
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
      w.postMessage({ code, tests });
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
        : `Expected output:\n${check.expected}`,
  };
}

// ---------- Web (HTML/CSS/JS) ----------
// Tests run inside a sandboxed iframe (scripts only, no same-origin access) and report back via postMessage.
const WEB_EARLY = `<script>window.__dqErrors=[];addEventListener('error',function(e){__dqErrors.push(e.message)});</script>`;

function webHarness(id: string, tests: string) {
  return `<script>
(function(){
  var logs = [];
  var origLog = console.log;
  console.log = function(){ logs.push([].map.call(arguments, String).join(' ')); origLog.apply(console, arguments); };
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

export async function runCode(lang: CodeLang, code: string, check?: CodeCheck): Promise<RunResult> {
  if (lang === 'sql') return runSql(code, check);
  if (lang === 'postgres') return runPostgres(code, check);
  if (lang === 'mysql') return runSql(code, check, 'mysql');
  if (lang === 'redis') return runRedis(code, check);
  if (lang === 'mongodb') {
    const r = await javascript.run(mongoProgram(code, check?.type === 'stdout' ? check.setup : ''), undefined, 8000);
    if (!r.ok) return { ok: false, output: r.output, error: r.error, passed: check ? false : undefined };
    if (check?.type !== 'stdout') return { ok: true, output: r.output };
    const passed = r.output.replace(/\s+$/, '') === check.expected.replace(/\s+$/, '');
    return { ok: true, output: r.output, passed, message: passed ? 'Output matches!' : `Expected output:
${check.expected}` };
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
    const r = await runner.run(code, tests, lang === 'python' ? 15000 : 5000);
    if (!r.ok) return { ok: false, output: r.output, error: r.error, passed: check ? false : undefined };
    if (!check) return { ok: true, output: r.output };
    if (check.type === 'stdout') {
      const passed = r.output.trim() === check.expected.trim();
      return { ok: true, output: r.output, passed, message: passed ? 'Output matches!' : `Expected output:\n${check.expected}` };
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
