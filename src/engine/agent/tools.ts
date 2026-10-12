import type { CodeLang } from '../../content/types';
import type { Sandbox } from './sandbox';
import type { ToolCall, ToolResult, ToolSpec } from './llm';

/** Everything the agent can do. Each tool acts only on the sandbox workspace or talks to the learner. */
export const TOOLS: ToolSpec[] = [
  {
    name: 'list_files',
    description: 'List the files in the workspace (or a folder in it) as a tree with line counts.',
    parameters: { type: 'object', properties: { path: { type: 'string', description: 'Folder to list, relative to the workspace. Default: the whole workspace.' } } },
  },
  {
    name: 'read_file',
    description: 'Read a file from the workspace. Use this before editing a file the learner may have changed.',
    parameters: { type: 'object', properties: { path: { type: 'string', description: 'File path relative to the workspace, e.g. "main.py".' } }, required: ['path'] },
  },
  {
    name: 'write_file',
    description: 'Create or overwrite a file in the workspace with the full content. Parent folders are created automatically.',
    parameters: {
      type: 'object',
      properties: { path: { type: 'string', description: 'File path relative to the workspace.' }, content: { type: 'string', description: 'The complete file content.' } },
      required: ['path', 'content'],
    },
  },
  {
    name: 'edit_file',
    description: 'Replace one exact, unique piece of text in a file. Prefer this over write_file for small changes.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path relative to the workspace.' },
        old_text: { type: 'string', description: 'Exact text to replace (must appear exactly once).' },
        new_text: { type: 'string', description: 'Replacement text.' },
      },
      required: ['path', 'old_text', 'new_text'],
    },
  },
  {
    name: 'delete_file',
    description: 'Delete a file or folder from the workspace.',
    parameters: { type: 'object', properties: { path: { type: 'string', description: 'Path relative to the workspace.' } }, required: ['path'] },
  },
  {
    name: 'run_command',
    description:
      'Run a command in the sandbox terminal (a simulated Linux Bash: ls, cat, grep, find, wc, head, tail, sort, uniq, mkdir, cp, mv, rm, echo with > and >>, pipes between these). ' +
      'Run programs with `python file.py`, `node file.js`, `tsx file.ts`, `lua file.lua`, `sqlite3 file.sql`, or `run <file>` for any language. ' +
      '`test <file> <tests-file>` runs a file and then a tests file against it (Python/JS/TS/Lua; tests use assert statements).',
    parameters: { type: 'object', properties: { command: { type: 'string', description: 'The command line to run.' } }, required: ['command'] },
  },
  {
    name: 'ask_learner',
    description:
      'Ask the learner a question and wait for their answer. Use it for check-for-understanding questions (give 2-4 choices for a quiz) or to ask what they want next. The learner sees the question in the chat.',
    parameters: {
      type: 'object',
      properties: {
        question: { type: 'string', description: 'The question (markdown allowed).' },
        choices: { type: 'array', items: { type: 'string' }, description: 'Optional answer choices for a multiple-choice question.' },
      },
      required: ['question'],
    },
  },
  {
    name: 'open_file',
    description: "Open a workspace file in the learner's editor so they can read or work on it.",
    parameters: { type: 'object', properties: { path: { type: 'string', description: 'File path relative to the workspace.' } }, required: ['path'] },
  },
];

export type ToolHost = {
  sandbox: Sandbox;
  /** Files the learner wrote or edited. In Tutor and Debug modes the agent must ask before changing them. */
  isProtected: (path: string) => boolean;
  approveChange: (path: string, action: 'write' | 'edit' | 'delete') => Promise<boolean>;
  approveNative: (lang: CodeLang, path: string) => Promise<boolean>;
  askLearner: (question: string, choices: string[]) => Promise<string>;
  openFile: (path: string) => void;
  onCommand: (command: string, output: string, ok: boolean) => void;
  onFilesChanged: () => void;
};

const MAX_OUTPUT = 8000;
const clip = (s: string) => (s.length > MAX_OUTPUT ? `${s.slice(0, MAX_OUTPUT)}\n… (${s.length - MAX_OUTPUT} more characters cut)` : s);
const str = (v: unknown, name: string) => {
  if (typeof v !== 'string') throw new Error(`Missing or invalid "${name}" (expected a string)`);
  return v;
};

export async function executeTool(call: ToolCall, host: ToolHost): Promise<ToolResult> {
  const { sandbox: sb } = host;
  const done = (output: string, isError = false): ToolResult => ({ id: call.id, name: call.name, output: clip(output), isError });
  const guard = async (path: string, action: 'write' | 'edit' | 'delete') => {
    const rel = sb.rel(path);
    if (host.isProtected(rel) && !(await host.approveChange(rel, action))) throw new Error(`The learner did not allow changing ${rel}. It is their work: suggest the change in chat or give a hint instead.`);
  };
  try {
    const a = call.input;
    switch (call.name) {
      case 'list_files':
        return done(sb.list(typeof a.path === 'string' && a.path ? a.path : '.'));
      case 'read_file': {
        const path = str(a.path, 'path');
        const lines = sb.read(path).split('\n');
        return done(lines.map((l, i) => `${String(i + 1).padStart(4)}  ${l}`).join('\n'));
      }
      case 'write_file': {
        const path = str(a.path, 'path');
        const content = str(a.content, 'content');
        if (sb.isFile(path)) await guard(path, 'write');
        sb.write(path, content);
        host.onFilesChanged();
        return done(`Wrote ${sb.rel(path)} (${content.split('\n').length} lines)`);
      }
      case 'edit_file': {
        const path = str(a.path, 'path');
        await guard(path, 'edit');
        sb.edit(path, str(a.old_text, 'old_text'), str(a.new_text, 'new_text'));
        host.onFilesChanged();
        return done(`Edited ${path}`);
      }
      case 'delete_file': {
        const path = str(a.path, 'path');
        await guard(path, 'delete');
        sb.remove(path);
        host.onFilesChanged();
        return done(`Deleted ${path}`);
      }
      case 'run_command': {
        const command = str(a.command, 'command');
        const r = await sb.exec(command, { approveNative: host.approveNative });
        host.onCommand(command, r.output, r.ok);
        host.onFilesChanged();
        return done(r.output || '(no output)', !r.ok);
      }
      case 'ask_learner': {
        const choices = Array.isArray(a.choices) ? a.choices.filter((c): c is string => typeof c === 'string').slice(0, 6) : [];
        const answer = await host.askLearner(str(a.question, 'question'), choices);
        return done(`The learner answered: ${answer}`);
      }
      case 'open_file': {
        const path = str(a.path, 'path');
        sb.read(path);
        host.openFile(sb.rel(path));
        return done(`Opened ${path} in the learner's editor`);
      }
      case 'invalid_tool_call':
        return done(`Your tool call was not valid JSON: ${String(a.raw)}. Write it again as <tool>{"name": "...", "input": {...}}</tool>.`, true);
      default:
        return done(`Unknown tool "${call.name}". Available: ${TOOLS.map((t) => t.name).join(', ')}`, true);
    }
  } catch (e) {
    return done((e as Error).message, true);
  }
}
