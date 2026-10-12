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
      {result.output && <pre>{result.output}</pre>}
      {result.error && <pre className="err">{result.error}</pre>}
      {!result.output && !result.error && !result.table?.columns.length && result.passed === undefined && <pre className="muted">(no output)</pre>}
      {errText && <ErrorHelp lang={lang} code={code} error={errText} />}
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
