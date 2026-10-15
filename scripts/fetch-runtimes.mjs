// Downloads the runtimes DevQuest loads at run time into public/, so the desktop and Android apps work fully offline
// (and the desktop app's Content Security Policy can forbid remote scripts):
//   public/pyodide/  Pyodide core + the Python packages the lessons import (resolved from pyodide-lock.json)
//   public/vendor/   React 18 UMD + Babel standalone, used by the React lessons' live previews
//   public/vendor/typescript/  TypeScript's type checker (typescript.js + standard lib declarations) for the TypeScript lessons
// Files that already exist are skipped. Run: npm run fetch:runtimes  (also runs before every build)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const PYODIDE_VERSION = '0.27.2';
const PY_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
const PY_DIR = path.join(root, 'public', 'pyodide');
const VENDOR_DIR = path.join(root, 'public', 'vendor');

const VENDOR = {
  'react.development.js': 'https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.development.js',
  'react-dom.development.js': 'https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.development.js',
  'babel.min.js': 'https://cdn.jsdelivr.net/npm/@babel/standalone@7.26.4/babel.min.js',
};

// TypeScript's type checker for the TypeScript lessons. The project itself builds with TypeScript 7 (a native
// compiler); 6.0 is the last release written in JavaScript, which is what can run inside the app's worker.
export const TS_VERSION = '6.0.3';
const TS_CDN = `https://cdn.jsdelivr.net/npm/typescript@${TS_VERSION}/`;
const TS_DIR = path.join(VENDOR_DIR, 'typescript');
// The standard library declarations a check needs: the ECMAScript editions, the DOM and decorators
const TS_LIB = /^lib\.(es\d+|es5|esnext|dom|decorators)[\w.]*\.d\.ts$/;

/** Downloads typescript.js and the lib .d.ts files, and writes libs.json listing them. */
async function fetchTypeScript() {
  let fetched = 0;
  if (await download(TS_CDN + 'lib/typescript.js', path.join(TS_DIR, 'typescript.js'))) fetched++;
  const manifest = path.join(TS_DIR, 'libs.json');
  let libs;
  if (fs.existsSync(manifest)) libs = JSON.parse(fs.readFileSync(manifest, 'utf8'));
  else {
    const res = await fetch(`https://data.jsdelivr.com/v1/packages/npm/typescript@${TS_VERSION}?structure=flat`);
    if (!res.ok) throw new Error(`typescript file list: HTTP ${res.status}`);
    libs = (await res.json()).files.map((f) => f.name.replace(/^\/lib\//, '')).filter((n) => TS_LIB.test(n)).sort();
  }
  for (const name of libs) if (await download(TS_CDN + 'lib/' + name, path.join(TS_DIR, name))) fetched++;
  if (!fs.existsSync(manifest)) fs.writeFileSync(manifest, JSON.stringify(libs));
  return fetched;
}

// Packages the lessons need even if no import line names them directly
const ALWAYS = ['numpy', 'pandas', 'hashlib', 'sqlite3', 'openssl'];

async function download(url, file) {
  if (fs.existsSync(file) && fs.statSync(file).size > 0) return false;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file + '.part', Buffer.from(await res.arrayBuffer()));
  fs.renameSync(file + '.part', file);
  return true;
}

/** Top-level modules imported anywhere in the app's Python content. */
function pythonImports() {
  const mods = new Set();
  const walk = (dir) => {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, f.name);
      if (f.isDirectory()) walk(p);
      else if (/\.(ts|tsx|txt)$/.test(f.name)) {
        // Code shown in lesson text (fenced ``` or ~~~ blocks) is only illustrative and never runs
        const text = fs.readFileSync(p, 'utf8').replace(/(```|~~~)[\s\S]*?\1/g, '').replace(/\\n/g, '\n');
        for (const m of text.matchAll(/^\s*(?:from|import)\s+([A-Za-z_]\w*)/gm)) mods.add(m[1]);
      }
    }
  };
  walk(path.join(root, 'src', 'content'));
  return mods;
}

async function main() {
  let fetched = 0;
  for (const [name, url] of Object.entries(VENDOR)) if (await download(url, path.join(VENDOR_DIR, name))) fetched++;
  fetched += await fetchTypeScript();

  const core = ['pyodide.js', 'pyodide.mjs', 'pyodide.asm.js', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json'];
  for (const f of core) if (await download(PY_CDN + f, path.join(PY_DIR, f))) fetched++;

  const lock = JSON.parse(fs.readFileSync(path.join(PY_DIR, 'pyodide-lock.json'), 'utf8'));
  const byImport = new Map();
  for (const [name, pkg] of Object.entries(lock.packages)) for (const imp of pkg.imports ?? []) byImport.set(imp, name);
  const wanted = new Set(ALWAYS);
  for (const mod of pythonImports()) if (byImport.has(mod)) wanted.add(byImport.get(mod));
  // Dependency closure
  const queue = [...wanted];
  while (queue.length) {
    const name = queue.pop();
    for (const dep of lock.packages[name]?.depends ?? []) if (!wanted.has(dep)) wanted.add(dep), queue.push(dep);
  }
  for (const name of [...wanted].sort()) {
    const pkg = lock.packages[name];
    if (!pkg) continue;
    if (await download(PY_CDN + pkg.file_name, path.join(PY_DIR, pkg.file_name))) fetched++;
  }
  const size = (dir) => fs.readdirSync(dir).reduce((a, f) => a + fs.statSync(path.join(dir, f)).size, 0);
  console.log(`runtimes ready: ${wanted.size} Python packages (${[...wanted].sort().join(', ')}); pyodide ${(size(PY_DIR) / 1e6).toFixed(1)} MB, vendor ${(size(VENDOR_DIR) / 1e6).toFixed(1)} MB; ${fetched} files downloaded`);
}

main().catch((e) => {
  console.error('fetch-runtimes failed:', e.message);
  process.exit(1);
});
