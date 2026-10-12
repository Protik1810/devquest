// Runs every native-language exercise (Go, Rust, Java, C#, …) through the toolchains installed on this PC:
//   - the reference solution must print exactly the expected output
//   - the starter must NOT already pass
//   - hidden-input variants must still run and must change the output (otherwise they test nothing)
// Usage: npm run verify:native [-- <lang|id>]   (exercises for missing toolchains are skipped)
const fs = require('fs');
const path = require('path');
const t = require('../electron/toolchains.cjs');

const root = path.resolve(__dirname, '..');
const only = process.argv[2];
const norm = (s) => String(s ?? '').replace(/\r\n/g, '\n').split('\n').map((l) => l.trimEnd()).join('\n').trim();
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function applyVariants(code, variants) {
  const sorted = [...variants].sort((a, b) => b[0].length - a[0].length);
  const re = new RegExp(sorted.map(([f]) => `${/^\w/.test(f) ? '\\b' : ''}${escapeRe(f)}${/\w$/.test(f) ? '\\b' : ''}`).join('|'), 'g');
  const map = new Map(sorted);
  return code.replace(re, (m) => map.get(m) ?? m);
}

(async () => {
  const all = JSON.parse(fs.readFileSync(path.join(root, '.cache', 'exercises.json'), 'utf8'));
  const { langs } = await t.detect(true);
  const native = all.filter((e) => e.check?.type === 'stdout' && Object.prototype.hasOwnProperty.call(langs, e.lang) && (!only || e.lang === only || e.id === only));
  let bad = 0;
  let skipped = 0;
  for (const e of native) {
    if (!langs[e.lang]) {
      skipped++;
      continue;
    }
    const problems = [];
    const sol = await t.runProgram(e.lang, e.solution);
    const compileOnly = !!langs[e.lang].compileOnly;
    if (!sol.ok) problems.push(`solution failed: ${(sol.error || sol.output || '').slice(0, 300)}`);
    else if (!compileOnly && norm(sol.output) !== norm(e.check.expected)) problems.push(`solution output differs:\n   got:  ${JSON.stringify(norm(sol.output)).slice(0, 300)}\n   want: ${JSON.stringify(norm(e.check.expected)).slice(0, 300)}`);
    if (!compileOnly) {
      const st = await t.runProgram(e.lang, e.starter);
      if (st.ok && norm(st.output) === norm(e.check.expected)) problems.push('starter already passes');
    }
    if (e.check.variants?.length && !compileOnly) {
      const v = await t.runProgram(e.lang, applyVariants(e.solution, e.check.variants));
      if (!v.ok) problems.push(`hidden variant breaks the reference: ${(v.error || v.output || '').slice(0, 300)}`);
      else if (norm(v.output) === norm(e.check.expected)) problems.push('hidden variant does not change the output');
    }
    if (problems.length) {
      bad++;
      console.log(`✗ ${e.id} (${e.lang})\n   ${problems.join('\n   ')}`);
    } else console.log(`✓ ${e.id}`);
  }
  console.log(`\n${native.length - bad - skipped}/${native.length} OK${skipped ? `, ${skipped} skipped (toolchain not installed)` : ''}`);
  process.exit(bad ? 1 : 0);
})();
