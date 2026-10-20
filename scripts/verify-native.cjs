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
    const sol = await t.runProgram(e.lang, e.solution, e.check.stdin);
    const compileOnly = !!langs[e.lang].compileOnly;
    if (!sol.ok) problems.push(`solution failed: ${(sol.error || sol.output || '').slice(0, 300)}`);
    if (sol.warnings) problems.push(`solution has compiler warnings:\n   ${sol.warnings.split('\n').slice(0, 3).join('\n   ')}`);
    else if (!compileOnly && norm(sol.output) !== norm(e.check.expected)) problems.push(`solution output differs:\n   got:  ${JSON.stringify(norm(sol.output)).slice(0, 300)}\n   want: ${JSON.stringify(norm(e.check.expected)).slice(0, 300)}`);
    if (!compileOnly) {
      const st = await t.runProgram(e.lang, e.starter, e.check.stdin);
      if (st.ok && norm(st.output) === norm(e.check.expected)) problems.push('starter already passes');
    }
    if (e.check.variants?.length && !compileOnly) {
      const v = await t.runProgram(e.lang, applyVariants(e.solution, e.check.variants), e.check.stdin);
      if (!v.ok) problems.push(`hidden variant breaks the reference: ${(v.error || v.output || '').slice(0, 300)}`);
      else if (norm(v.output) === norm(e.check.expected)) problems.push('hidden variant does not change the output');
    }
    for (const [n, c] of (compileOnly ? [] : e.check.cases ?? []).entries()) {
      const r = await t.runProgram(e.lang, e.solution, c.stdin);
      if (!r.ok || norm(r.output) !== norm(c.expected)) problems.push(`input case ${n + 1} differs:\n   got:  ${JSON.stringify(norm(r.output || r.error)).slice(0, 300)}\n   want: ${JSON.stringify(norm(c.expected)).slice(0, 300)}`);
    }
    if (problems.length) {
      bad++;
      console.log(`✗ ${e.id} (${e.lang})\n   ${problems.join('\n   ')}`);
    } else console.log(`✓ ${e.id}`);
  }
  // Lesson examples must run, except those marked as showing an error ("// error" comment)
  const examplesFile = path.join(root, '.cache', 'examples.json');
  const examples = fs.existsSync(examplesFile) ? JSON.parse(fs.readFileSync(examplesFile, 'utf8')).filter((x) => langs[x.lang] && (!only || x.lang === only || x.id.includes(only))) : [];
  let badExamples = 0;
  for (const x of examples) {
    // "// stdin: Ada | 36" gives an interactive example its typed lines
    const typed = x.code.match(/^\s*\/\/ stdin: (.*)$/m)?.[1].split('|').map((s) => s.trim()).join('\n');
    const r = await t.runProgram(x.lang, x.code, typed);
    const shouldFail = /^\s*\/\/ error\b/im.test(x.code);
    // C/C++ examples that show compiler warnings on purpose say so with a "// warning" comment
    const shouldWarn = /^\s*\/\/ warning\b/im.test(x.code);
    let problem = null;
    if (r.ok === shouldFail) problem = shouldFail ? 'marked "// error" but ran' : (r.error || '').split('\n').slice(0, 4).join('\n   ');
    else if (!shouldFail && !!r.warnings !== shouldWarn) problem = shouldWarn ? 'marked "// warning" but compiled cleanly' : `compiler warnings:\n   ${r.warnings.split('\n').slice(0, 3).join('\n   ')}`;
    if (problem) {
      badExamples++;
      console.log(`✗ example in ${x.id}: ${problem}\n   ${x.code.split('\n').find((l) => l.trim() && !l.startsWith('import') && !l.startsWith('#include'))}`);
    }
  }
  console.log(`\n${native.length - bad - skipped}/${native.length} OK${skipped ? `, ${skipped} skipped (toolchain not installed)` : ''}; ${examples.length - badExamples}/${examples.length} lesson examples OK`);
  process.exit(bad || badExamples ? 1 : 0);
})();
