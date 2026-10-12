import type { Challenge, CodeExercise, CodeLang } from './types';
import { langLabel } from './langMeta';

/**
 * Code Dojo challenges for every language beyond Python, JavaScript and SQL.
 * The same classic problems appear in several languages with identical inputs and output,
 * so learners can compare how each language solves them. Programs live in plain-text files
 * (src/content/dojo/<lang>.txt) so code needs no escaping:
 *
 *   ### <theme> | <Easy|Medium|Hard>
 *   fn: `signature shown in the prompt`
 *   hint: optional language-specific hint (repeatable)
 *   --- head      (optional: imports, class opening…)
 *   --- stub      (the learner's starting point)
 *   --- sol       (reference solution)
 *   --- main      (fixed driver code that prints the results)
 */

const XP = { Easy: 30, Medium: 60, Hard: 100 } as const;

/** `hidden`: input swaps for the hidden test (applied to the learner's program and the reference; outputs must match). */
type Theme = { title: string; tags: string[]; prompt: string; expected: string; hints: string[]; hidden: [string, string][] };

const THEMES: Record<string, Theme> = {
  rle: {
    hidden: [['aaabccdddd', 'xxxyzzzzzw'], ['aabbaa', 'aaaaab']],
    title: 'Run-Length Encoding',
    tags: ['strings'],
    prompt: '**Run-length encoding** compresses repeated characters: each run becomes the character followed by the run length. Implement {fn} so that `aaabccdddd` becomes `a3b1c2d4`. The program prints each input and its encoding.',
    expected: `aaabccdddd -> a3b1c2d4
z -> z1
aabbaa -> a2b2a2
abc -> a1b1c1`,
    hints: ['Walk the string with two indexes: i marks the start of a run, j moves forward while the character stays the same.', 'Append the character and (j - i), then continue from j.'],
  },
  wordfreq: {
    hidden: [['the cat and the hat and the bat sat on the mat', 'to be or not to be that is the question to be'], ['Go go GO! Rust, rust; C.', 'Zig zig; Nim nim nim! Odin']],
    title: 'Top Words',
    tags: ['strings', 'maps', 'sorting'],
    prompt: 'Implement {fn}: lower-case the text, split it into words (runs of letters `a`–`z`; everything else separates words), count each word and return the **top n** as `word: count` lines, most frequent first and **alphabetical when counts tie**.',
    expected: `the: 4
and: 2
bat: 1
go: 3
rust: 2
c: 1`,
    hints: ['Count with a map/dictionary from word to count.', 'Sort by count descending, then by word ascending, and keep the first n.'],
  },
  brackets: {
    hidden: [["'(('", "'(]'"], ['"(("', '"(]"'], ["'([)]'", "'{[()()]}'"], ['"([)]"', '"{[()()]}"'], ['a(b[c]d)e', '[(a){b}]x)']],
    title: 'Balanced Brackets',
    tags: ['stacks'],
    prompt: 'Implement {fn} that returns whether every bracket `()`, `[]`, `{}` in the string is closed in the right order. Other characters are ignored. The program prints `true` or `false` for each input.',
    expected: `([]{}) -> true
([)] -> false
(( -> false
a(b[c]d)e -> true
}{ -> false`,
    hints: ['Push every opening bracket onto a stack.', 'On a closing bracket, pop and check it matches; an empty stack or a mismatch means unbalanced. At the end the stack must be empty.'],
  },
  roman: {
    hidden: [['MCMXCIV', 'MDCCCLXXXVIII'], ['XLII', 'XCIX'], ['CDXLIV', 'MMMCMXCIX']],
    title: 'Roman Numerals',
    tags: ['strings', 'maps'],
    prompt: 'Implement {fn} converting a Roman numeral to an integer. Values: `I`=1 `V`=5 `X`=10 `L`=50 `C`=100 `D`=500 `M`=1000. A smaller value written before a larger one is subtracted (`IV` = 4, `CM` = 900).',
    expected: `MCMXCIV = 1994
XLII = 42
III = 3
CDXLIV = 444
MMXXVI = 2026`,
    hints: ['Look up each symbol in a map or switch.', 'If the next symbol is larger, subtract the current value; otherwise add it.'],
  },
  bsearch: {
    hidden: [['7, 1, 13, 4, 20', '9, 3, 11, 2, 0']],
    title: 'Binary Search',
    tags: ['arrays', 'search'],
    prompt: 'Implement {fn}: classic **binary search** on a sorted array. Return the index of the target, or -1 when it is missing. It must be O(log n), so no linear scan.',
    expected: `search(7) = 3
search(1) = 0
search(13) = 6
search(4) = -1
search(20) = -1`,
    hints: ['Keep lo = 0 and hi = n - 1 and loop while lo <= hi.', 'mid = lo + (hi - lo) / 2 avoids overflow. Move lo or hi past mid depending on the comparison.'],
  },
  spiral: {
    hidden: [['4, 4', '2, 5'], ['3, 1', '4, 1']],
    title: 'Spiral Matrix',
    tags: ['arrays', 'matrices'],
    prompt: 'Implement {fn} returning the values of a matrix in **clockwise spiral order** from the top-left: right along the top row, down the right column, left along the bottom row, up the left column, then repeat inwards. The program builds matrices filled with 1, 2, 3… row by row.',
    expected: `1 2 3 4 8 12 11 10 9 5 6 7
1 2 3 4 8 12 16 15 14 13 9 5 6 7 11 10
1 2 3
1 2 3`,
    hints: ['Track four boundaries: top, bottom, left, right.', 'After each side, move that boundary inwards. Check top <= bottom and left <= right again before the bottom row and left column, or single rows/columns are visited twice.'],
  },
  longest: {
    hidden: [['abcabcbb', 'aabbccdefa'], ['devquest', 'programming'], ['pwwkew', 'xyzzyx']],
    title: 'Longest Unique Substring',
    tags: ['strings', 'sliding window'],
    prompt: 'Implement {fn}: find the **longest substring without repeating characters**. If several have the same length, return the first one. The program prints its length and the substring. Aim for one pass with a sliding window.',
    expected: `abcabcbb -> 3 abc
bbbbb -> 1 b
pwwkew -> 3 wke
dvdf -> 3 vdf
devquest -> 6 vquest`,
    hints: ['Remember the last index where each character was seen.', 'When the current character was seen inside the window, move the window start just past that index. Update the best only when strictly longer.'],
  },
  caesar: {
    hidden: [['Hello, World!', 'Quiet Zebras, 42!'], ['Khoor, Zruog!', 'Wkh Txlfn Ira!'], ['DevQuest', 'Sandbox']],
    title: 'Caesar Cipher',
    tags: ['strings'],
    prompt: 'Implement {fn}: the Caesar cipher shifts each letter k places along the alphabet, wrapping around (`z` + 1 = `a`). Keep upper and lower case, leave other characters unchanged, and support negative shifts (that is how you decode).',
    expected: `Khoor, Zruog!
zab CDE
Hello, World!
QriDhrfg`,
    hints: ['Normalise the shift first: ((k % 26) + 26) % 26 turns -3 into 23.', 'For a letter: base + (letter - base + shift) % 26, with base = A or a.'],
  },
  sieve: {
    hidden: [['50', '60'], ['100', '150']],
    title: 'Prime Sieve',
    tags: ['math', 'arrays'],
    prompt: 'Implement {fn} with the **Sieve of Eratosthenes**: return every prime ≤ n. Keep a boolean array; for each prime p, mark p×p, p×p+p, … as composite.',
    expected: `primes(50): 2 3 5 7 11 13 17 19 23 29 31 37 41 43 47
count(100): 25
primes(2): 2`,
    hints: ['Create n + 1 flags, all "maybe prime".', 'Walk p from 2: if p is not marked, it is prime; then mark its multiples starting at p * p.'],
  },
  twosum: {
    hidden: [['2, 7, 11, 15', '5, 7, 2, 15'], ['3, 2, 4', '4, 1, 2']],
    title: 'Two Sum',
    tags: ['arrays', 'maps'],
    prompt: 'Implement {fn}: return the indices `i j` (i < j) of two numbers that add up to the target, or `none`. Do it in one pass with a hash map: for each number, check whether `target - number` was already seen.',
    expected: `0 1
1 2
0 1
none`,
    hints: ['Map each value to the first index where you saw it.', 'Check for the complement before inserting the current number, so a number is never paired with itself.'],
  },
  intervals: {
    hidden: [['8, 10', '7, 9'], ['15, 18', '16, 20'], ['5, 7', '4, 7']],
    title: 'Merge Intervals',
    tags: ['sorting', 'arrays'],
    prompt: 'Implement {fn}: merge all overlapping intervals and return them sorted by start. Touching intervals such as `[1,4]` and `[4,5]` merge too, and the input may be unsorted.',
    expected: `[1,6] [8,10] [15,18]
[1,5]
[1,3] [5,7]
[1,10]`,
    hints: ['Sort by start first.', 'Keep a result list: if an interval starts at or before the end of the last merged one, extend that end with max(); otherwise append it.'],
  },
  anagrams: {
    hidden: [['bat', 'tab'], ['gogole', 'oggleo'], ['act', 'cta']],
    title: 'Anagram Groups',
    tags: ['strings', 'maps'],
    prompt: 'Implement {fn}: group words that are anagrams of each other. Groups appear in the order their first word appears, and words keep their original order inside a group. The program prints one group per line.',
    expected: `eat tea ate
tan nat
bat
listen silent enlist
google gogole
cat act`,
    hints: ['Sorting a word\'s letters gives a key shared by all its anagrams ("eat", "tea" → "aet").', 'Keep groups in a list and remember each key\'s position, so the output order matches first appearance.'],
  },
};

const files = import.meta.glob('./dojo/*.txt', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const DIFF_ORDER = { Easy: 0, Medium: 1, Hard: 2 } as const;

function parse(lang: CodeLang, src: string): Challenge[] {
  const out: Challenge[] = [];
  for (const block of src.replace(/\r\n/g, '\n').split(/^### /m).slice(1)) {
    const nl = block.indexOf('\n');
    const [themeId, diff] = block.slice(0, nl).split('|').map((s) => s.trim());
    const theme = THEMES[themeId];
    const difficulty = diff as Challenge['difficulty'];
    if (!theme || !(difficulty in XP)) throw new Error(`dojo/${lang}.txt: bad header "${block.slice(0, nl)}"`);
    const [metaPart, ...parts] = block.slice(nl + 1).split(/^--- /m);
    const fn = metaPart.match(/^fn: (.*)$/m)?.[1] ?? themeId;
    const extraHints = [...metaPart.matchAll(/^hint: (.*)$/gm)].map((m) => m[1]);
    const sec: Record<string, string> = {};
    for (const p of parts) {
      const i = p.indexOf('\n');
      sec[p.slice(0, i).trim()] = p.slice(i + 1).replace(/\s+$/, '') + '\n';
    }
    const program = (body: string) => [sec.head, body, sec.main].filter(Boolean).join('\n');
    const exercise: CodeExercise = {
      kind: 'code',
      lang,
      prompt: `${theme.prompt.replace('{fn}', fn)}\n\nOnly change the function: the code below it prints the results that are checked.`,
      starter: program(sec.stub),
      solution: program(sec.sol),
      hints: [...theme.hints, ...extraHints],
      check: { type: 'stdout', expected: theme.expected, variants: theme.hidden },
    };
    out.push({ id: `dojo-${lang}-${themeId}`, title: `${theme.title} (${langLabel(lang)})`, difficulty, tags: [...theme.tags], xp: XP[difficulty], exercise });
  }
  return out.sort((a, b) => DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty]);
}

/** Language order matches the Languages page. */
const ORDER: CodeLang[] = ['typescript', 'go', 'java', 'csharp', 'kotlin', 'swift', 'dart', 'rust', 'c', 'cpp', 'php', 'ruby', 'r', 'lua', 'bash', 'powershell'];

export const LANG_CHALLENGES: Challenge[] = ORDER.flatMap((lang) => {
  const src = files[`./dojo/${lang}.txt`];
  return src ? parse(lang, src) : [];
});
