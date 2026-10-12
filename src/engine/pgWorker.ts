/// <reference lib="webworker" />
// Real PostgreSQL (PGlite: Postgres compiled to WebAssembly) in a worker, so a runaway query can be killed.
// One in-memory database per worker, wiped between runs.
import { PGlite } from '@electric-sql/pglite';

type Req = { id: number; setup?: string; code: string; verify?: string };
type Table = { columns: string[]; values: unknown[][] };

let db: PGlite | null = null;

async function fresh() {
  if (!db) {
    db = new PGlite();
    await db.waitReady;
    return db;
  }
  // Drop everything a previous run created: user schemas (and their tables, types, functions)
  const { rows } = await db.query<{ nspname: string }>(
    "SELECT nspname FROM pg_namespace WHERE nspname NOT IN ('pg_catalog', 'information_schema') AND nspname NOT LIKE 'pg\\_%'",
  );
  const drops = rows.map((r) => `DROP SCHEMA IF EXISTS "${r.nspname.replace(/"/g, '""')}" CASCADE;`).join('\n');
  await db.exec(`ROLLBACK; ${drops} CREATE SCHEMA public; SET search_path TO public;`).catch(async () => {
    await db!.exec(`${drops} CREATE SCHEMA public; SET search_path TO public;`);
  });
  return db;
}

const cell = (v: unknown): unknown => (v instanceof Date ? v.toISOString() : typeof v === 'bigint' ? v.toString() : v !== null && typeof v === 'object' ? JSON.stringify(v) : v);

/** The last statement that returned columns. */
function lastTable(results: { fields: { name: string }[]; rows: unknown[] }[]): Table | null {
  for (let i = results.length - 1; i >= 0; i--) {
    const r = results[i];
    if (r.fields?.length) return { columns: r.fields.map((f) => f.name), values: (r.rows as unknown[][]).map((row) => row.map(cell)) };
  }
  return null;
}

self.onmessage = async (e: MessageEvent<Req>) => {
  const { id, setup, code, verify } = e.data;
  try {
    const pg = await fresh();
    if (setup) await pg.exec(setup);
    const res = await pg.exec(code, { rowMode: 'array' });
    let checked: Table | null = null;
    if (verify) checked = lastTable(await pg.exec(verify, { rowMode: 'array' }));
    postMessage({ id, ok: true, table: lastTable(res), verify: checked, statements: res.length });
  } catch (err) {
    postMessage({ id, ok: false, error: String((err as Error)?.message ?? err) });
  }
};
