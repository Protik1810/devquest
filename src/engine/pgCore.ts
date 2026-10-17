/**
 * Running SQL on PGlite (real PostgreSQL compiled to WebAssembly), shared by the browser worker (pgWorker.ts)
 * and the Node verifier (scripts/verify-sql.mjs), so both show exactly the same results and errors.
 */
import { types, type PGlite, type PGliteOptions } from '@electric-sql/pglite';

export type Table = { columns: string[]; values: unknown[][] };
export type ScriptResult = { ok: true; table: Table | null; verify: Table | null; statements: number } | { ok: false; error: string };

// Dates and times stay as PostgreSQL prints them (as psql shows them), instead of JavaScript Dates in local time
const asText = (value: string) => value;
export const PG_OPTIONS: PGliteOptions = {
  parsers: { [types.DATE]: asText, [types.TIMESTAMP]: asText, [types.TIMESTAMPTZ]: asText, [types.TIME]: asText, [types.TIMETZ]: asText },
};

/** Wipes everything a previous run created: open transactions, settings, roles, schemas and their objects. */
export async function resetDatabase(db: PGlite, firstRun: boolean) {
  if (!firstRun) {
    await db.exec('ROLLBACK').catch(() => undefined);
    // Back to the real user first: a learner's SET ROLE would otherwise make "current_user" someone else
    await db.exec('RESET ROLE; RESET SESSION AUTHORIZATION;');
    const { rows: roles } = await db.query<{ rolname: string }>(
      "SELECT rolname FROM pg_roles WHERE rolname NOT LIKE 'pg\\_%' AND rolname <> session_user AND NOT rolsuper",
    );
    const { rows: schemas } = await db.query<{ nspname: string }>(
      "SELECT nspname FROM pg_namespace WHERE nspname NOT IN ('pg_catalog', 'information_schema') AND nspname NOT LIKE 'pg\\_%'",
    );
    const q = (name: string) => `"${name.replace(/"/g, '""')}"`;
    await db.exec(
      [
        ...schemas.map((s) => `DROP SCHEMA IF EXISTS ${q(s.nspname)} CASCADE;`),
        ...roles.map((r) => `DROP OWNED BY ${q(r.rolname)} CASCADE; DROP ROLE IF EXISTS ${q(r.rolname)};`),
        'CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;',
      ].join('\n'),
    );
  }
  // PGlite starts with sequential scans disabled; a normal server has them on, and query plans should look the same
  await db.exec('DISCARD ALL'); // settings, prepared statements, temporary tables and plans from the last run
  await db.exec("SET enable_seqscan = on; SET TIME ZONE 'UTC'; SET search_path TO public;");
}

/** A cell as text-like JSON: arrays in PostgreSQL's {a,b} form, documents as JSON. */
export function cell(v: unknown): unknown {
  if (v === null || v === undefined) return null;
  if (typeof v === 'bigint') return v.toString();
  if (v instanceof Date) return v.toISOString();
  if (Array.isArray(v)) return `{${v.map((x) => (x === null ? 'NULL' : typeof x === 'string' && /[\s,{}"]|^$/.test(x) ? JSON.stringify(x) : String(cell(x)))).join(',')}}`;
  if (v instanceof Uint8Array) return `\\x${Array.from(v, (b) => b.toString(16).padStart(2, '0')).join('')}`;
  if (typeof v === 'object') return JSON.stringify(v);
  return v;
}

/** The last statement that returned columns. */
export function lastTable(results: { fields: { name: string }[]; rows: unknown[] }[]): Table | null {
  for (let i = results.length - 1; i >= 0; i--) {
    const r = results[i];
    if (r.fields?.length) return { columns: r.fields.map((f) => f.name), values: (r.rows as unknown[][]).map((row) => row.map(cell)) };
  }
  return null;
}

/** PostgreSQL's error as psql shows it: the message with its line, then DETAIL and HINT when there are any. */
export function describeError(err: unknown, code: string): string {
  const e = err as { message?: string; position?: string | number; detail?: string; hint?: string };
  let text = `ERROR: ${e?.message ?? String(err)}`;
  const position = Number(e?.position);
  if (position > 0 && position <= code.length + 1) text += ` (line ${code.slice(0, position - 1).split('\n').length})`;
  if (e?.detail) text += `\nDETAIL: ${e.detail}`;
  if (e?.hint) text += `\nHINT: ${e.hint}`;
  return text;
}

/**
 * Splits a script into statements, as psql does, so each runs on its own (sent together, PostgreSQL would treat
 * the whole script as one implicit transaction, and a ROLLBACK in the middle would undo earlier statements too).
 * Understands 'strings', E'escapes', "names", $tag$ bodies $tag$, -- comments and nested block comments.
 */
export function splitStatements(sql: string): { text: string; start: number }[] {
  const out: { text: string; start: number }[] = [];
  let start = 0;
  let i = 0;
  const push = (end: number) => {
    const text = sql.slice(start, end);
    if (text.replace(/--[^\n]*|\/\*[\s\S]*?\*\//g, '').trim()) out.push({ text, start });
  };
  while (i < sql.length) {
    const c = sql[i];
    if (c === "'" || c === '"') {
      // A quoted string or name; a doubled quote is an escaped quote (E'..\'..' strings also allow backslashes)
      const escapes = c === "'" && /(^|[^\w])[eE]$/.test(sql.slice(Math.max(0, i - 2), i));
      i++;
      while (i < sql.length) {
        if (escapes && sql[i] === '\\') i += 2;
        else if (sql[i] === c && sql[i + 1] === c) i += 2;
        else if (sql[i] === c) break;
        else i++;
      }
      i++;
    } else if (c === '-' && sql[i + 1] === '-') {
      while (i < sql.length && sql[i] !== '\n') i++;
    } else if (c === '/' && sql[i + 1] === '*') {
      let depth = 0;
      do {
        if (sql.startsWith('/*', i)) (depth++, (i += 2));
        else if (sql.startsWith('*/', i)) (depth--, (i += 2));
        else i++;
      } while (depth > 0 && i < sql.length);
    } else if (c === '$' && /^\$(?:[A-Za-z_]\w*)?\$/.test(sql.slice(i)) && !/[\w$]/.test(sql[i - 1] ?? '')) {
      const tag = sql.slice(i).match(/^\$(?:[A-Za-z_]\w*)?\$/)![0];
      const end = sql.indexOf(tag, i + tag.length);
      i = end === -1 ? sql.length : end + tag.length;
    } else if (c === ';') {
      push(i + 1);
      start = ++i;
    } else i++;
  }
  push(sql.length);
  return out;
}

/** Runs a script statement by statement; an error reports its line in the whole script. */
async function runStatements(db: PGlite, code: string) {
  const results: Awaited<ReturnType<PGlite['exec']>> = [];
  for (const { text, start } of splitStatements(code)) {
    try {
      results.push(...(await db.exec(text, { rowMode: 'array' })));
    } catch (err) {
      const e = err as { position?: string | number };
      // Positions are relative to the statement; make them relative to the script. Errors without a position
      // (a constraint violation, say) point at the statement's first word
      if (e && typeof e === 'object') e.position = Number(e.position) > 0 ? Number(e.position) + start : start + text.search(/\S/) + 1;
      throw err;
    }
  }
  return results;
}

/** Setup (hidden sample data), then the learner's script, then an optional checking query. */
export async function runScript(db: PGlite, code: string, setup?: string, verify?: string): Promise<ScriptResult> {
  if (setup) {
    try {
      await db.exec(setup);
    } catch (err) {
      return { ok: false, error: `The sample database failed to load: ${describeError(err, setup)}` };
    }
  }
  let results;
  try {
    results = await runStatements(db, code);
  } catch (err) {
    return { ok: false, error: describeError(err, code) };
  }
  let checked: Table | null = null;
  if (verify) {
    try {
      checked = lastTable(await runStatements(db, verify));
    } catch (err) {
      return { ok: false, error: `Your script ran, but checking the database failed: ${describeError(err, verify)}` };
    }
  }
  return { ok: true, table: lastTable(results), verify: checked, statements: results.length };
}
