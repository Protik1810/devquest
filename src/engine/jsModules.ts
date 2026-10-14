/**
 * Lets lesson code use ES modules and Node.js-style programs inside the single-file JavaScript runner.
 *
 * Code can be split into files with marker lines:
 *
 *   // file: math.js
 *   export const add = (a, b) => a + b;
 *   // file: main.js
 *   import { add } from "./math.js";
 *
 * JavaScript files become modules (import/export turned into a small CommonJS-style registry); other files
 * (notes.txt, data.json...) become files in the runtime's in-memory `node:fs`. The entry point is main.js
 * (or index.js, or the last JavaScript file). Every line stays on the line where the learner wrote it, so
 * error line numbers still match the editor.
 */

const MARKER = /^\/\/ file: *([\w.\-/]+) *$/;

export type Bundle = { code: string; files: Record<string, string> };

/** True for code that should run as Node-style modules: file markers, import/export statements or require(). */
export function usesModules(code: string) {
  return /^\/\/ file: /m.test(code) || /^\s*(import\s+[\w{*"'$]|import\s*\(|export\s)/m.test(code) || /\brequire\(\s*["'`]/.test(code) || /\bprocess\.(argv|env|exit|stdout|cwd|platform)\b/.test(code);
}

/** Registry, resolver and require, kept on one line so the learner's line numbers don't move. */
const PRELUDE =
  'const __dqMods = {}, __dqCache = {}, process = __dqProcess; ' +
  'const __dqResolve = (from, spec) => { if (!/^\\.\\.?\\//.test(spec)) return spec; const parts = from.split("/").slice(0, -1); for (const p of spec.split("/")) { if (p === "..") parts.pop(); else if (p !== ".") parts.push(p); } const key = parts.join("/"); return [key, key + ".js", key + "/index.js"].find((k) => k in __dqMods) ?? key; }; ' +
  // Like Node, using a name an ES module doesn't export is an error, not undefined
  'const __dqExports = (spec, exp) => exp && exp.__esModule ? new Proxy(exp, { get: function __dqExportCheck(t, p) { if (typeof p === "string" && !(p in t) && p !== "then" && p !== "toJSON") throw new SyntaxError("The requested module \'" + spec + "\' does not provide an export named \'" + p + "\'"); return t[p]; } }) : exp; ' +
  'const __dqRequireFrom = (from) => (spec) => { const key = __dqResolve(from, String(spec)); if (key in __dqCache) return __dqExports(spec, __dqCache[key].exports); if (!(key in __dqMods)) return __dqBuiltin(String(spec)); const module = { exports: {} }; __dqCache[key] = module; module.done = __dqMods[key](module.exports, __dqRequireFrom(key), module, "/app/" + key, "/app/" + key.split("/").slice(0, -1).join("/")); return __dqExports(spec, module.exports); }; ' +
  'const __dqRequire = __dqRequireFrom(""); ' +
  'const __dqDefine = (name, fn) => { __dqMods[name] = fn; }; ';

/**
 * Turns module code into one program for the runner. `transform` converts one file's import/export syntax to
 * CommonJS without changing its line count (sucrase's "imports" transform does exactly that).
 */
export function bundleModules(code: string, transform: (src: string) => string): Bundle {
  const lines = code.replace(/\r\n/g, '\n').split('\n');
  const sections: { name: string; marker: number; from: number; to: number }[] = [];
  lines.forEach((line, i) => {
    const m = line.match(MARKER);
    if (m) {
      if (sections.length) sections[sections.length - 1].to = i;
      sections.push({ name: m[1].replace(/^\.\//, ''), marker: i, from: i + 1, to: lines.length });
    }
  });
  // No markers: the whole program is one module, main.js
  if (!sections.length) sections.push({ name: 'main.js', marker: -1, from: 0, to: lines.length });
  const isJs = (name: string) => /\.(m?js|cjs)$/.test(name);
  const jsNames = sections.filter((s) => isJs(s.name)).map((s) => s.name);
  const entry = jsNames.find((n) => n === 'main.js') ?? jsNames.find((n) => n === 'index.js') ?? jsNames[jsNames.length - 1];

  const out = [...lines];
  const files: Record<string, string> = {};
  let open = false; // is a module function still open?
  for (const [i, s] of sections.entries()) {
    const body = lines.slice(s.from, s.to);
    const close = open ? '}); ' : '';
    if (!isJs(s.name)) {
      // A data file: it lives in the in-memory file system; its lines become blank in the program
      files[s.name] = body.join('\n').replace(/\n+$/, '');
      if (s.marker >= 0) out[s.marker] = (i === 0 ? PRELUDE : '') + close;
      for (let j = s.from; j < s.to; j++) out[j] = '';
      open = false;
      continue;
    }
    const head = `${close}__dqDefine(${JSON.stringify(s.name)}, ${s.name === entry ? 'async ' : ''}function (exports, require, module, __filename, __dirname) {`;
    const transformed = transform(body.join('\n')).split('\n');
    // A transform that changed the line count would shift error lines; keep the original layout regardless
    for (let j = 0; j < body.length; j++) out[s.from + j] = transformed[j] ?? '';
    if (transformed.length > body.length) out[s.to - 1] += ' ' + transformed.slice(body.length).join(' ');
    if (s.marker >= 0) out[s.marker] = (i === 0 ? PRELUDE : '') + head;
    else out[s.from] = PRELUDE + head + out[s.from];
    open = true;
  }
  // The entry module is async (it may use top-level await), so wait for it to finish
  const tail = (open ? '\n});' : '') + (entry ? `\n__dqRequire(${JSON.stringify('./' + entry)}); await __dqCache[${JSON.stringify(entry)}].done;` : '');
  return { code: out.join('\n') + tail, files };
}
