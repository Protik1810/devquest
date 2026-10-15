import type { CodeCheck } from '../content/types';
import type { RunResult } from './runners';

type Table = { columns: string[]; values: unknown[][] };
type Reply = { id: number; ok: boolean; table?: Table | null; verify?: Table | null; statements?: number; error?: string };

let worker: Worker | null = null;
let seq = 0;

function spawn() {
  worker = new Worker(new URL('./pgWorker.ts', import.meta.url), { type: 'module' });
  return worker;
}

/** Run SQL on a fresh in-memory PostgreSQL database. Times out (and restarts the worker) after `timeoutMs`. */
function pgRun(code: string, setup?: string, verify?: string, timeoutMs = 20000): Promise<Reply> {
  const w = worker ?? spawn();
  const id = ++seq;
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      w.terminate();
      worker = null;
      resolve({ id, ok: false, error: `⏱ The query ran for more than ${timeoutMs / 1000}s and was stopped. Is there an endless recursive query?` });
    }, timeoutMs);
    const onMsg = (e: MessageEvent<Reply>) => {
      if (e.data.id !== id) return;
      clearTimeout(timer);
      w.removeEventListener('message', onMsg);
      resolve(e.data);
    };
    w.addEventListener('message', onMsg);
    w.addEventListener('error', (e) => resolve({ id, ok: false, error: `PostgreSQL failed to start: ${e.message}` }), { once: true });
    w.postMessage({ id, code, setup, verify });
  });
}

export const warmPostgres = () => void pgRun('SELECT 1');

// Compare values, not JavaScript types: count(*) (bigint) and a cast to integer should give the same row
const key = (row: unknown[]) => JSON.stringify(row.map((v) => (v === null ? null : String(v))));
function sameTable(a: Table | null | undefined, b: Table | null | undefined, ordered: boolean) {
  if (!a || !b) return a === b;
  if (a.columns.join() !== b.columns.join()) return false;
  const ra = a.values.map(key);
  const rb = b.values.map(key);
  if (!ordered) {
    ra.sort();
    rb.sort();
  }
  return ra.length === rb.length && ra.every((r, i) => r === rb[i]);
}

const describe = (t: Table | null | undefined) => (t ? `${t.values.length} row(s)` : 'Statements ran successfully');

/**
 * PostgreSQL exercises. With a `sql` check, the learner's last result is compared with the reference query's
 * (`expected`). With `verify`, a checking query runs after both scripts instead (for CREATE/ALTER/INSERT tasks).
 */
export async function runPostgres(code: string, check?: CodeCheck, exampleSetup?: string): Promise<RunResult> {
  const setup = check?.type === 'sql' ? check.setup : exampleSetup;
  const verify = check?.type === 'sql' ? check.verify : undefined;
  const mine = await pgRun(code, setup, verify);
  if (!mine.ok) return { ok: false, output: '', error: mine.error, passed: check ? false : undefined };
  const shown = verify ? mine.verify ?? mine.table : mine.table;
  const base: RunResult = { ok: true, output: describe(mine.table), table: shown ?? undefined };
  if (check?.type !== 'sql') return base;
  const ref = await pgRun(check.expected, setup, verify);
  if (!ref.ok) return { ...base, passed: false, message: `Reference query failed: ${ref.error}` };
  const passed = verify ? sameTable(mine.verify, ref.verify, !!check.ordered) : sameTable(mine.table, ref.table, !!check.ordered);
  const want = verify ? ref.verify : ref.table;
  return {
    ...base,
    passed,
    message: passed
      ? verify
        ? 'The database ends up exactly as expected!'
        : 'Your result matches!'
      : `Not quite. Expected ${want ? `${want.values.length} row(s) with columns ${want.columns.join(', ')}` : 'no result table'}${verify ? ' when checking the database after your script' : ''}.`,
  };
}
