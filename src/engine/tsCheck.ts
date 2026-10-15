/**
 * Type-checks TypeScript lesson code with the TypeScript 6 compiler (downloaded into public/vendor/typescript by
 * scripts/fetch-runtimes.mjs; the project itself builds with the native TypeScript 7, which can't run in a worker).
 *
 * `typeCheck` is shipped as source text into a classic worker (like jsRuntime.ts) and is also called directly by
 * scripts/verify-js.mjs, so the app and the verifier report the same errors. Keep it self-contained: no imports,
 * no class fields.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

export type TsDiagnostic = {
  /** 1-based line in the learner's code as written (across all "// file:" sections), or in the checks. */
  line: number;
  col: number;
  /** "code" for the learner's program, "checks" for an exercise's hidden checks. */
  where: 'code' | 'checks';
  code: number;
  message: string;
};

/**
 * `ts` is the TypeScript module; `readLib(name)` returns a standard library file such as "lib.es2023.d.ts".
 * `code` may contain "// file: name.ts" sections (like JavaScript lessons); `tests` are appended to the entry file.
 */
export function typeCheck(ts: any, readLib: (name: string) => string | undefined, code: string, tests?: string): TsDiagnostic[] {
  const cache: Map<string, any> = (typeCheck as any).libCache ?? ((typeCheck as any).libCache = new Map());

  // Globals DevQuest provides to lesson code, and Node's built-in modules (typed loosely: no @types/node here)
  const GLOBALS = `
declare function assert(value: unknown, message?: string | Error): asserts value;
declare namespace assert {
  function ok(value: unknown, message?: string | Error): asserts value;
  function strictEqual<T>(actual: unknown, expected: T, message?: string | Error): asserts actual is T;
  function notStrictEqual(actual: unknown, expected: unknown, message?: string | Error): void;
  function deepStrictEqual<T>(actual: unknown, expected: T, message?: string | Error): asserts actual is T;
  function notDeepStrictEqual(actual: unknown, expected: unknown, message?: string | Error): void;
  function equal(actual: unknown, expected: unknown, message?: string | Error): void;
  function deepEqual(actual: unknown, expected: unknown, message?: string | Error): void;
  function throws(fn: () => unknown, expected?: unknown, message?: string | Error): void;
  function doesNotThrow(fn: () => unknown, message?: string | Error): void;
  function rejects(promiseOrFn: Promise<unknown> | (() => Promise<unknown>), expected?: unknown, message?: string | Error): Promise<void>;
  function match(value: string, re: RegExp, message?: string | Error): void;
  function doesNotMatch(value: string, re: RegExp, message?: string | Error): void;
  function fail(message?: string | Error): never;
}
declare function test(name: string, fn: () => unknown): void;
declare namespace test { function skip(name: string, fn: () => unknown): void; function todo(name: string, fn?: () => unknown): void; }
declare const it: typeof test;
declare function describe(name: string, fn: () => void): void;
declare function beforeEach(fn: () => unknown): void;
declare function afterEach(fn: () => unknown): void;
declare function __dqRequire(path: string): any;
declare function __dqTests(): { name: string; fn: () => unknown }[];
declare function __dqBuiltin(name: string): any;
declare const process: { argv: string[]; env: Record<string, string | undefined>; exitCode: number | undefined; cwd(): string; exit(code?: number): never; platform: string; stdout: { write(text: string): boolean } };
${['assert', 'assert/strict', 'test', 'events', 'path', 'fs', 'fs/promises', 'readline', 'readline/promises', 'util', 'timers/promises']
  .map((m) => `declare module "node:${m}";\ndeclare module "${m}";`)
  .join('\n')}
`;

  // Split "// file:" sections into virtual files, remembering where each starts in the code as written
  const lines = code.replace(/\r\n/g, '\n').split('\n');
  const sections: { name: string; start: number; text: string }[] = [];
  let current: { name: string; start: number; body: string[] } | null = null;
  lines.forEach((line, i) => {
    const m = line.match(/^\/\/ file: *([\w.\-/]+) *$/);
    if (m) {
      if (current) sections.push({ name: current.name, start: current.start, text: current.body.join('\n') });
      current = { name: m[1].replace(/^\.\//, ''), start: i + 1, body: [] };
    } else if (current) current.body.push(line);
  });
  if (current) sections.push({ name: (current as any).name, start: (current as any).start, text: (current as any).body.join('\n') });
  if (!sections.length) sections.push({ name: 'main.ts', start: 0, text: lines.join('\n') });
  const programFiles = sections.filter((s) => /\.(m?ts|tsx|m?js)$/.test(s.name));
  const entry = programFiles.find((s) => /^(main|index)\.(ts|js)$/.test(s.name)) ?? programFiles[programFiles.length - 1];

  const files = new Map<string, string>();
  const offsets = new Map<string, number>();
  for (const s of programFiles) {
    files.set('/' + s.name, s.text);
    offsets.set('/' + s.name, s.start);
  }
  const entryName = entry ? '/' + entry.name : '/main.ts';
  const codeLineCount = entry ? entry.text.split('\n').length : 0;
  if (tests) files.set(entryName, (files.get(entryName) ?? '') + '\n' + tests);
  files.set('/devquest-globals.d.ts', GLOBALS);

  const options = {
    strict: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    moduleDetection: ts.ModuleDetectionKind.Force,
    allowImportingTsExtensions: true,
    allowJs: true,
    checkJs: false,
    noEmit: true,
    skipLibCheck: true,
    types: [],
    lib: ['lib.es2023.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
  };
  const host = {
    getSourceFile(name: string, languageVersion: any) {
      if (files.has(name)) return ts.createSourceFile(name, files.get(name), languageVersion, true);
      const base = name.replace(/^\//, '');
      if (!cache.has(base)) {
        const text = readLib(base);
        if (text === undefined) return undefined;
        cache.set(base, ts.createSourceFile(name, text, languageVersion, false));
      }
      return cache.get(base);
    },
    getDefaultLibFileName: () => '/lib.d.ts',
    getDefaultLibLocation: () => '/',
    writeFile: () => undefined,
    getCurrentDirectory: () => '/',
    getDirectories: () => [],
    fileExists: (name: string) => files.has(name) || readLib(name.replace(/^\//, '')) !== undefined,
    readFile: (name: string) => files.get(name) ?? readLib(name.replace(/^\//, '')),
    getCanonicalFileName: (name: string) => name,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => '\n',
  };
  const program = ts.createProgram({ rootNames: [...files.keys()], options, host });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  const out: TsDiagnostic[] = [];
  for (const d of diagnostics) {
    if (d.category !== ts.DiagnosticCategory.Error) continue;
    const message = ts.flattenDiagnosticMessageText(d.messageText, '\n');
    if (!d.file || !files.has(d.file.fileName) || d.file.fileName === '/devquest-globals.d.ts') {
      out.push({ line: 0, col: 0, where: 'code', code: d.code, message });
      continue;
    }
    const pos = d.file.getLineAndCharacterOfPosition(d.start ?? 0);
    const inChecks = d.file.fileName === entryName && tests !== undefined && pos.line >= codeLineCount;
    out.push({
      line: inChecks ? pos.line - codeLineCount + 1 : pos.line + 1 + (offsets.get(d.file.fileName) ?? 0),
      col: pos.character + 1,
      where: inChecks ? 'checks' : 'code',
      code: d.code,
      message,
    });
  }
  return out.sort((a, b) => (a.where === b.where ? a.line - b.line || a.col - b.col : a.where === 'code' ? -1 : 1));
}

/** Plain-language summary of type errors, for results and failed checks. */
export function describeTypeErrors(diagnostics: TsDiagnostic[], tests?: string): string {
  const testLines = (tests ?? '').split('\n');
  const shown = diagnostics.slice(0, 6).map((d) => {
    if (d.where === 'checks') {
      const line = testLines[d.line - 1]?.trim() ?? '';
      // "Unused '@ts-expect-error' directive": the checks wanted this line to be a type error
      if (d.code === 2578) return `The checks expect a type error on this line, but your types allow it:\n  ${testLines[d.line]?.trim() ?? line}`;
      return `Type error in the checks (${line}):\n  ${d.message}`;
    }
    return `Type error${d.line ? ` on line ${d.line}` : ''}: ${d.message} (TS${d.code})`;
  });
  if (diagnostics.length > 6) shown.push(`...and ${diagnostics.length - 6} more`);
  return shown.join('\n');
}

/** The checker as worker source: loads the compiler and the libraries, then answers { code, tests } messages. */
export const tsCheckWorker = (compilerUrl: string, vendorBase: string) => `
importScripts(${JSON.stringify(compilerUrl)});
const typeCheck = ${typeCheck.toString()};
let libs = null;
async function loadLibs() {
  if (libs) return libs;
  const names = await (await fetch(${JSON.stringify(vendorBase)} + "libs.json")).json();
  const texts = await Promise.all(names.map((n) => fetch(${JSON.stringify(vendorBase)} + n).then((r) => r.text())));
  libs = new Map(names.map((n, i) => [n, texts[i]]));
  return libs;
}
onmessage = async (e) => {
  try {
    const l = await loadLibs();
    postMessage({ id: e.data.id, diagnostics: typeCheck(ts, (n) => l.get(n), e.data.code, e.data.tests) });
  } catch (err) {
    postMessage({ id: e.data.id, failed: String(err && err.message || err) });
  }
};
`;
