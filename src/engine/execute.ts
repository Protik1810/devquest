import type { CodeCheck, CodeLang, NativeLang } from '../content/types';
import { LANG_META } from '../content/langMeta';
import { runCode, type RunResult } from './runners';
import { hasToolBridge, localTool, runLocal, runsInApp } from './localRun';
import { checkProgram, currentAI } from './ai';

/**
 * How code in a language gets checked here:
 * app   – runs inside DevQuest (browser runtimes)
 * local – compiled/run by a toolchain installed on this PC (desktop app)
 * ai    – the AI traces the program (no compiler available)
 * self  – no compiler and no AI: the learner compares with the reference solution
 */
export type ExecMode = 'app' | 'local' | 'ai' | 'self';

export type ExecResult = RunResult & { mode: ExecMode; tool?: string };

export function execMode(lang: CodeLang): ExecMode {
  if (runsInApp(lang)) return 'app';
  if (localTool(lang)) return 'local';
  if (currentAI().ready) return 'ai';
  return 'self';
}

export function modeLabel(lang: CodeLang): { icon: string; text: string } {
  const mode = execMode(lang);
  const name = LANG_META[lang].label;
  if (mode === 'app') return { icon: '⚡', text: `${name} runs right here in DevQuest` };
  if (mode === 'local') return { icon: '⚙️', text: `Runs with ${localTool(lang)!.tool} on your computer` };
  if (mode === 'ai')
    return {
      icon: '🤖',
      text: hasToolBridge ? `No ${name} toolchain found on this PC, so the AI checks your code by tracing it` : `${name} can't run on this device, so the AI checks your code by tracing it. Use the desktop app with ${name} installed to run it for real`,
    };
  return { icon: '📝', text: `${name} can't run here and no AI is set up: compare your answer with the solution (self-check)` };
}

export { applyVariants, looksHardcoded, sameOutput, type Reference } from './integrity';
import { applyVariants, looksHardcoded, sameOutput, type Reference } from './integrity';

const HARDCODED_MSG = '🕵️ Your program prints the expected output as fixed text instead of computing it. Write code that works it out, so it would still be right for other inputs.';
const VARIANT_MSG = '🕵️ Your program matches the example, but gives different results when the inputs change (hidden test). Make sure it computes the answer from its inputs instead of returning fixed values.';

async function runPlain(lang: CodeLang, mode: ExecMode, code: string, stdin?: string): Promise<{ ok: boolean; output: string }> {
  if (mode === 'app') {
    const r = await runCode(lang, code, undefined, stdin);
    return { ok: r.ok, output: r.output ?? '' };
  }
  const r = await runLocal(lang as NativeLang, code);
  return { ok: r.ok, output: r.output ?? '' };
}

/** After an output match: reject pasted answers, then run the hidden-input variants against the reference. */
async function integrity(lang: CodeLang, mode: ExecMode, code: string, check: CodeCheck, ref: Reference): Promise<string | null> {
  // State-checked exercises (hidden verify commands) can't be passed by printing text
  if (check.type !== 'stdout' || check.verify) return null;
  if (looksHardcoded(code, check.expected, ref)) return HARDCODED_MSG;
  if (!check.variants?.length || !ref.solution) return null;
  const mine = await runPlain(lang, mode, applyVariants(code, check.variants), check.stdin);
  const theirs = await runPlain(lang, mode, applyVariants(ref.solution, check.variants), check.stdin);
  if (!theirs.ok) return null; // the swap didn't fit this reference: don't punish the learner
  return mine.ok && sameOutput(mine.output, theirs.output) ? null : VARIANT_MSG;
}

/** `stdin` is the typed input for input() when running without a check (the check carries its own). */
export async function execute(lang: CodeLang, code: string, check: CodeCheck | undefined, task: string, ref: Reference = {}, stdin?: string): Promise<ExecResult> {
  const mode = execMode(lang);
  if (mode === 'app') {
    const r = await runCode(lang, code, check, check && 'stdin' in check ? check.stdin : stdin);
    if (r.passed && check) {
      const problem = await integrity(lang, mode, code, check, ref);
      if (problem) return { ...r, passed: false, message: problem, mode };
    }
    return { ...r, mode };
  }

  const expected = check?.type === 'stdout' ? check.expected : undefined;

  if (mode === 'local') {
    const tool = localTool(lang)!;
    const r = await runLocal(lang as NativeLang, code);
    if (!r.ok) return { ok: false, output: r.output, error: r.error, passed: check ? false : undefined, mode, tool: tool.tool };
    if (tool.compileOnly) {
      // Solidity: solc proves it compiles; behaviour is judged by the AI when available
      if (check && currentAI().ready && expected !== undefined) {
        const ai = await checkProgram({ lang: LANG_META[lang].label, task, code, expected });
        return { ok: true, output: r.output, passed: ai.passed, message: [ai.feedback, ...ai.issues.map((i) => `• ${i}`)].join('\n'), mode, tool: tool.tool };
      }
      return { ok: true, output: r.output, passed: check ? true : undefined, message: check ? 'Compiles successfully.' : undefined, mode, tool: tool.tool };
    }
    if (expected === undefined) return { ok: true, output: r.output, mode, tool: tool.tool };
    const passed = sameOutput(r.output, expected);
    if (passed && check) {
      const problem = await integrity(lang, mode, code, check, ref);
      if (problem) return { ok: true, output: r.output, passed: false, message: problem, mode, tool: tool.tool };
    }
    return { ok: true, output: r.output, passed, message: passed ? 'Output matches!' : 'Your output differs from the expected output.', ...(passed ? {} : { expected }), mode, tool: tool.tool };
  }

  if (mode === 'ai') {
    if (expected === undefined) {
      const ai = await checkProgram({ lang: LANG_META[lang].label, task: task || 'Free-form program: predict its output.', code, expected: '(no expected output: just predict what it prints)' });
      return { ok: true, output: ai.predicted_output, message: ai.feedback, mode };
    }
    if (check && looksHardcoded(code, expected, ref)) return { ok: true, output: '', passed: false, message: HARDCODED_MSG, mode };
    const ai = await checkProgram({ lang: LANG_META[lang].label, task, code, expected });
    return {
      ok: true,
      output: ai.predicted_output ? `(predicted by AI)\n${ai.predicted_output}` : '',
      passed: ai.passed,
      message: [ai.passed ? '🤖 The AI traced your program and it should produce the expected output.' : `🤖 ${ai.feedback}`, ...(ai.passed ? [] : ai.issues.map((i) => `• ${i}`))].join('\n'),
      mode,
    };
  }

  return { ok: true, output: '', mode };
}
