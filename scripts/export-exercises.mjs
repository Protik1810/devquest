// Loads DevQuest's content through Vite and writes every code exercise (lessons + Code Dojo) to .cache/exercises.json.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const server = await createServer({ root, configFile: path.join(root, 'vite.config.ts'), server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { TRACKS } = await server.ssrLoadModule('/src/content/index.ts');
  const { CHALLENGES } = await server.ssrLoadModule('/src/content/dojo.ts');
  const { exercisesOf } = await server.ssrLoadModule('/src/content/exercises.ts');
  const out = [];
  for (const t of TRACKS)
    for (const l of t.lessons)
      exercisesOf(l)
        .filter((e) => e.kind === 'code')
        .forEach((e, i, all) => out.push({ id: all.length > 1 ? `${l.id}#${i + 1}` : l.id, track: t.id, ...pick(e) }));
  for (const c of CHALLENGES) out.push({ id: c.id, track: 'dojo', ...pick(c.exercise) });
  // Runnable examples in lesson text for native languages (```java ...), checked by verify-native too
  const examples = [];
  for (const t of TRACKS)
    for (const l of t.lessons)
      for (const m of (l.body ?? '').matchAll(/^```(java|csharp)[ \t]*\n([\s\S]*?)^```[ \t]*$/gm)) examples.push({ id: l.id, lang: m[1], code: m[2] });
  fs.mkdirSync(path.join(root, '.cache'), { recursive: true });
  fs.writeFileSync(path.join(root, '.cache', 'exercises.json'), JSON.stringify(out, null, 1));
  fs.writeFileSync(path.join(root, '.cache', 'examples.json'), JSON.stringify(examples, null, 1));
  console.log(`exported ${out.length} code exercises and ${examples.length} native lesson examples`);
} finally {
  await server.close();
}

function pick(ex) {
  return { lang: ex.lang, starter: ex.starter, solution: ex.solution, check: ex.check };
}
