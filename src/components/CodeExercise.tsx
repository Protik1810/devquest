import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { CodeExercise as CodeEx } from '../content/types';
import { tracePython, warmPython, type TraceResult } from '../engine/runners';
import { execMode, execute, modeLabel, type ExecResult } from '../engine/execute';
import { useTools } from '../engine/localRun';
import { useAIReady } from '../engine/ai';
import { useGame } from '../engine/store';
import { useLessonCtx } from '../engine/lessonCtx';
import { Markdown } from './Markdown';
import { Editor, LANG_LABEL, WebPreview } from './Editor';
import { ResultView } from './ResultView';
import { AIReview } from './AIReview';
import { TraceViewer } from './TraceViewer';

/** The solution stays locked until a real attempt: two failed submissions, or every hint seen. */
export const solutionUnlocked = (o: { done: boolean; failed: number; hintsShown: number; hints: number }) => o.done || o.failed >= 2 || o.hintsShown >= o.hints;
export const SOLUTION_LOCKED = 'Unlocks after 2 submitted attempts, or once you have seen every hint';

export function CodeExercise({ ex, lessonId, step, title, onComplete, done, xp }: { ex: CodeEx; lessonId: string; /** Position in a multi-exercise lesson (drafts are kept per step) */ step?: number; title?: string; onComplete: (o: { hints: number; solution: boolean; scale?: number }) => void; done: boolean; /** Full reward, to show the current (hint-reduced) amount. */ xp?: number }) {
  const storageKey = step ? `code:${lessonId}#${step}` : `code:${lessonId}`;
  const [code, setCode] = useState(() => {
    try {
      return localStorage.getItem(storageKey) ?? ex.starter;
    } catch {
      return ex.starter;
    }
  });
  const [result, setResult] = useState<ExecResult | null>(null);
  const [running, setRunning] = useState(false);
  const [hintsShown, setHintsShown] = useState(0);
  const [sawSolution, setSawSolution] = useState(false);
  const [passed, setPassed] = useState(false);
  const [selfCheck, setSelfCheck] = useState(false);
  const [failed, setFailed] = useState(0);
  const [trace, setTrace] = useState<TraceResult | null>(null);
  const bump = useGame((s) => s.bump);
  const setCtx = useLessonCtx((s) => s.set);
  // Re-render when toolchain detection or AI setup changes the execution mode
  useTools((s) => s.langs);
  useAIReady();
  const mode = execMode(ex.lang);
  const label = modeLabel(ex.lang);
  const expected = ex.check.type === 'stdout' ? ex.check.expected : undefined;

  useEffect(() => {
    if (ex.lang === 'python') warmPython().catch(() => {});
  }, [ex.lang]);

  useEffect(() => {
    setCtx({ code });
    try {
      localStorage.setItem(storageKey, code);
    } catch {
      /* storage unavailable: drafts just won't persist */
    }
  }, [code, storageKey, setCtx]);

  const stdin = 'stdin' in ex.check ? ex.check.stdin : undefined;
  const run = async (submit: boolean) => {
    if (mode === 'self') {
      if (submit) setSelfCheck(true);
      return;
    }
    // AI mode can't "just run": every check is a judgement against the task
    const grade = submit || ex.lang === 'sql' || mode === 'ai';
    setRunning(true);
    setTrace(null);
    bump('runs');
    try {
      const r = await execute(ex.lang, code, grade ? ex.check : undefined, ex.prompt, { solution: ex.solution, starter: ex.starter }, stdin);
      if (!submit && ex.lang !== 'sql' && mode !== 'ai') r.passed = undefined;
      setResult(r);
      // Remember failed submissions so the dashboard can suggest weak spots to practise
      if (submit && r.passed === false) {
        useGame.getState().noteStruggle(lessonId);
        setFailed((n) => n + 1);
      }
      if (submit && r.passed && !passed) {
        setPassed(true);
        onComplete({ hints: hintsShown, solution: sawSolution });
      }
    } catch (e) {
      setResult({ ok: false, output: '', error: (e as Error).message, mode });
    } finally {
      setRunning(false);
    }
  };

  const stepThrough = async () => {
    setRunning(true);
    setResult(null);
    try {
      const t = await tracePython(code, stdin);
      if ('failed' in t) setResult({ ok: false, output: '', error: t.failed, mode });
      else setTrace(t);
    } finally {
      setRunning(false);
    }
  };
  const solutionOpen = mode === 'self' || solutionUnlocked({ done, failed, hintsShown, hints: ex.hints.length });

  const showSolution = () => {
    if (!done && !confirm('Viewing the solution means you earn no XP for this exercise. Show it anyway?')) return;
    setSawSolution(true);
    setCode(ex.solution);
  };

  const confirmSelfCheck = () => {
    setSelfCheck(false);
    if (passed) return;
    setPassed(true);
    // Self-checked work earns half XP, since nothing verified it
    onComplete({ hints: hintsShown, solution: false, scale: 0.5 });
  };

  return (
    <div className="code-ex">
      <div className="ex-prompt">
        <span className="tag">{LANG_LABEL[ex.lang]}</span>
        <Markdown source={ex.prompt} />
        {stdin !== undefined && (
          <div className="stdin-note small">
            ⌨️ When your program calls <code>input()</code>, these lines are typed in for it, one per call:
            <pre>{stdin}</pre>
            {ex.check.type === 'stdout' && !!ex.check.cases?.length && (
              <div className="muted">🧪 When you submit, it's also run with {ex.check.cases.length} other input{ex.check.cases.length > 1 ? 's' : ''}, so make it work for any input, not just this one.</div>
            )}
          </div>
        )}
        {expected !== undefined && (
          <details className="expected">
            <summary className="small">Expected output</summary>
            <pre>{expected}</pre>
          </details>
        )}
      </div>
      <div className={`exec-mode m-${mode}`}>
        {label.icon} {label.text}
        {mode === 'self' && (
          <>
            {' · '}
            <Link to="/settings">Set up AI</Link>
          </>
        )}
      </div>
      <Editor lang={ex.lang} value={code} onChange={setCode} height={ex.lang === 'web' ? '320px' : '280px'} onRun={() => run(false)} />
      {ex.lang === 'web' && <WebPreview code={code} />}
      <div className="ex-actions">
        {mode !== 'ai' && mode !== 'self' && (
          <button onClick={() => run(false)} disabled={running} title="Ctrl+Enter">{running ? '⏳ Running…' : ex.lang === 'web' ? '▶ Check page' : '▶ Run'}</button>
        )}
        <button className="primary" onClick={() => run(true)} disabled={running}>
          {running ? (mode === 'ai' ? '🤖 Checking…' : '⏳ Running…') : mode === 'ai' ? '🤖 Check with AI' : mode === 'self' ? '📝 Self-check' : '✔ Submit'}
        </button>
        <span className="spacer" />
        <button className="ghost" onClick={() => { setHintsShown((h) => Math.min(h + 1, ex.hints.length)); bump('hints'); }} disabled={hintsShown >= ex.hints.length}>
          💡 Hint {ex.hints.length ? `(${hintsShown}/${ex.hints.length})` : ''}
        </button>
        {ex.lang === 'python' && mode === 'app' && (
          <button className="ghost" onClick={stepThrough} disabled={running} title="Watch your program run one line at a time">👣 Step through</button>
        )}
        <button className="ghost" onClick={showSolution} disabled={!solutionOpen} title={solutionOpen ? 'Show the reference solution' : SOLUTION_LOCKED}>{solutionOpen ? '👁 Solution' : '🔒 Solution'}</button>
        <button className="ghost" onClick={() => { if (confirm('Reset your code to the starter?')) setCode(ex.starter); }} title="Reset">↺</button>
      </div>
      {hintsShown > 0 && (
        <div className="hints">
          {ex.hints.slice(0, hintsShown).map((h, i) => (
            <div key={i} className="hint">💡 {h}</div>
          ))}
          {!done && (
            <small className="muted">
              Each hint reduces this exercise's XP by 15%
              {xp ? <>: you'll now earn <b>{Math.round(xp * Math.max(0.25, 1 - 0.15 * hintsShown))} XP</b> instead of {xp}.</> : '.'}
            </small>
          )}
        </div>
      )}
      {selfCheck && (
        <div className="card inset self-check">
          <b>📝 Self-check</b>
          <p className="small muted">Nothing can run {LANG_LABEL[ex.lang]} on this device, so compare your code with a reference solution. If yours does the same thing (it doesn't have to be identical), mark it done for half XP.</p>
          <Markdown source={'```\n' + ex.solution + '\n```'} />
          {expected !== undefined && <Markdown source={'**Expected output**\n```\n' + expected + '\n```'} />}
          <div className="row">
            <button className="primary" onClick={confirmSelfCheck}>✔ Mine does the same (50% XP)</button>
            <button className="ghost" onClick={() => setSelfCheck(false)}>Keep working</button>
          </div>
        </div>
      )}
      {result && <ResultView result={result} lang={ex.lang} code={code} />}
      {trace && <TraceViewer code={code} trace={trace} onClose={() => setTrace(null)} />}
      {(result || passed || done) && <AIReview title={title ?? lessonId} prompt={ex.prompt} lang={ex.lang} code={code} passed={result?.passed} output={result?.error ?? result?.output} />}
    </div>
  );
}
