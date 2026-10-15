import { describe, expect, it } from 'vitest';
import { applyVariants, looksHardcoded } from '../src/engine/integrity';
import { mergeSaves } from '../src/engine/mergeSave';
import { safeMarked } from '../src/engine/safeMarkdown';
import { checkUrl, isLocalHost } from '../src/engine/nativeFetch';
import { stripKeys } from '../src/engine/secrets';
import { parseLooseJson } from '../src/engine/agent/llm';
import { trimHistory } from '../src/engine/agent/agent';
import { parseTrackFile } from '../src/content/lessonFile';
import type { AgentMsg } from '../src/engine/agent/llm';

describe('exercise integrity', () => {
  it('swaps hidden inputs in one pass, whole words only', () => {
    expect(applyVariants('f(50); f(100); f(500)', [['50', '60'], ['100', '150']])).toBe('f(60); f(150); f(500)');
    expect(applyVariants("x = 'a'; y = 'ab'", [["'a'", "'b'"], ["'b'", "'c'"]])).toBe("x = 'b'; y = 'ab'");
    expect(applyVariants('bat batch', [['bat', 'tab']])).toBe('tab batch');
  });

  it('flags printed answers but not real solutions', () => {
    const expected = 'total: 42\nmax: 9';
    const ref = { solution: 'print("total:", sum(xs))\nprint("max:", max(xs))', starter: '# TODO' };
    expect(looksHardcoded('print("total: 42")\nprint("max: 9")', expected, ref)).toBe(true);
    expect(looksHardcoded(ref.solution, expected, ref)).toBe(false);
    // Lines the reference itself prints literally (e.g. "Hello, World!") are fine to write by hand
    expect(looksHardcoded('print("Hello, World!")', 'Hello, World!', { solution: 'print("Hello, World!")' })).toBe(false);
  });
});

describe('save sync merge', () => {
  const save = (state: object) => JSON.stringify({ state, version: 4 });
  it('unites progress from two devices without losing anything', () => {
    const a = save({ name: 'Ada', xp: 300, gems: 10, completed: { l1: { xp: 50, at: '2026-03-02' }, l2: { xp: 50, at: '2026-03-03' } }, achievements: { first: '2026-03-02' }, streak: { count: 3, best: 3, last: '2026-03-03' }, stats: { runs: 5 }, xpLog: { '2026-03-03': 100 }, settings: { theme: 'dark' } });
    const b = save({ name: 'Ada', xp: 250, gems: 30, completed: { l1: { xp: 50, at: '2026-03-01' }, l3: { xp: 60, at: '2026-03-04' } }, achievements: { ten: '2026-03-04' }, streak: { count: 1, best: 7, last: '2026-03-04' }, stats: { runs: 9, reviews: 2 }, xpLog: { '2026-03-03': 40, '2026-03-04': 60 }, settings: { theme: 'light' } });
    const m = JSON.parse(mergeSaves(a, b)).state;
    expect(Object.keys(m.completed).sort()).toEqual(['l1', 'l2', 'l3']);
    expect(m.completed.l1.at).toBe('2026-03-01');
    expect(m.xp).toBe(300);
    expect(m.gems).toBe(30);
    expect(Object.keys(m.achievements).sort()).toEqual(['first', 'ten']);
    expect(m.streak).toEqual({ count: 1, best: 7, last: '2026-03-04' });
    expect(m.stats).toEqual({ runs: 9, reviews: 2 });
    expect(m.xpLog).toEqual({ '2026-03-03': 100, '2026-03-04': 60 });
    expect(m.settings.theme).toBe('dark'); // device settings stay local
  });
});

describe('security helpers', () => {
  it('renders AI markdown without executable HTML or dangerous links', () => {
    const html = safeMarked.parse('Hi <img src=x onerror="alert(1)"> [x](javascript:alert(1)) [ok](https://example.com) ![pic](https://evil.example/t.png)') as string;
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
    expect(html).not.toContain('javascript:');
    expect(html).toContain('href="https://example.com"');
  });

  it('allows plain http only to this device or the local network', () => {
    for (const h of ['localhost', '127.0.0.1', '192.168.1.20', '10.0.0.5', '172.20.1.1', 'pc.local', '::1']) expect(isLocalHost(h), h).toBe(true);
    for (const h of ['example.com', '8.8.8.8', '172.32.0.1', '192.169.0.1']) expect(isLocalHost(h), h).toBe(false);
    expect(() => checkUrl('https://api.openai.com/v1')).not.toThrow();
    expect(() => checkUrl('http://192.168.1.20:11434/v1')).not.toThrow();
    expect(() => checkUrl('http://api.example.com/v1')).toThrow();
    expect(() => checkUrl('file:///etc/passwd')).toThrow();
  });

  it('never persists API keys', () => {
    expect(stripKeys({ openai: { apiKey: 'sk-secret', model: 'm', baseUrl: 'u' } })).toEqual({ openai: { apiKey: '', model: 'm', baseUrl: 'u' } });
  });
});

describe('agent helpers', () => {
  it('parses tool-call JSON with raw newlines from small models', () => {
    expect(parseLooseJson('{"name": "write_file", "input": {"content": "a\nb"}}')).toEqual({ name: 'write_file', input: { content: 'a\nb' } });
  });

  it('trims long histories at a learner message', () => {
    const big = 'x'.repeat(50_000);
    const h: AgentMsg[] = [
      { role: 'user', text: 'first' },
      { role: 'assistant', text: big, calls: [] },
      { role: 'user', text: 'second' },
      { role: 'assistant', text: big, calls: [{ id: '1', name: 'list_files', input: {} }] },
      { role: 'tool', results: [{ id: '1', name: 'list_files', output: big }] },
      { role: 'user', text: 'third' },
    ];
    const t = trimHistory(h);
    expect(t[0].role).toBe('user');
    expect(t.length).toBeLessThan(h.length);
    expect((t[0] as { text: string }).text).toContain('left out');
    expect(trimHistory(h.slice(0, 2))).toEqual(h.slice(0, 2));
  });
});

describe('lesson file parser', () => {
  it('parses a track with code, quiz and cards', () => {
    const t = parseTrackFile(`+++ track
id: demo
title: Demo
icon: 🧪
tier: 1
color: #000
kind: core
blurb: A demo.
+++

=== lesson d1 | First | 40
Some **markdown**.
--- exercise code python
::prompt
Print hi.
::starter
pass
::solution
print("hi")
::expected
hi
::hints
- use print
--- cards
Front :: Back

=== lesson d2 | Quiz | 30
Text.
--- quiz
? Pick B
- A
+ B
> Because.
`);
    expect(t.lessons.map((l) => l.id)).toEqual(['d1', 'd2']);
    const ex = t.lessons[0].exercise;
    expect(ex?.kind === 'code' && ex.check).toEqual({ type: 'stdout', expected: 'hi' });
    expect(t.lessons[0].cards).toEqual([{ front: 'Front', back: 'Back' }]);
    const q = t.lessons[1].exercise;
    expect(q?.kind === 'quiz' && q.questions[0].answer).toBe(1);
  });

  const header = '+++ track\nid: demo\ntitle: Demo\nicon: x\ntier: 1\ncolor: #000\nkind: core\nblurb: A demo.\n+++\n';

  it('lets lesson text contain lines that start with === or ---', () => {
    const t = parseTrackFile(`${header}
=== lesson d1 | First | 40
=== Receipt ===
--- a dashed line of text, with punctuation.
--- cards
=== vs == :: compare with ===
`);
    expect(t.lessons).toHaveLength(1);
    expect(t.lessons[0].body).toContain('=== Receipt ===');
    expect(t.lessons[0].cards).toEqual([{ front: '=== vs ==', back: 'compare with ===' }]);
  });

  it('rejects misspelt section and lesson headers instead of swallowing them', () => {
    expect(() => parseTrackFile(`${header}\n=== lesson d1 | First | 40\nText.\n--- exercize code python\n`)).toThrow(/misspelt/);
    expect(() => parseTrackFile(`${header}\n=== lesson d1 | First | 40\nText.\n=== lessson d2 | Second | 40\n`)).toThrow(/misspelt/);
  });

  it('reads short field values on the same line, and loads SQL sample databases', () => {
    const t = parseTrackFile(
      `${header}\n=== lesson d1 | First | 40\nText.\n--- exercise code postgres\n::prompt\nP\n::dataset shop\n::starter\nSELECT 1;\n::solution\nSELECT 2;\n::reference\nSELECT 2;\n::ordered true\n`,
    );
    const check = t.lessons[0].exercise!.check;
    expect(check.type === 'sql' && check.ordered).toBe(true);
    expect(check.type === 'sql' && check.setup).toContain('CREATE TABLE customers');
    expect(() => parseTrackFile(`${header}\n=== lesson d1 | First | 40\nText.\n--- exercise code postgres\n::prompt\nP\n::dataset nope\n::starter\nx\n::solution\ny\n::reference\ny\n`)).toThrow(/unknown ::dataset nope/);
  });

  it('rejects unknown exercise fields', () => {
    const exercise = (field: string) =>
      `${header}\n=== lesson d1 | First | 40\nText.\n--- exercise code python\n::prompt\nP\n::starter\nx\n::solution\ny\n::${field}\nprint(1)\n`;
    expect(() => parseTrackFile(exercise('expected'))).not.toThrow();
    expect(() => parseTrackFile(exercise('expectd'))).toThrow(/unknown field ::expectd/);
  });
});
