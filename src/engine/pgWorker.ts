/// <reference lib="webworker" />
// Real PostgreSQL (PGlite: Postgres compiled to WebAssembly) in a worker, so a runaway query can be killed.
// One in-memory database per worker, wiped between runs.
import { PGlite } from '@electric-sql/pglite';
import { PG_OPTIONS, resetDatabase, runScript } from './pgCore';

type Req = { id: number; setup?: string; code: string; verify?: string };

let db: PGlite | null = null;

async function fresh() {
  const first = db === null;
  if (!db) {
    db = new PGlite(PG_OPTIONS);
    await db.waitReady;
  }
  await resetDatabase(db, first);
  return db;
}

self.onmessage = async (e: MessageEvent<Req>) => {
  const { id, setup, code, verify } = e.data;
  try {
    const result = await runScript(await fresh(), code, setup, verify);
    postMessage({ id, ...result });
  } catch (err) {
    postMessage({ id, ok: false, error: String((err as Error)?.message ?? err) });
  }
};
