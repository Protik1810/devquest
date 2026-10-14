import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { RunResult } from '../engine/runners';
import { explainLocally } from '../engine/errors';
import { explainError, useAIReady } from '../engine/ai';
import { Markdown } from './Markdown';

/** Program output, test verdict, SQL tables, and beginner-friendly help for errors. */
export function ResultView({ result, lang, code }: { result: RunResult; lang: string; code: string }) {
  const errText = result.error ?? (result.passed === false ? result.message : undefined);
  return (
    <div className={`console ${result.passed === true ? 'pass' : result.passed === false || !result.ok ? 'fail' : ''}`}>
      {result.passed === true && <div className="verdict ok">✅ {result.message}</div>}
      {result.passed === false && <div className="verdict bad">❌ {result.message}</div>}
      {result.table && result.table.columns.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>{result.table.columns.map((c) => <th key={c}>{c}</th>)}</tr>
            </thead>
            <tbody>
              {result.table.values.slice(0, 50).map((row, i) => (
                <tr key={i}>{row.map((v, j) => <td key={j}>{v === null ? 'NULL' : String(v)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {result.passed === false && result.expected !== undefined && result.ok ? (
        <OutputDiff actual={result.output} expected={result.expected} />
      ) : (
        result.output && <pre>{result.output}</pre>
      )}
      {result.error && <pre className="err">{result.error}</pre>}
      {!result.output && !result.error && !result.table?.columns.length && result.passed === undefined && <pre className="muted">(no output)</pre>}
      {errText && <ErrorHelp lang={lang} code={code} error={errText} />}
    </div>
  );
}

const lines = (s: string) => s.replace(/\r\n/g, '\n').replace(/\s+$/, '').split('\n').map((l) => l.trimEnd());

/** What's different between two lines, in words a beginner can act on. */
function lineProblem(n: number, mine: string | undefined, want: string | undefined) {
  if (mine === undefined) return <>Your output stops too early: line {n} should be <code>{want}</code>.</>;
  if (want === undefined) return <>Your output has extra lines, starting with line {n}: <code>{mine}</code>.</>;
  if (mine.toLowerCase() === want.toLowerCase()) return <>Line {n} differs only in capital letters.</>;
  if (mine.replace(/\s+/g, '') === want.replace(/\s+/g, '')) return <>Line {n} differs only in spaces.</>;
  let c = 0;
  while (c < mine.length && mine[c] === want[c]) c++;
  return (
    <>
      Line {n} differs from character {c + 1}: you printed <code>{mine.slice(c, c + 20) || '(nothing)'}</code> where <code>{want.slice(c, c + 20) || '(nothing)'}</code> was expected.
    </>
  );
}

/** Your output next to the expected output, line by line, with the first difference explained. */
function OutputDiff({ actual, expected }: { actual: string; expected: string }) {
  const mine = lines(actual);
  const want = lines(expected);
  const rows = Math.max(mine.length, want.length);
  const first = Array.from({ length: rows }, (_, i) => i).find((i) => mine[i] !== want[i]);
  return (
    <div className="diff">
      {first !== undefined && <div className="diff-why small">🔎 {lineProblem(first + 1, mine[first], want[first])}</div>}
      <div className="table-wrap">
        <table className="diff-table">
          <thead>
            <tr><th>#</th><th>Your output</th><th>Expected</th></tr>
          </thead>
          <tbody>
            {Array.from({ length: Math.min(rows, 60) }, (_, i) => (
              <tr key={i} className={mine[i] === want[i] ? '' : 'diff-bad'}>
                <td>{i + 1}</td>
                <td><pre>{mine[i] ?? ''}</pre></td>
                <td><pre>{want[i] ?? ''}</pre></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ErrorHelp({ lang, code, error }: { lang: string; code: string; error: string }) {
  const local = explainLocally(lang, error);
  const aiReady = useAIReady();
  const [ai, setAi] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ask = async () => {
    setBusy(true);
    try {
      setAi(await explainError({ lang, code, error }));
    } catch (e) {
      setAi(`⚠️ ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="err-help">
      {local && (
        <div>
          <b>🩺 {local.title}</b>
          <Markdown source={`${local.explain}\n\n**How to fix:** ${local.fix}`} />
        </div>
      )}
      {ai ? (
        <div className="ai-box">
          <b>🦉 AI explanation</b>
          <Markdown source={ai} />
        </div>
      ) : aiReady ? (
        <button className="ghost small" onClick={ask} disabled={busy}>{busy ? '🦉 Thinking…' : '🦉 Explain this error with AI'}</button>
      ) : (
        !local && <small className="muted">Tip: set up an AI provider in <Link to="/settings">Settings</Link> to get errors explained in plain English.</small>
      )}
    </div>
  );
}
