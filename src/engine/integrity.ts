/** Pure helpers that tell real solutions from printed answers (used by execute.ts; unit-tested). */

/** The exercise's reference code, used to tell real solutions from printed answers. */
export type Reference = { solution?: string; starter?: string };

export const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Apply find → replace swaps in one pass (no chained replacements); whole-word for alphanumeric edges. */
export function applyVariants(code: string, variants: [string, string][]) {
  const sorted = [...variants].sort((a, b) => b[0].length - a[0].length);
  const re = new RegExp(sorted.map(([from]) => `${/^\w/.test(from) ? '\\b' : ''}${escapeRe(from)}${/\w$/.test(from) ? '\\b' : ''}`).join('|'), 'g');
  const map = new Map(sorted);
  return code.replace(re, (m) => map.get(m) ?? m);
}

/**
 * True when the program seems to print the expected output as fixed text instead of computing it:
 * most expected lines that the reference solution computes appear verbatim in the learner's code.
 */
export function looksHardcoded(code: string, expected: string, ref: Reference) {
  if (!ref.solution) return false;
  const lines = [...new Set(expected.replace(/\r\n/g, '\n').split('\n').map((l) => l.trim()).filter((l) => l.length >= 3))];
  // Only lines the reference computes (not printed literally by it, and not given in the starter)
  const computed = lines.filter((l) => !ref.solution!.includes(l) && !(ref.starter ?? '').includes(l));
  if (!computed.length) return false;
  const pasted = computed.filter((l) => code.includes(l));
  return pasted.length >= Math.max(1, Math.ceil(computed.length / 2));
}

