import { useState } from 'react';
import type { CodeLang, QuizQuestion } from '../content/types';
import { runExample, tracePython, type RunResult, type TraceResult } from '../engine/runners';
import { useGame } from '../engine/store';
import { Editor } from './Editor';
import { ResultView } from './ResultView';
import { TraceViewer } from './TraceViewer';
import { Inline, shuffleOptions } from './Quiz';

/** Fence languages whose examples can run inside a lesson. */
export const RUNNABLE: Record<string, CodeLang> = { python: 'python', py: 'python', javascript: 'javascript', js: 'javascript', typescript: 'typescript', ts: 'typescript', lua: 'lua' };

/**
 * A code example in lesson text that the learner can run, edit and (for Python) step through.
 * `earlier` holds the page's previous examples in the same language, for examples that build on them.
 */
export function RunnableCode({ lang, code, earlier }: { lang: CodeLang; code: string; earlier: string[] }) {
  const [src, setSrc] = useState(code.replace(/\n$/, ''));
  const [editing, setEditing] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [trace, setTrace] = useState<TraceResult | null>(null);
  const [running, setRunning] = useState(false);
  const [withEarlier, setWithEarlier] = useState(false);
  const [stdin, setStdin] = useState('');
  const bump = useGame((s) => s.bump);
  const python = lang === 'python';
  const usesInput = python && /\binput\(/.test(src);
  const prelude = (on: boolean) => (on && earlier.length ? earlier : undefined);

  const run = async (on = withEarlier) => {
    setRunning(true);
    setTrace(null);
    bump('runs');
    try {
      setResult(await runExample(lang, src, prelude(on), usesInput ? stdin : undefined));
    } catch (e) {
      setResult({ ok: false, output: '', error: String((e as Error).message ?? e) });
    } finally {
      setRunning(false);
    }
  };

  const stepThrough = async (on = withEarlier) => {
    setRunning(true);
    setResult(null);
    try {
      const t = await tracePython(src, usesInput ? stdin : undefined, prelude(on));
      if ('failed' in t) setResult({ ok: false, output: '', error: t.failed });
      else setTrace(t);
    } finally {
      setRunning(false);
    }
  };

  const lines = src.split('\n').length;
  const nameError = !withEarlier && earlier.length > 0 && python && /NameError/.test((result?.error ?? '') + (trace?.error ?? ''));

  return (
    <div className="runnable">
      {editing ? (
        <Editor lang={lang} value={src} onChange={setSrc} height={`${Math.min(20, lines + 1) * 22 + 12}px`} onRun={() => run()} />
      ) : (
        <pre className="runnable-code">
          <code>{src}</code>
        </pre>
      )}
      <div className="runnable-bar">
        <button className="small" onClick={() => run()} disabled={running} title="Run this example">{running ? '⏳ Running…' : '▶ Run'}</button>
        {python && (
          <button className="ghost small" onClick={() => stepThrough()} disabled={running} title="Watch it run one line at a time">👣 Step through</button>
        )}
        <button className="ghost small" onClick={() => setEditing(!editing)}>{editing ? '✓ Done' : '✎ Edit'}</button>
        {src !== code.replace(/\n$/, '') && (
          <button className="ghost small" onClick={() => { setSrc(code.replace(/\n$/, '')); setResult(null); setTrace(null); }}>↺ Reset</button>
        )}
        {withEarlier && <span className="muted small">runs after this page's earlier examples</span>}
      </div>
      {usesInput && (
        <label className="stdin-box small">
          ⌨️ Typed input for <code>input()</code>, one line per call
          <textarea rows={2} value={stdin} onChange={(e) => setStdin(e.target.value)} spellCheck={false} />
        </label>
      )}
      {nameError && (
        <div className="runnable-hint small">
          This example uses names created in an earlier example on this page.{' '}
          <button className="small" onClick={() => { setWithEarlier(true); if (trace) stepThrough(true); else run(true); }}>
            Run it after the earlier examples
          </button>
        </div>
      )}
      {result && <ResultView result={result} lang={lang} code={src} />}
      {result?.ok && !result.output && python && (
        <div className="runnable-hint small muted">This example doesn't print anything. Press 👣 Step through to watch its variables change line by line.</div>
      )}
      {trace && <TraceViewer code={src} trace={trace} onClose={() => setTrace(null)} />}
    </div>
  );
}

/** A "pause and predict" check inside lesson text: no XP, just instant feedback. */
export function InlineCheck({ questions }: { questions: QuizQuestion[] }) {
  return (
    <div className="inline-check">
      <div className="ic-title">🤔 Pause and predict</div>
      {questions.map((q, i) => (
        <OneCheck key={i} q={q} />
      ))}
    </div>
  );
}

function OneCheck({ q: question }: { q: QuizQuestion }) {
  const [q] = useState(() => shuffleOptions(question));
  const [tried, setTried] = useState<number[]>([]);
  const solved = tried.includes(q.answer);
  const last = tried[tried.length - 1];
  return (
    <div className="ic-q">
      <div className="ic-question"><Inline text={q.q} /></div>
      {q.code && <pre className="quiz-code"><code>{q.code}</code></pre>}
      <div className="ic-opts">
        {q.options.map((o, i) => {
          const state = tried.includes(i) ? (i === q.answer ? 'right' : 'wrong') : '';
          return (
            <button key={i} className={`opt small ${state}`} disabled={solved || tried.includes(i)} onClick={() => setTried([...tried, i])}>
              <Inline text={o} />
            </button>
          );
        })}
      </div>
      {last !== undefined && (
        <div className={`feedback ${solved ? 'ok' : 'bad'}`}>
          {solved ? '✅ Right! ' : '❌ Not quite. Think again: '}
          {solved && q.explain && <Inline text={q.explain} />}
        </div>
      )}
    </div>
  );
}
