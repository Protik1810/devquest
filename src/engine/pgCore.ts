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
    const { rows: roles } = await db.query<{ rolname: string }>("SELECT rolname FROM pg_roles WHERE rolname NOT LIKE 'pg\\_%' AND rolname <> current_user");
    const { rows: schemas } = await db.query<{ nspname: string }>(
      "SELECT nspname FROM pg_namespace WHERE nspname NOT IN ('pg_catalog', 'information_schema') AND nspname NOT LIKE 'pg\\_%'",
    );
    const q = (name: string) => `"${name.replace(/"/g, '""')}"`;
    await db.exec(
      [
        'RESET ROLE; RESET SESSION AUTHORIZATION;',
        ...schemas.map((s) => `DROP SCHEMA IF EXISTS ${q(s.nspname)} CASCADE;`),
        ...roles.map((r) => `DROP OWNED BY ${q(r.rolname)} CASCADE; DROP ROLE IF EXISTS ${q(r.rolname)};`),
        'CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;',
      ].join('\n'),
    );
  }
  await db.exec("RESET ALL; SET TIME ZONE 'UTC'; SET search_path TO public;");
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
    results = await db.exec(code, { rowMode: 'array' });
  } catch (err) {
    return { ok: false, error: describeError(err, code) };
  }
  let checked: Table | null = null;
  if (verify) {
    try {
      checked = lastTable(await db.exec(verify, { rowMode: 'array' }));
    } catch (err) {
      return { ok: false, error: `Your script ran, but checking the database failed: ${describeError(err, verify)}` };
    }
  }
  return { ok: true, table: lastTable(results), verify: checked, statements: results.length };
}
