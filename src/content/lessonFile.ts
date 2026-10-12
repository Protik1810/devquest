import type { CodeCheck, CodeExercise, CodeLang, Exercise, Lesson, QuizQuestion, Track } from './types';

/**
 * Parses a track written as a plain-text lesson file (src/content/tracks/*.txt), so lessons full of code
 * need no escaping. Format:
 *
 *   +++ track
 *   id: mongodb            title: …   icon: …   tier: 6   color: #10b981   kind: core   blurb: …
 *   +++
 *   === lesson <id> | <title> | <xp>
 *   <markdown body>
 *   --- exercise code <lang>
 *   ::prompt / ::starter / ::solution / ::hints (- item per line)
 *   ::expected   exact program output (stdout check)
 *   ::setup      hidden code run first (MongoDB seed data, SQL tables)
 *   ::reference  reference SQL (SQL check); ::verify optional checking query; ::ordered true|false
 *   ::tests      assert-based tests (Python/JS)
 *   ::variants   hidden-input swaps, one "find => replace" per line
 *   --- quiz
 *   ? question     - wrong option     + right option     > explanation
 *   --- cards
 *   front :: back
 */
export function parseTrackFile(src: string): Track {
  const text = src.replace(/\r\n/g, '\n');
  const head = text.match(/^\+\+\+ track\n([\s\S]*?)\n\+\+\+\n/);
  if (!head) throw new Error('lesson file: missing +++ track header');
  const meta: Record<string, string> = {};
  for (const line of head[1].split('\n')) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (m) meta[m[1]] = m[2].trim();
  }
  const lessons = text
    .slice(head[0].length)
    .split(/^=== lesson /m)
    .slice(1)
    .map((block) => parseLesson(meta.id, block));
  return {
    id: meta.id,
    title: meta.title,
    icon: meta.icon,
    tier: Number(meta.tier),
    color: meta.color,
    kind: meta.kind as Track['kind'],
    blurb: meta.blurb,
    depth: 'full',
    lessons,
  };
}

function parseLesson(trackId: string, block: string): Lesson {
  const nl = block.indexOf('\n');
  const [id, title, xp] = block.slice(0, nl).split('|').map((s) => s.trim());
  const [body, ...sections] = block.slice(nl + 1).split(/^--- /m);
  const lesson: Lesson = { id, title, xp: Number(xp) || 50, body: body.trim() };
  for (const sec of sections) {
    const i = sec.indexOf('\n');
    const kind = sec.slice(0, i).trim();
    const content = sec.slice(i + 1);
    if (kind.startsWith('exercise code')) lesson.exercise = parseCode(`${trackId}/${id}`, kind.split(/\s+/)[2] as CodeLang, content);
    else if (kind === 'quiz') lesson.exercise = parseQuiz(content);
    else if (kind === 'cards')
      lesson.cards = content
        .split('\n')
        .filter((l) => l.includes(' :: '))
        .map((l) => {
          const [front, back] = l.split(' :: ');
          return { front: front.trim(), back: back.trim() };
        });
    else throw new Error(`${trackId}/${id}: unknown section "--- ${kind}"`);
  }
  return lesson;
}

function fields(content: string) {
  const out: Record<string, string> = {};
  const parts = content.split(/^::(\w+)[ \t]*$/m);
  for (let i = 1; i < parts.length; i += 2) out[parts[i]] = parts[i + 1].replace(/^\n/, '').replace(/\s+$/, '');
  return out;
}

function parseCode(where: string, lang: CodeLang, content: string): Exercise {
  const f = fields(content);
  for (const need of ['prompt', 'starter', 'solution']) if (f[need] === undefined) throw new Error(`${where}: exercise needs ::${need}`);
  let check: CodeCheck;
  if (f.reference !== undefined) check = { type: 'sql', setup: f.setup ?? '', expected: f.reference, ordered: f.ordered === 'true', ...(f.verify ? { verify: f.verify } : {}) };
  else if (f.tests !== undefined) check = { type: 'tests', code: f.tests + '\n' };
  else if (f.expected !== undefined) {
    const variants = (f.variants ?? '')
      .split('\n')
      .filter((l) => l.includes(' => '))
      .map((l) => l.split(' => ') as [string, string]);
    check = { type: 'stdout', expected: f.expected, ...(f.setup ? { setup: f.setup } : {}), ...(f.verify ? { verify: f.verify } : {}), ...(variants.length ? { variants } : {}) };
  } else throw new Error(`${where}: exercise needs ::expected, ::tests or ::reference`);
  const exercise: CodeExercise = {
    kind: 'code',
    lang,
    prompt: f.prompt,
    starter: f.starter + '\n',
    solution: f.solution + '\n',
    hints: (f.hints ?? '')
      .split('\n')
      .map((l) => l.replace(/^- /, '').trim())
      .filter(Boolean),
    check,
  };
  return exercise;
}

function parseQuiz(content: string): Exercise {
  const questions: QuizQuestion[] = [];
  let q: QuizQuestion | null = null;
  for (const raw of content.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('? ')) {
      q = { q: line.slice(2), options: [], answer: -1 };
      questions.push(q);
    } else if (q && (line.startsWith('- ') || line.startsWith('+ '))) {
      if (line[0] === '+') q.answer = q.options.length;
      q.options.push(line.slice(2));
    } else if (q && line.startsWith('> ')) q.explain = line.slice(2);
  }
  for (const qq of questions) if (qq.answer < 0) throw new Error(`quiz question without a + answer: ${qq.q}`);
  return { kind: 'quiz', questions };
}
