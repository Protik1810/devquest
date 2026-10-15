import type { CodeCheck, CodeExercise, CodeLang, Exercise, Lesson, QuizQuestion, StdinCase, Track } from './types';

/**
 * Parses a track written as a plain-text lesson file (src/content/tracks/*.txt), so lessons full of code
 * need no escaping. Format:
 *
 *   +++ track
 *   id: mongodb            title: …   icon: …   tier: 6   color: #10b981   kind: core   blurb: …
 *   +++
 *   === module <title>       (optional) heading for the lessons that follow
 *   === lesson <id> | <title> | <xp> [| exam]   (exam: a module test, see Lesson.exam)
 *   <markdown body>          (~~~check … ~~~ blocks inside it, in the quiz format, become "pause and predict" checks)
 *   --- goals
 *   - what the learner will be able to do (one per line)
 *   --- exercise code <lang>   (a lesson may have several exercise and quiz sections, done in order)
 *   ::prompt / ::starter / ::solution / ::hints (- item per line)
 *   ::expected   exact program output (stdout check)
 *   ::setup      hidden code run first (MongoDB seed data, SQL tables)
 *   ::reference  reference SQL (SQL check); ::verify optional checking query; ::ordered true|false
 *   ::tests      assert-based tests (Python/JS)
 *   ::variants   hidden-input swaps, one "find => replace" per line
 *   ::stdin      lines typed into input() (Python)
 *   ::cases      more runs with other input: ">>> typed line" lines, then the output expected for them
 *   --- exercise parsons <lang>   "put the lines in order": ::prompt, ::lines (the correct program), ::distractors,
 *                                 ::hints and a check (::expected / ::tests / ::stdin / ::cases)
 *   --- exercise fill <lang>      fill in the blanks: ::prompt, ::template (gaps written ____), ::answers (one per
 *                                 line, in order), ::hints and a check
 *   --- quiz
 *   ? question     - wrong option     + right option     > explanation
 *   A ``` fenced block right after a question is code shown with it.
 *   --- cards
 *   front :: back
 *
 * A track may span several files (say, one per module): pass them in order; only the first has the header.
 */
export function parseTrackFile(...files: string[]): Track {
  const text = files.map((f) => f.replace(/\r\n/g, '\n')).join('\n');
  const head = text.match(/^\+\+\+ track\n([\s\S]*?)\n\+\+\+\n/);
  if (!head) throw new Error('lesson file: missing +++ track header');
  const meta: Record<string, string> = {};
  for (const line of head[1].split('\n')) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (m) meta[m[1]] = m[2].trim();
  }
  const lessons: Lesson[] = [];
  let module: string | undefined;
  // Only "=== module" and "=== lesson" lines start blocks, so lesson text may contain lines like "=== Receipt ==="
  for (const block of text.slice(head[0].length).split(/^=== (?=module |lesson )/m).slice(1)) {
    if (block.startsWith('module ')) module = block.slice(7, block.indexOf('\n')).trim();
    else if (block.startsWith('lesson ')) lessons.push({ ...parseLesson(meta.id, block.slice(7)), ...(module ? { module } : {}) });
    else throw new Error(`${meta.id}: unknown block "=== ${block.slice(0, 30)}"`);
  }
  const seen = new Set<string>();
  for (const l of lessons) {
    if (seen.has(l.id)) throw new Error(`${meta.id}: duplicate lesson id ${l.id}`);
    seen.add(l.id);
  }
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
  const [id, title, xp, flags = ''] = block.slice(0, nl).split('|').map((s) => s.trim());
  const [body, ...sections] = block.slice(nl + 1).split(/^--- (?=goals|quiz|cards|exercise )/m);
  const lesson: Lesson = { id, title, xp: Number(xp) || 50, body: body.trim(), ...(flags.split(/\s+/).includes('exam') ? { exam: true } : {}) };
  const where = `${trackId}/${id}`;
  // A misspelt header would otherwise be silently swallowed by the text before it
  const texts = [body, ...sections.map((sec) => sec.slice(sec.indexOf('\n') + 1))].join('\n');
  const typo = texts.match(/^(--- [a-z]+(?: [a-z]+)*|=== [a-z]+ [^\n]*\|[^\n]*)$/m);
  if (typo) throw new Error(`${where}: "${typo[1]}" looks like a misspelt section or lesson header`);
  // Validate inline checks now, so a typo fails the build instead of a lesson page
  for (const m of lesson.body.matchAll(CHECK_BLOCK)) parseQuestions(where, m[1]);
  const exercises: Exercise[] = [];
  for (const sec of sections) {
    const i = sec.indexOf('\n');
    const kind = sec.slice(0, i).trim();
    const content = sec.slice(i + 1);
    const lang = kind.split(/\s+/)[2] as CodeLang;
    if (kind.startsWith('exercise code')) exercises.push(parseCode(where, lang, content));
    else if (kind.startsWith('exercise parsons')) exercises.push(parseParsons(where, lang, content));
    else if (kind.startsWith('exercise fill')) exercises.push(parseFill(where, lang, content));
    else if (kind === 'quiz') exercises.push({ kind: 'quiz', questions: parseQuestions(where, content) });
    else if (kind === 'goals') lesson.goals = listItems(content);
    else if (kind === 'cards')
      lesson.cards = content
        .split('\n')
        .filter((l) => l.includes(' :: '))
        .map((l) => {
          const [front, back] = l.split(' :: ');
          return { front: front.trim(), back: back.trim() };
        });
    else throw new Error(`${where}: unknown section "--- ${kind}"`);
  }
  if (exercises.length > 1) lesson.exercises = exercises;
  else if (exercises.length) lesson.exercise = exercises[0];
  return lesson;
}

const KNOWN_FIELDS = new Set(['prompt', 'starter', 'solution', 'hints', 'expected', 'setup', 'reference', 'verify', 'ordered', 'tests', 'variants', 'stdin', 'cases', 'lines', 'distractors', 'template', 'answers']);

function fields(content: string, where: string) {
  const out: Record<string, string> = {};
  const parts = content.split(/^::(\w+)[ \t]*$/m);
  for (let i = 1; i < parts.length; i += 2) {
    // A misspelt or invented field would otherwise be ignored without a word
    if (!KNOWN_FIELDS.has(parts[i])) throw new Error(`${where}: unknown field ::${parts[i]}`);
    out[parts[i]] = parts[i + 1].replace(/^\n/, '').replace(/\s+$/, '');
  }
  return out;
}

/** "- item" lines (or plain lines) as a list. */
const listItems = (text: string) =>
  text
    .split('\n')
    .map((l) => l.replace(/^- /, '').trim())
    .filter(Boolean);

function parseCode(where: string, lang: CodeLang, content: string): Exercise {
  const f = fields(content, where);
  for (const need of ['prompt', 'starter', 'solution']) if (f[need] === undefined) throw new Error(`${where}: exercise needs ::${need}`);
  const exercise: CodeExercise = {
    kind: 'code',
    lang,
    prompt: f.prompt,
    starter: f.starter + '\n',
    solution: f.solution + '\n',
    hints: listItems(f.hints ?? ''),
    check: buildCheck(where, f),
  };
  return exercise;
}

function parseParsons(where: string, lang: CodeLang, content: string): Exercise {
  const f = fields(content, where);
  for (const need of ['prompt', 'lines']) if (f[need] === undefined) throw new Error(`${where}: parsons exercise needs ::${need}`);
  const lines = f.lines.split('\n').filter((l) => l.trim());
  if (lines.length < 3) throw new Error(`${where}: a parsons exercise needs at least 3 lines`);
  const distractors = (f.distractors ?? '').split('\n').filter((l) => l.trim());
  return { kind: 'parsons', lang, prompt: f.prompt, lines, distractors, hints: listItems(f.hints ?? ''), check: buildCheck(where, f) };
}

/** A "pause and predict" check inside lesson text: questions in the quiz format between ~~~check and ~~~. */
export const CHECK_BLOCK = /^~~~check\n([\s\S]*?)^~~~[ \t]*$/gm;

/** A gap in a fill-in-the-blanks template. */
export const BLANK = '____';

function parseFill(where: string, lang: CodeLang, content: string): Exercise {
  const f = fields(content, where);
  for (const need of ['prompt', 'template', 'answers']) if (f[need] === undefined) throw new Error(`${where}: fill exercise needs ::${need}`);
  const answers = f.answers.split('\n').map((l) => l.trim()).filter(Boolean);
  const gaps = f.template.split(BLANK).length - 1;
  if (!gaps || gaps !== answers.length) throw new Error(`${where}: ${gaps} gaps but ${answers.length} answers`);
  return { kind: 'fill', lang, prompt: f.prompt, template: f.template + '\n', answers, hints: listItems(f.hints ?? ''), check: buildCheck(where, f) };
}

function buildCheck(where: string, f: Record<string, string>): CodeCheck {
  const stdin = f.stdin !== undefined ? { stdin: f.stdin } : {};
  if (f.reference !== undefined) return { type: 'sql', setup: f.setup ?? '', expected: f.reference, ordered: f.ordered === 'true', ...(f.verify ? { verify: f.verify } : {}) };
  if (f.tests !== undefined) return { type: 'tests', code: f.tests + '\n', ...stdin };
  if (f.expected !== undefined) {
    const variants = (f.variants ?? '')
      .split('\n')
      .filter((l) => l.includes(' => '))
      .map((l) => l.split(' => ') as [string, string]);
    const cases = f.cases !== undefined ? parseCases(where, f.cases) : [];
    return { type: 'stdout', expected: f.expected, ...stdin, ...(cases.length ? { cases } : {}), ...(f.setup ? { setup: f.setup } : {}), ...(f.verify ? { verify: f.verify } : {}), ...(variants.length ? { variants } : {}) };
  }
  throw new Error(`${where}: exercise needs ::expected, ::tests or ::reference`);
}

/** `>>> typed` lines start a case (several in a row are several typed lines); the lines after them are its expected output. */
function parseCases(where: string, text: string): StdinCase[] {
  const cases: { stdin: string[]; expected: string[] }[] = [];
  for (const line of text.split('\n')) {
    const typed = line.match(/^>>>(?: (.*))?$/);
    if (typed) {
      const cur = cases[cases.length - 1];
      if (!cur || cur.expected.length) cases.push({ stdin: [typed[1] ?? ''], expected: [] });
      else cur.stdin.push(typed[1] ?? '');
    } else if (cases.length) cases[cases.length - 1].expected.push(line);
    else if (line.trim()) throw new Error(`${where}: ::cases must start with a ">>> typed input" line`);
  }
  for (const c of cases) if (!c.expected.join('').trim()) throw new Error(`${where}: a case has no expected output`);
  return cases.map((c) => ({ stdin: c.stdin.join('\n'), expected: c.expected.join('\n').trim() }));
}

/** Questions in the quiz format (also used for the "pause and predict" checks inside lesson text). */
export function parseQuestions(where: string, content: string): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  let q: QuizQuestion | null = null;
  let code: string[] | null = null; // lines of a ``` block being read
  for (const raw of content.split('\n')) {
    const line = raw.trim();
    if (code) {
      if (line.startsWith('```')) {
        q!.code = code.join('\n');
        code = null;
      } else code.push(raw);
    } else if (q && line.startsWith('```') && !q.options.length) code = [];
    else if (line.startsWith('? ')) {
      q = { q: line.slice(2), options: [], answer: -1 };
      questions.push(q);
    } else if (q && (line.startsWith('- ') || line.startsWith('+ '))) {
      if (line[0] === '+') q.answer = q.options.length;
      q.options.push(line.slice(2));
    } else if (q && line.startsWith('> ')) q.explain = q.explain ? `${q.explain} ${line.slice(2)}` : line.slice(2);
  }
  if (code) throw new Error(`${where}: unclosed code block in a quiz`);
  if (!questions.length) throw new Error(`${where}: empty quiz`);
  for (const qq of questions) {
    if (qq.answer < 0) throw new Error(`${where}: quiz question without a + answer: ${qq.q}`);
    if (qq.options.length < 2) throw new Error(`${where}: quiz question needs 2+ options: ${qq.q}`);
  }
  return questions;
}
