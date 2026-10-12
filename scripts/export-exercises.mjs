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
  const out = [];
  for (const t of TRACKS) for (const l of t.lessons) if (l.exercise?.kind === 'code') out.push({ id: l.id, track: t.id, ...pick(l.exercise) });
  for (const c of CHALLENGES) out.push({ id: c.id, track: 'dojo', ...pick(c.exercise) });
  fs.mkdirSync(path.join(root, '.cache'), { recursive: true });
  fs.writeFileSync(path.join(root, '.cache', 'exercises.json'), JSON.stringify(out, null, 1));
  console.log(`exported ${out.length} code exercises`);
} finally {
  await server.close();
}

function pick(ex) {
  return { lang: ex.lang, starter: ex.starter, solution: ex.solution, check: ex.check };
}
