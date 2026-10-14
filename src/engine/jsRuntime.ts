/**
 * The JavaScript runtime that learner code runs in: Node-style console formatting, prompt() fed from the
 * exercise's typed input, a node:assert-style `assert`, and a runner that reports errors with line numbers
 * and explains failed checks. It's written as an ordinary function and shipped as source text (`JS_RUNTIME`),
 * so the in-app worker and scripts/verify-js.mjs (Node's vm) run exactly the same code.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
function devquestJsRuntime(g: any) {
  // ---------------- output ----------------
  let out = '';
  let indent = '';
  let feed: string[] | null = null;
  const write = (text: string) => {
    out += indent ? text.split('\n').map((l) => indent + l).join('\n') + '\n' : text + '\n';
  };

  // ---------------- inspect: formats values like Node's util.inspect (console.log defaults: depth 2, compact 3, breakLength 80) ----------------
  const BREAK = 80;
  const COMPACT = 3;
  const DEPTH = 2;
  const IDENT = /^[A-Za-z_$][\w$]*$/;

  function quote(s: string) {
    const q = !s.includes("'") ? "'" : !s.includes('"') ? '"' : !s.includes('`') && !s.includes('${') ? '`' : "'";
    let r = '';
    for (const ch of s) {
      const c = ch.charCodeAt(0);
      if (ch === q || ch === '\\') r += '\\' + ch;
      else if (ch === '\n') r += '\\n';
      else if (ch === '\t') r += '\\t';
      else if (ch === '\r') r += '\\r';
      else if (ch === '\b') r += '\\b';
      else if (ch === '\f') r += '\\f';
      else if (ch === '\v') r += '\\v';
      else if (c < 32 || c === 127) r += '\\x' + c.toString(16).padStart(2, '0').toUpperCase();
      else r += ch;
    }
    return q + r + q;
  }

  const key = (k: string | symbol) => (typeof k === 'symbol' ? `[${k.toString()}]` : IDENT.test(k) ? k : quote(k));

  function fnName(f: any) {
    const src = Function.prototype.toString.call(f);
    if (/^class\b/.test(src)) {
      const parent = Object.getPrototypeOf(f);
      return `[class ${f.name || '(anonymous)'}${parent && parent !== Function.prototype && parent.name ? ` extends ${parent.name}` : ''}]`;
    }
    const kind = f.constructor && f.constructor.name && f.constructor.name !== 'Function' ? f.constructor.name : 'Function';
    return f.name ? `[${kind}: ${f.name}]` : `[${kind} (anonymous)]`;
  }

  function groupArrayElements(ctx: any, output: string[], value: any[] | undefined) {
    let totalLength = 0;
    let maxLength = 0;
    let outputLength = output.length;
    if (ctx.extra) outputLength--;
    const sep = 2;
    const dataLen: number[] = [];
    for (let i = 0; i < outputLength; i++) {
      const len = output[i].length;
      dataLen[i] = len;
      totalLength += len + sep;
      if (maxLength < len) maxLength = len;
    }
    const actualMax = maxLength + sep;
    if (actualMax * 3 + ctx.indentationLvl < BREAK && (totalLength / actualMax > 5 || maxLength <= 6)) {
      const averageBias = Math.sqrt(actualMax - totalLength / output.length);
      const biasedMax = Math.max(actualMax - 3 - averageBias, 1);
      const columns = Math.min(Math.round(Math.sqrt(2.5 * biasedMax * outputLength) / biasedMax), Math.floor((BREAK - ctx.indentationLvl) / actualMax), COMPACT * 4, 15);
      if (columns <= 1) return output;
      const tmp: string[] = [];
      const maxLineLength: number[] = [];
      for (let i = 0; i < columns; i++) {
        let lineLength = 0;
        for (let j = i; j < output.length; j += columns) if (dataLen[j] > lineLength) lineLength = dataLen[j];
        maxLineLength.push(lineLength + sep);
      }
      let padStart = true;
      if (value !== undefined) {
        for (let i = 0; i < output.length; i++) {
          if (typeof value[i] !== 'number' && typeof value[i] !== 'bigint') {
            padStart = false;
            break;
          }
        }
      }
      for (let i = 0; i < outputLength; i += columns) {
        const max = Math.min(i + columns, outputLength);
        let str = '';
        let j = i;
        for (; j < max - 1; j++) {
          const cell = `${output[j]}, `;
          str += padStart ? cell.padStart(maxLineLength[j - i], ' ') : cell.padEnd(maxLineLength[j - i], ' ');
        }
        str += padStart ? output[j].padStart(maxLineLength[j - i] - sep, ' ') : output[j];
        tmp.push(str);
      }
      if (ctx.extra) tmp.push(output[outputLength]);
      return tmp;
    }
    return output;
  }

  function isBelowBreakLength(output: string[], start: number, base: string) {
    let total = output.length + start;
    if (total + output.length > BREAK) return false;
    for (const o of output) {
      total += o.length;
      if (total > BREAK) return false;
    }
    return base === '' || !base.includes('\n');
  }

  function reduceToSingleString(ctx: any, output: string[], base: string, braces: [string, string], isArray: boolean, recurseTimes: number, value: any) {
    const entries = output.length;
    if (isArray && entries > 6) output = groupArrayElements(ctx, output, value);
    if (ctx.currentDepth - recurseTimes < COMPACT && entries === output.length) {
      const start = output.length + ctx.indentationLvl + braces[0].length + base.length + 10;
      if (isBelowBreakLength(output, start, base)) {
        const joined = output.join(', ');
        if (!joined.includes('\n')) return `${base ? `${base} ` : ''}${braces[0]} ${joined} ${braces[1]}`;
      }
    }
    const ind = `\n${' '.repeat(ctx.indentationLvl)}`;
    return `${base ? `${base} ` : ''}${braces[0]}${ind}  ${output.join(`,${ind}  `)}${ind}${braces[1]}`;
  }

  function formatPrimitive(v: any): string {
    if (typeof v === 'string') return quote(v);
    if (typeof v === 'number') return Object.is(v, -0) ? '-0' : String(v);
    if (typeof v === 'bigint') return `${v}n`;
    if (typeof v === 'symbol') return v.toString();
    return String(v);
  }

  function formatValue(ctx: any, v: any, recurseTimes: number): string {
    if (v === null || (typeof v !== 'object' && typeof v !== 'function')) return formatPrimitive(v);
    if (ctx.seen.includes(v)) {
      if (!ctx.circular.has(v)) ctx.circular.set(v, ctx.circular.size + 1);
      return `[Circular *${ctx.circular.get(v)}]`;
    }
    return formatRaw(ctx, v, recurseTimes);
  }

  function constructorName(v: any) {
    let proto = Object.getPrototypeOf(v);
    if (proto === null) return null;
    while (proto) {
      const d = Object.getOwnPropertyDescriptor(proto, 'constructor');
      if (d && typeof d.value === 'function' && d.value.name) return d.value.name;
      proto = Object.getPrototypeOf(proto);
    }
    return 'Object';
  }

  function formatProperty(ctx: any, v: any, recurseTimes: number, k: string | symbol, isArray: boolean) {
    const d = Object.getOwnPropertyDescriptor(v, k)!;
    let str: string;
    if (d.value !== undefined || !('get' in d || 'set' in d)) {
      ctx.indentationLvl += 2;
      str = formatValue(ctx, d.value, recurseTimes);
      ctx.indentationLvl -= 2;
    } else str = d.get ? (d.set ? '[Getter/Setter]' : '[Getter]') : d.set ? '[Setter]' : 'undefined';
    return isArray && typeof k === 'string' && /^\d+$/.test(k) ? str : `${key(k)}: ${str}`;
  }

  function formatRaw(ctx: any, v: any, recurseTimes: number): string {
    if (typeof v === 'function') {
      const base = fnName(v);
      const extraKeys = Object.keys(v);
      if (!extraKeys.length) return base;
      v = Object.assign(Object.create(null), v);
      return `${base} { ${extraKeys.map((k) => `${key(k)}: ${formatValue(ctx, v[k], recurseTimes + 1)}`).join(', ')} }`;
    }
    const ctor = constructorName(v);
    const prefix = (fallback: string, size?: number) => {
      const name = ctor === null ? `[${fallback}: null prototype]` : ctor;
      return `${name}${size !== undefined ? `(${size})` : ''} `;
    };
    let braces: [string, string];
    let isArray = false;
    let output: string[] = [];
    let keys: (string | symbol)[] = [...Object.keys(v), ...Object.getOwnPropertySymbols(v).filter((s) => Object.getOwnPropertyDescriptor(v, s)!.enumerable)];
    let base = '';
    ctx.extra = false;

    if (Array.isArray(v)) {
      isArray = true;
      const p = ctor === 'Array' ? '' : prefix('Array', v.length);
      braces = [`${p}[`, ']'];
      if (v.length === 0 && keys.length === 0) return `${braces[0]}]`;
      if (recurseTimes > DEPTH) return `[${ctor === null ? 'Array' : ctor}]`;
      keys = keys.filter((k) => !(typeof k === 'string' && /^\d+$/.test(k)));
    } else if (v instanceof Map) {
      braces = [`${prefix('Map', v.size)}{`, '}'];
      if (v.size === 0 && keys.length === 0) return `${braces[0]}}`;
      if (recurseTimes > DEPTH) return `[${ctor}]`;
    } else if (v instanceof Set) {
      braces = [`${prefix('Set', v.size)}{`, '}'];
      if (v.size === 0 && keys.length === 0) return `${braces[0]}}`;
      if (recurseTimes > DEPTH) return `[${ctor}]`;
    } else if (v instanceof Date) {
      return isNaN(v.getTime()) ? 'Invalid Date' : v.toISOString();
    } else if (v instanceof RegExp) {
      return String(v);
    } else if (v instanceof Error) {
      const head = v.message ? `${v.name}: ${v.message}` : v.name;
      return keys.length ? `${head} { ${keys.map((k) => formatProperty(ctx, v, recurseTimes + 1, k, false)).join(', ')} }` : head;
    } else if (typeof Promise !== 'undefined' && v instanceof Promise) {
      return 'Promise { <pending> }';
    } else if (v instanceof Number || v instanceof String || v instanceof Boolean) {
      return `[${v.constructor.name}: ${formatPrimitive(v.valueOf())}]`;
    } else {
      const p = ctor === 'Object' ? '' : ctor === null ? '[Object: null prototype] ' : `${ctor} `;
      braces = [`${p}{`, '}'];
      if (keys.length === 0) return `${p}{}`;
      if (recurseTimes > DEPTH) return `[${ctor === null ? 'Object: null prototype' : ctor}]`;
    }

    ctx.seen.push(v);
    ctx.currentDepth = recurseTimes;
    if (isArray) {
      const maxLen = Math.min(100, v.length);
      let holes = 0;
      for (let i = 0; i < maxLen; i++) {
        if (!Object.prototype.hasOwnProperty.call(v, i)) {
          holes++;
          continue;
        }
        if (holes) {
          output.push(`<${holes} empty item${holes > 1 ? 's' : ''}>`);
          holes = 0;
        }
        output.push(formatProperty(ctx, v, recurseTimes + 1, String(i), true));
      }
      if (holes) output.push(`<${holes} empty item${holes > 1 ? 's' : ''}>`);
      if (v.length > maxLen) {
        output.push(`... ${v.length - maxLen} more item${v.length - maxLen > 1 ? 's' : ''}`);
        ctx.extra = true;
      }
    } else if (v instanceof Map) {
      ctx.indentationLvl += 2;
      for (const [k, val] of v) output.push(`${formatValue(ctx, k, recurseTimes + 1)} => ${formatValue(ctx, val, recurseTimes + 1)}`);
      ctx.indentationLvl -= 2;
    } else if (v instanceof Set) {
      ctx.indentationLvl += 2;
      for (const item of v) output.push(formatValue(ctx, item, recurseTimes + 1));
      ctx.indentationLvl -= 2;
    }
    for (const k of keys) output.push(formatProperty(ctx, v, recurseTimes + 1, k, false));
    ctx.seen.pop();
    if (ctx.circular.has(v)) base = `<ref *${ctx.circular.get(v)}>`;
    const extra = ctx.extra;
    const res = reduceToSingleString(ctx, output, base, braces!, isArray, recurseTimes, isArray ? v : undefined);
    ctx.extra = extra;
    return res;
  }

  function inspect(v: any) {
    return formatValue({ seen: [], circular: new Map(), indentationLvl: 0, currentDepth: 0, extra: false }, v, 0);
  }

  function format(args: any[]) {
    if (!args.length) return '';
    const first = args[0];
    const rest = args.slice(1);
    let head: string | null = null; // the first argument with its %s, %d, … filled in
    if (typeof first === 'string' && first.includes('%') && rest.length) {
      head = first.replace(/%([sdifjoOc%])/g, (m, f) => {
        if (f === '%') return '%';
        if (!rest.length) return m;
        const a = rest.shift();
        if (f === 's') return typeof a === 'string' ? a : typeof a === 'bigint' ? `${a}n` : typeof a === 'object' && a !== null ? inspect(a) : String(a);
        if (f === 'd' || f === 'i') return typeof a === 'bigint' ? `${a}n` : String(f === 'i' ? Math.trunc(Number(a)) : Number(a));
        if (f === 'f') return String(parseFloat(a));
        if (f === 'j') return JSON.stringify(a);
        if (f === 'c') return '';
        return inspect(a);
      });
    }
    const parts = head === null ? [] : [head];
    for (const a of head === null ? args : rest) parts.push(typeof a === 'string' ? a : inspect(a));
    return parts.join(' ');
  }

  // ---------------- console ----------------
  const counts: Record<string, number> = {};
  const timers: Record<string, number> = {};
  const log = (...args: any[]) => write(format(args));
  g.console = {
    log,
    info: log,
    debug: log,
    warn: log,
    error: log,
    trace: log,
    dir: (v: any) => write(inspect(v)),
    assert: (cond: any, ...msg: any[]) => {
      if (!cond) write(msg.length ? `Assertion failed: ${format(msg)}` : 'Assertion failed');
    },
    count: (label = 'default') => {
      counts[label] = (counts[label] ?? 0) + 1;
      write(`${label}: ${counts[label]}`);
    },
    countReset: (label = 'default') => {
      counts[label] = 0;
    },
    group: (...label: any[]) => {
      if (label.length) write(format(label));
      indent += '  ';
    },
    groupEnd: () => {
      indent = indent.slice(2);
    },
    time: (label = 'default') => {
      timers[label] = Date.now();
    },
    timeEnd: (label = 'default') => {
      write(`${label}: ${(Date.now() - (timers[label] ?? Date.now())).toFixed(3)}ms`);
    },
    table: (data: any) => {
      if (data === null || typeof data !== 'object') return log(data);
      const rows = Object.keys(data);
      const cols: string[] = [];
      for (const r of rows) {
        const row = data[r];
        if (row !== null && typeof row === 'object') for (const c of Object.keys(row)) if (!cols.includes(c)) cols.push(c);
      }
      const hasValues = rows.some((r) => data[r] === null || typeof data[r] !== 'object');
      const header = ['(index)', ...cols, ...(hasValues ? ['Values'] : [])];
      const body = rows.map((r) => {
        const row = data[r];
        const isObj = row !== null && typeof row === 'object';
        return [r, ...cols.map((c) => (isObj && c in row ? inspect(row[c]) : '')), ...(hasValues ? [isObj ? '' : inspect(row)] : [])];
      });
      const widths = header.map((h, i) => Math.max(h.length, ...body.map((b) => b[i].length)) + 2);
      const line = (l: string, m: string, r: string) => l + widths.map((w) => '─'.repeat(w)).join(m) + r;
      const cells = (vals: string[]) => '│' + vals.map((v, i) => ` ${v.padEnd(widths[i] - 1)}`).join('│') + '│';
      write([line('┌', '┬', '┐'), cells(header), line('├', '┼', '┤'), ...body.map(cells), line('└', '┴', '┘')].join('\n'));
    },
  };

  // ---------------- prompt(): typed input, echoed like a terminal ----------------
  g.prompt = (message?: any) => {
    const text = message === undefined ? '' : String(message);
    if (!feed || !feed.length) {
      if (text) write(text);
      return null;
    }
    const line = feed.shift()!;
    write(text ? `${text}${/\s$/.test(text) ? '' : ' '}${line}` : line);
    return line;
  };

  // ---------------- assert (node:assert/strict style) ----------------
  // (no class field declarations: the compiler could add helpers outside this function)
  class AssertionError extends Error {
    constructor(o: { message?: string; actual?: any; expected?: any; operator: string; generated: string }) {
      super(o.message ?? o.generated);
      const self = this as any;
      self.name = 'AssertionError';
      self.actual = o.actual;
      self.expected = o.expected;
      self.operator = o.operator;
      self.generatedMessage = o.message === undefined;
    }
  }

  function deepEqual(a: any, b: any, memo: any[] = []): boolean {
    if (Object.is(a, b)) return true;
    if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
    if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;
    for (const [x, y] of memo) if (x === a && y === b) return true;
    memo = [...memo, [a, b]];
    if (a instanceof Date) return a.getTime() === b.getTime();
    if (a instanceof RegExp) return String(a) === String(b);
    if (a instanceof Error && (a.message !== b.message || a.name !== b.name)) return false;
    if (Array.isArray(a) && a.length !== b.length) return false;
    if (a instanceof Map) {
      if (a.size !== b.size) return false;
      for (const [k, v] of a) if (!b.has(k) || !deepEqual(v, b.get(k), memo)) return false;
    }
    if (a instanceof Set) {
      if (a.size !== b.size) return false;
      for (const v of a) if (!b.has(v) && !(typeof v === 'object' && [...b].some((w) => deepEqual(v, w, memo)))) return false;
    }
    const ka = [...Object.keys(a), ...Object.getOwnPropertySymbols(a)];
    const kb = [...Object.keys(b), ...Object.getOwnPropertySymbols(b)];
    if (ka.length !== kb.length) return false;
    for (const k of ka) if (!Object.prototype.hasOwnProperty.call(b, k) || !deepEqual(a[k], b[k], memo)) return false;
    return true;
  }

  const fail = (o: { message?: any; actual?: any; expected?: any; operator: string; generated: string }) => {
    if (o.message instanceof Error) throw o.message;
    throw new AssertionError(o);
  };
  const assert: any = (value: any, message?: any) => assert.ok(value, message);
  assert.ok = (value: any, message?: any) => {
    if (!value) fail({ message, actual: value, expected: true, operator: '==', generated: 'The expression evaluated to a falsy value' });
  };
  assert.strictEqual = (actual: any, expected: any, message?: any) => {
    if (!Object.is(actual, expected)) fail({ message, actual, expected, operator: 'strictEqual', generated: 'Expected values to be strictly equal' });
  };
  assert.notStrictEqual = (actual: any, expected: any, message?: any) => {
    if (Object.is(actual, expected)) fail({ message, actual, expected, operator: 'notStrictEqual', generated: `Expected "actual" to be strictly unequal to: ${inspect(expected)}` });
  };
  assert.deepStrictEqual = (actual: any, expected: any, message?: any) => {
    if (!deepEqual(actual, expected)) fail({ message, actual, expected, operator: 'deepStrictEqual', generated: 'Expected values to be strictly deep-equal' });
  };
  assert.notDeepStrictEqual = (actual: any, expected: any, message?: any) => {
    if (deepEqual(actual, expected)) fail({ message, actual, expected, operator: 'notDeepStrictEqual', generated: 'Expected "actual" not to be strictly deep-equal to "expected"' });
  };
  assert.equal = assert.strictEqual;
  assert.notEqual = assert.notStrictEqual;
  assert.deepEqual = assert.deepStrictEqual;
  assert.notDeepEqual = assert.notDeepStrictEqual;
  assert.fail = (message = 'Failed') => fail({ message, operator: 'fail', generated: 'Failed' });
  assert.match = (s: string, re: RegExp, message?: any) => {
    if (!re.test(s)) fail({ message, actual: s, expected: re, operator: 'match', generated: `The input did not match the regular expression ${re}. Input: ${inspect(s)}` });
  };
  assert.doesNotMatch = (s: string, re: RegExp, message?: any) => {
    if (re.test(s)) fail({ message, actual: s, expected: re, operator: 'doesNotMatch', generated: `The input was expected to not match the regular expression ${re}. Input: ${inspect(s)}` });
  };
  const checkError = (err: any, expected: any, message: any, operator: string) => {
    if (expected === undefined) return;
    if (typeof expected === 'function' && expected.prototype !== undefined && err instanceof expected) return;
    if (typeof expected === 'function' && (expected.prototype === undefined || !(expected.prototype instanceof Error) && expected !== Error)) {
      if (expected(err) === true) return;
      fail({ message, actual: err, expected, operator, generated: 'The validation function is expected to return "true"' });
    }
    if (expected instanceof RegExp) {
      if (expected.test(String(err && err.message !== undefined ? `${err.name}: ${err.message}` : err))) return;
      fail({ message, actual: err, expected, operator, generated: `The error message didn't match ${expected}: ${inspect(err)}` });
    }
    if (typeof expected === 'function') fail({ message, actual: err, expected, operator, generated: `The error is expected to be an instance of "${expected.name}". Received "${err && err.constructor ? err.constructor.name : typeof err}"${err && err.message ? `: ${err.message}` : ''}` });
    if (typeof expected === 'object' && expected !== null) {
      for (const k of Object.keys(expected)) {
        const want = expected[k];
        const got = err ? err[k] : undefined;
        if (want instanceof RegExp && typeof got === 'string' ? !want.test(got) : !deepEqual(got, want))
          fail({ message, actual: err, expected, operator, generated: `Expected the error's ${k} to be ${inspect(want)}, but it was ${inspect(got)}` });
      }
    }
  };
  assert.throws = (fn: () => any, expected?: any, message?: any) => {
    if (typeof expected === 'string') [message, expected] = [expected, undefined];
    try {
      fn();
    } catch (err) {
      checkError(err, expected, message, 'throws');
      return;
    }
    fail({ message, operator: 'throws', generated: `Missing expected exception${expected && expected.name ? ` (${expected.name})` : ''}.` });
  };
  assert.doesNotThrow = (fn: () => any, message?: any) => {
    try {
      fn();
    } catch (err: any) {
      fail({ message, actual: err, operator: 'doesNotThrow', generated: `Got unwanted exception: ${err && err.message}` });
    }
  };
  assert.rejects = async (promiseOrFn: any, expected?: any, message?: any) => {
    if (typeof expected === 'string') [message, expected] = [expected, undefined];
    try {
      await (typeof promiseOrFn === 'function' ? promiseOrFn() : promiseOrFn);
    } catch (err) {
      checkError(err, expected, message, 'rejects');
      return;
    }
    fail({ message, operator: 'rejects', generated: `Missing expected rejection${expected && expected.name ? ` (${expected.name})` : ''}.` });
  };
  assert.AssertionError = AssertionError;
  assert.strict = assert;
  g.assert = assert;

  // ---------------- test() and describe(), like node:test (run after the program's own code) ----------------
  type TestNode = { kind: 'test' | 'suite' | 'skip'; name: string; fn: () => any; children: TestNode[]; before: (() => any)[]; after: (() => any)[] };
  const newSuite = (name: string): TestNode => ({ kind: 'suite', name, fn: () => undefined, children: [], before: [], after: [] });
  let rootSuite = newSuite('');
  let currentSuite = rootSuite;
  const register = (kind: TestNode['kind']) => (name: any, fn: () => any) => {
    currentSuite.children.push({ kind, name: String(name), fn, children: [], before: [], after: [] });
  };
  const testFn: any = register('test');
  testFn.skip = register('skip');
  testFn.todo = register('skip');
  g.test = g.it = testFn;
  const describeFn: any = (name: any, fn: () => any) => {
    const suite = newSuite(String(name));
    currentSuite.children.push(suite);
    const outer = currentSuite;
    currentSuite = suite;
    try {
      fn();
    } finally {
      currentSuite = outer;
    }
  };
  describeFn.skip = register('skip');
  g.describe = describeFn;
  g.beforeEach = (fn: () => any) => currentSuite.before.push(fn);
  g.afterEach = (fn: () => any) => currentSuite.after.push(fn);

  /** What a failed test shows: for a generated assertion message, the expected and actual values. */
  function explainFailure(err: any) {
    if (err instanceof AssertionError && (err as any).generatedMessage && /Equal$/.test((err as any).operator))
      return `${err.message}\nexpected: ${inspect((err as any).expected)}\ngot:      ${inspect((err as any).actual)}`;
    return describe(err);
  }

  async function runSuite(suite: TestNode, depth: number, hooks: TestNode[], counts: Record<string, number>): Promise<boolean> {
    let ok = true;
    const pad = '  '.repeat(depth);
    for (const node of suite.children) {
      if (node.kind === 'skip') {
        counts.skipped++;
        write(`${pad}﹣ ${node.name} # SKIP`);
      } else if (node.kind === 'suite') {
        counts.suites++;
        write(`${pad}▶ ${node.name}`);
        const passed = await runSuite(node, depth + 1, [...hooks, node], counts);
        write(`${pad}${passed ? '✔' : '✖'} ${node.name}`);
        ok = ok && passed;
      } else {
        counts.tests++;
        try {
          for (const s of hooks) for (const h of s.before) await h();
          await node.fn();
          for (const s of [...hooks].reverse()) for (const h of s.after) await h();
          counts.pass++;
          write(`${pad}✔ ${node.name}`);
        } catch (err) {
          counts.fail++;
          ok = false;
          write(`${pad}✖ ${node.name}\n${explainFailure(err).split('\n').map((l) => `${pad}  ${l}`).join('\n')}`);
        }
      }
    }
    return ok;
  }

  /** Runs the tests the program registered, then prints a summary like node:test's. */
  async function runRegisteredTests() {
    if (!rootSuite.children.length) return;
    const counts: Record<string, number> = { tests: 0, suites: 0, pass: 0, fail: 0, skipped: 0 };
    await runSuite(rootSuite, 0, [rootSuite], counts);
    write(`ℹ tests ${counts.tests}\nℹ suites ${counts.suites}\nℹ pass ${counts.pass}\nℹ fail ${counts.fail}${counts.skipped ? `\nℹ skipped ${counts.skipped}` : ''}`);
  }

  /** For hidden checks: every registered test as { name, fn }, with suite names joined by " > ". */
  g.__dqTests = () => {
    const found: { name: string; fn: () => any }[] = [];
    const walk = (suite: TestNode, prefix: string) => {
      for (const node of suite.children) {
        if (node.kind === 'test') found.push({ name: prefix + node.name, fn: node.fn });
        if (node.kind === 'suite') walk(node, `${prefix}${node.name} > `);
      }
    };
    walk(rootSuite, '');
    return found;
  };

  // ---------------- timers: like Node, a program ends when no timers are left ----------------
  const host = { set: g.setTimeout.bind(g), clear: g.clearTimeout.bind(g), every: g.setInterval.bind(g), stop: g.clearInterval.bind(g) };
  const pending = new Map<any, boolean>(); // timer id → is it an interval?
  let late: { err: any } | null = null; // an error thrown inside a timer callback
  let wake: (() => void) | null = null;
  const settle = () => {
    if (wake && (!pending.size || late)) {
      const w = wake;
      wake = null;
      w();
    }
  };
  const guarded = (fn: any, args: any[]) => {
    try {
      if (typeof fn === 'function') fn(...args);
    } catch (err) {
      if (!late) late = { err };
    }
  };
  g.setTimeout = (fn: any, ms?: number, ...args: any[]) => {
    const id = host.set(() => {
      pending.delete(id);
      guarded(fn, args);
      settle();
    }, ms);
    pending.set(id, false);
    return id;
  };
  g.setInterval = (fn: any, ms?: number, ...args: any[]) => {
    const id = host.every(() => {
      guarded(fn, args);
      settle();
    }, ms);
    pending.set(id, true);
    return id;
  };
  g.clearTimeout = g.clearInterval = (id: any) => {
    if (pending.has(id)) (pending.get(id) ? host.stop : host.clear)(id);
    pending.delete(id);
    settle();
  };
  const clearAll = () => {
    for (const [id, every] of pending) (every ? host.stop : host.clear)(id);
    pending.clear();
  };
  if (typeof g.addEventListener === 'function')
    g.addEventListener('unhandledrejection', (e: any) => {
      e.preventDefault();
      if (!late) late = { err: e.reason };
      settle();
    });
  /** After the code finishes, wait (up to `limitMs`) until its timers have all run, as Node does before exiting. */
  async function idle(limitMs: number): Promise<boolean> {
    const deadline = Date.now() + limitMs;
    for (;;) {
      await new Promise((r) => host.set(r, 0));
      if (late || !pending.size) return true;
      const left = deadline - Date.now();
      if (left <= 0) return false;
      await new Promise<void>((r) => {
        wake = r;
        host.set(() => {
          if (wake === r) {
            wake = null;
            r();
          }
        }, left);
      });
    }
  }

  // ---------------- running learner code ----------------
  /** The line (in the given source) where an error was raised, from its stack. */
  function errorLine(err: any): number | null {
    const stack = String((err && err.stack) || '');
    for (const l of stack.split('\n')) {
      const m = l.match(/<anonymous>:(\d+):\d+\)?\s*$/) || l.match(/> (?:Async)?Function:(\d+):\d+\s*$/);
      if (m) return Number(m[1]) - 2; // new AsyncFunction(body) puts the body on line 3
    }
    return null;
  }

  /** The stack frames that point into the run's source (name and line), innermost first: V8 and Firefox formats. */
  function frames(err: any): { name: string; line: number }[] {
    const found: { name: string; line: number }[] = [];
    for (const l of String((err && err.stack) || '').split('\n')) {
      const m = l.match(/^\s*at (?:async )?(?:(.+?) \()?.*<anonymous>:(\d+):\d+\)?\s*$/) || l.match(/^(.*?)@.*> (?:Async)?Function:(\d+):\d+\s*$/);
      if (!m) continue;
      const name = (m[1] || '').replace(/^async\*/, '');
      found.push({ name: /^(eval|anonymous|)$/.test(name) ? '' : name, line: Number(m[2]) - 2 });
    }
    return found;
  }

  function describe(err: any) {
    if (err === null || typeof err !== 'object') return `Uncaught ${inspect(err)}`;
    return err.name ? `${err.name}: ${err.message}` : String(err);
  }

  const codeLines = (src: string) => src.split('\n').length;

  async function run(o: { code: string; tests?: string; stdin?: string | null; strict?: boolean }) {
    out = '';
    indent = '';
    for (const k of Object.keys(counts)) delete counts[k];
    feed = o.stdin == null ? null : String(o.stdin).replace(/\r\n/g, '\n').split('\n');
    if (feed && feed.length && feed[feed.length - 1] === '') feed.pop();
    const AsyncFunction = (async () => {}).constructor as any;
    const C = codeLines(o.code);
    let phase = 'code';
    let testStart = 0;
    g.__dqMark = () => {
      phase = 'tests';
      testStart = out.length;
    };
    const body = (o.strict ? '"use strict"; ' : '') + o.code + (o.tests ? '\n__dqMark();\n' + o.tests : '');
    let fn: any;
    try {
      fn = new AsyncFunction(body);
    } catch (err) {
      let error = describe(err);
      // An unclosed { runs into the wrapper function's closing "})": report it as Node would
      if (/^SyntaxError: Unexpected token '[)}]'$/.test(error))
        for (const close of ['}', '}}', '}}}'])
          try {
            new AsyncFunction(body + '\n' + close);
            error = 'SyntaxError: Unexpected end of input';
            break;
          } catch {
            // still broken: try one more brace
          }
      return { ok: false, output: '', error, syntax: true };
    }
    clearAll();
    late = null;
    wake = null;
    rootSuite = newSuite('');
    currentSuite = rootSuite;
    try {
      await fn();
      const end = out.length;
      // Like node:test, tests registered with test() run after the program's own code
      await runRegisteredTests();
      const finished = await idle(3000);
      const failure = late as { err: any } | null; // set by timer callbacks while idle() waited
      if (failure) throw failure.err;
      // Timer output comes after the checks ran: keep it, but not anything the checks printed
      const output = o.tests ? out.slice(0, testStart) + out.slice(end) : out;
      if (!finished) {
        clearAll();
        return { ok: false, output, error: 'The program was still waiting for timers after 3 seconds. A setInterval that is never cleared with clearInterval keeps a program running forever.' };
      }
      return { ok: true, output };
    } catch (err: any) {
      clearAll();
      const line = errorLine(err);
      const stack = frames(err);
      const inCode = stack.filter((f) => f.line >= 1 && f.line <= C);
      if (phase === 'tests') {
        const testSrc = o.tests!.split('\n');
        const testFrame = stack.find((f) => f.line > C + 1);
        const testLine = testFrame ? testSrc[testFrame.line - C - 2] : undefined;
        let msg: string;
        if (err instanceof AssertionError && (err as any).generatedMessage) {
          msg = testLine !== undefined ? `This check failed: ${testLine.trim()}` : err.message;
          const e = err as any;
          if (/Equal$/.test(e.operator)) msg += `\n  expected: ${inspect(e.expected)}\n  got:      ${inspect(e.actual)}`;
          else if (e.operator !== '==') msg += `\n  ${e.message}`;
        } else if (err instanceof AssertionError) msg = err.message;
        else msg = `${describe(err)}${inCode.length ? ` (line ${inCode[0].line} of your code)` : ''}${testLine !== undefined ? `\n  while checking: ${testLine.trim()}` : ''}`;
        return { ok: true, output: out.slice(0, testStart), testError: msg };
      }
      // Like Node, show the chain of calls when the error passed through the learner's functions
      // Engines keep only the innermost frames (10 in V8), so a long run of one call is "many", not an exact count
      const again = (n: number) => `    ... the same call ${n < 5 ? `${n} more time${n === 1 ? '' : 's'}` : 'repeated many more times'}`;
      const shown: string[] = [];
      let repeats = 0;
      for (const f of inCode) {
        const text = f.name ? `    at ${f.name} (line ${f.line})` : `    at line ${f.line}`;
        if (text === shown[shown.length - 1] && !f.name) continue; // e.g. a callback on the same line as its caller
        if (text === shown[shown.length - 1]) repeats++;
        else {
          if (repeats) shown.push(again(repeats));
          repeats = 0;
          shown.push(text);
        }
      }
      if (repeats) shown.push(again(repeats));
      const trace = shown.length >= 2 ? '\n' + shown.join('\n') : '';
      return { ok: false, output: out, error: describe(err) + (line !== null && line >= 1 && line <= C ? ` (line ${line})` : '') + trace };
    }
  }

  g.__dqRun = run;
  g.__dqInspect = inspect;
}

/** The runtime's source, to evaluate in a worker or a Node vm context: defines __dqRun, console, prompt and assert. */
export const JS_RUNTIME = `(${devquestJsRuntime.toString()})(globalThis);`;

/** The runtime installed on another object (`target` is a JS expression), e.g. to borrow its Node-style formatting. */
export const jsRuntimeOn = (target: string) => `(${devquestJsRuntime.toString()})(${target});`;
