import { HOME, Shell } from '../shell';
import { runSandboxed, type RunResult } from '../runners';
import { hasToolBridge, localTool, runLocal } from '../localRun';
import type { CodeLang, NativeLang } from '../../content/types';
import { langLabel } from '../../content/langMeta';

/**
 * The Agent Lab workspace: a virtual project folder plus a terminal, shared by the learner and the AI agent.
 *
 * Isolation:
 * - Files live only in memory (and this device's app storage). Nothing reads or writes the real disk.
 * - The terminal is the simulated Bash shell (src/engine/shell.ts), so commands can't reach the OS.
 * - `python`, `node`, `tsx`, `lua`, `sqlite3` and `run` execute files in locked-down Web Workers
 *   (no network, no storage, time-limited; see runSandboxed). HTML runs in a sandboxed iframe.
 * - Compiled languages can run on the desktop app's real toolchains, but only after the learner approves
 *   each run (or the session), because those are real programs on their computer.
 */

export const EXT_LANG: Record<string, CodeLang> = {
  py: 'python', js: 'javascript', mjs: 'javascript', ts: 'typescript', lua: 'lua', sql: 'sql', html: 'web', htm: 'web',
  go: 'go', rs: 'rust', c: 'c', cpp: 'cpp', cc: 'cpp', cxx: 'cpp', java: 'java', kt: 'kotlin', swift: 'swift', cs: 'csharp',
  dart: 'dart', rb: 'ruby', php: 'php', r: 'r', sh: 'bash', ps1: 'powershell', sol: 'solidity',
};

const BROWSER: CodeLang[] = ['python', 'javascript', 'typescript', 'lua', 'sql', 'web'];

/** Interpreter-style commands the sandbox terminal understands, beyond the simulated shell's built-ins. */
const RUN_CMDS = new Set(['run', 'python', 'python3', 'node', 'tsx', 'ts-node', 'lua', 'sqlite3', 'test', 'ruby', 'php', 'Rscript', 'java', 'go', 'dart', 'swift', 'bash', 'sh', 'pwsh']);

export const langOfPath = (path: string): CodeLang | null => EXT_LANG[path.split('.').pop()?.toLowerCase() ?? ''] ?? null;

export type ExecOpts = {
  /** Called before a compiled-language program runs on the real computer. Resolve true to allow. */
  approveNative?: (lang: CodeLang, path: string) => Promise<boolean>;
};

export type ExecResult = { output: string; ok: boolean; clear?: boolean };

const MAX_FILE = 200_000;
const MAX_FILES = 200;

export class Sandbox {
  shell = new Shell();

  constructor(files: Record<string, string> = {}) {
    // Start from an empty home folder (the Shell adds a readme for the Terminal lessons)
    const home = this.shell.get(HOME);
    if (home?.type === 'dir') home.children = {};
    for (const [p, content] of Object.entries(files)) this.write(p, content);
  }

  /** Absolute path for a workspace path. Relative paths start at the workspace root (not the terminal's cwd). */
  abs(path: string) {
    const p = path.trim().replace(/^\.\//, '');
    const abs = this.shell.resolve(p.startsWith('/') || p.startsWith('~') ? p : `${HOME}/${p}`);
    if (abs !== HOME && !abs.startsWith(HOME + '/')) throw new Error(`${path}: outside the workspace`);
    return abs;
  }

  /** Workspace-relative path for display ("src/app.py"). */
  rel(path: string) {
    const abs = this.abs(path);
    return abs === HOME ? '.' : abs.slice(HOME.length + 1);
  }

  isFile(path: string) {
    try {
      return this.shell.get(this.abs(path))?.type === 'file';
    } catch {
      return false;
    }
  }

  /** Every file in the workspace, keyed by workspace-relative path. */
  files(): Record<string, string> {
    const out: Record<string, string> = {};
    const walk = (node: ReturnType<Shell['get']>, prefix: string) => {
      if (!node) return;
      if (node.type === 'file') out[prefix] = node.content;
      else for (const [name, child] of Object.entries(node.children).sort(([a], [b]) => a.localeCompare(b))) walk(child, prefix ? `${prefix}/${name}` : name);
    };
    walk(this.shell.get(HOME), '');
    return out;
  }

  list(path = '.') {
    const abs = this.abs(path);
    const node = this.shell.get(abs);
    if (!node) throw new Error(`${path}: No such file or directory`);
    if (node.type === 'file') return `${this.rel(abs)} (${node.content.length} chars)`;
    const lines: string[] = [];
    const walk = (n: typeof node, indent: string) => {
      if (n.type !== 'dir') return;
      for (const [name, child] of Object.entries(n.children).sort(([a], [b]) => a.localeCompare(b))) {
        lines.push(`${indent}${name}${child.type === 'dir' ? '/' : ` (${child.content.split('\n').length} lines)`}`);
        if (child.type === 'dir') walk(child, indent + '  ');
      }
    };
    walk(node, '');
    return lines.length ? lines.join('\n') : '(empty)';
  }

  read(path: string) {
    return this.shell.read(this.abs(path));
  }

  write(path: string, content: string) {
    const abs = this.abs(path);
    if (content.length > MAX_FILE) throw new Error(`File too large (max ${MAX_FILE / 1000} KB)`);
    if (!this.shell.exists(abs) && Object.keys(this.files()).length >= MAX_FILES) throw new Error(`Workspace is full (max ${MAX_FILES} files)`);
    this.shell.mkdirp(abs.slice(0, abs.lastIndexOf('/')) || '/');
    this.shell.write(abs, content);
  }

  /** Replace one exact occurrence of `find` (must be unique, so edits are unambiguous). */
  edit(path: string, find: string, replace: string) {
    const text = this.read(path);
    const count = find ? text.split(find).length - 1 : 0;
    if (count === 0) throw new Error(`The text to replace was not found in ${path}. Read the file again and copy the exact text.`);
    if (count > 1) throw new Error(`The text to replace appears ${count} times in ${path}. Include more surrounding lines so it is unique.`);
    this.write(path, text.replace(find, () => replace));
  }

  remove(path: string) {
    const abs = this.abs(path);
    if (abs === HOME) throw new Error('Refusing to delete the whole workspace');
    this.shell.exec(`rm -r "${abs}"`);
  }

  /** Run one terminal line: program-running commands are handled here, everything else by the simulated shell. */
  async exec(line: string, opts: ExecOpts = {}): Promise<ExecResult> {
    const trimmed = line.trim();
    if (!trimmed) return { output: '', ok: true };
    const first = trimmed.split(/\s+/)[0];
    if (!RUN_CMDS.has(first) && !/(^|&&|;)\s*(run|python3?|node|tsx|ts-node|lua|sqlite3|test)\s/.test(trimmed)) {
      const out = this.shell.exec(trimmed);
      if (out === '\x1bclear') return { output: '', ok: true, clear: true };
      return { output: out, ok: !/^bash: /m.test(out) };
    }
    if (/\|/.test(trimmed)) return { output: 'bash: piping a program\'s output is not supported in the sandbox. Run the program on its own line.', ok: false };
    // Chains like `python a.py && python b.py`
    const outputs: string[] = [];
    let ok = true;
    this.shell.history.push(trimmed);
    for (const part of trimmed.split(/\s*(?:&&|;)\s*/)) {
      const [cmd, ...args] = part.split(/\s+/);
      let r: ExecResult;
      if (RUN_CMDS.has(cmd)) r = await this.runCommand(cmd, args, opts);
      else {
        const out = this.shell.exec(part);
        r = { output: out, ok: !/^bash: /m.test(out) };
      }
      if (r.output) outputs.push(r.output.replace(/\n$/, ''));
      if (!r.ok) {
        ok = false;
        break;
      }
    }
    return { output: outputs.join('\n'), ok };
  }

  private async runCommand(cmd: string, args: string[], opts: ExecOpts): Promise<ExecResult> {
    // Paths typed in the terminal are relative to its current folder
    const files = args.filter((a) => !a.startsWith('-') && a !== 'run' && a !== '<').map((a) => this.shell.resolve(a.replace(/^["']|["']$/g, '')));
    if (cmd === 'test') {
      const [src, tests] = files;
      if (!src || !tests) return { output: 'usage: test <file> <tests-file>   (runs the file, then the tests against it)', ok: false };
      return this.runFile(src, opts, tests);
    }
    const file = files[0];
    if (!file) {
      if (cmd === 'python' || cmd === 'python3' || cmd === 'node' || cmd === 'lua') return { output: `${cmd}: the sandbox has no interactive REPL. Write code to a file and run \`${cmd} file\`.`, ok: false };
      return { output: `usage: ${cmd} <file>`, ok: false };
    }
    return this.runFile(file, opts);
  }

  /** Run a workspace file in the sandbox (or, for compiled languages on desktop, on approval). */
  async runFile(path: string, opts: ExecOpts = {}, testsPath?: string): Promise<ExecResult> {
    let code: string;
    let tests: string | undefined;
    try {
      code = this.read(path);
      tests = testsPath ? this.read(testsPath) : undefined;
    } catch (e) {
      return { output: (e as Error).message.split(`${HOME}/`).join(''), ok: false };
    }
    const lang = langOfPath(path);
    if (!lang) return { output: `${this.rel(path)}: don't know how to run this file type`, ok: false };
    if (tests && lang !== 'python' && lang !== 'javascript' && lang !== 'typescript' && lang !== 'lua') {
      return { output: 'test: tests files work for Python, JavaScript, TypeScript and Lua. For other languages, put the checks in the program itself.', ok: false };
    }
    let r: RunResult;
    if (BROWSER.includes(lang)) {
      r = await runSandboxed(lang, code, tests);
    } else if (lang === 'bash' && !(hasToolBridge && localTool('bash'))) {
      return this.runScriptInShell(code);
    } else {
      if (!hasToolBridge) return { output: `${langLabel(lang)} programs need the DevQuest desktop app with a ${langLabel(lang)} toolchain installed. In the browser sandbox you can run Python, JavaScript, TypeScript, Lua, SQL and HTML.`, ok: false };
      const tool = localTool(lang);
      if (!tool) return { output: `No ${langLabel(lang)} toolchain was found on this computer (Settings → Local compilers).`, ok: false };
      const shown = this.rel(path);
      const allowed = (await opts.approveNative?.(lang, shown)) ?? false;
      if (!allowed) return { output: `Run of ${shown} was not approved by the learner.`, ok: false };
      const res = await runLocal(lang as NativeLang, code);
      r = { ok: res.ok, output: res.output, error: res.error };
    }
    const parts = [r.output?.replace(/\n$/, '')];
    if (r.table) parts.push(formatTable(r.table));
    if (r.error) parts.push(r.error);
    if (r.message && tests) parts.push(r.passed ? `✅ ${r.message}` : `❌ ${r.message}`);
    return { output: parts.filter(Boolean).join('\n'), ok: r.ok && r.passed !== false };
  }

  /** In the browser, `bash script.sh` runs the script's simple commands line by line in the simulated shell. */
  private runScriptInShell(code: string): ExecResult {
    const out: string[] = [];
    for (const raw of code.split('\n')) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      if (/^(if|for|while|case|function)\b|\(\)\s*\{/.test(line)) {
        out.push('bash: the browser sandbox runs simple command lists only (no if/for/while/functions). Use the desktop app for full Bash.');
        return { output: out.join('\n'), ok: false };
      }
      const r = this.shell.exec(line);
      if (r) out.push(r);
    }
    return { output: out.join('\n'), ok: true };
  }
}

function formatTable(t: { columns: string[]; values: unknown[][] }) {
  const rows = [t.columns, ...t.values.map((r) => r.map((v) => (v === null ? 'NULL' : String(v))))];
  const widths = t.columns.map((_, i) => Math.max(...rows.map((r) => String(r[i] ?? '').length)));
  const fmt = (r: unknown[]) => r.map((v, i) => String(v ?? '').padEnd(widths[i])).join(' | ');
  return [fmt(rows[0]), widths.map((w) => '-'.repeat(w)).join('-+-'), ...rows.slice(1).map(fmt), `(${t.values.length} row${t.values.length === 1 ? '' : 's'})`].join('\n');
}
