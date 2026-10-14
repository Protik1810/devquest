import { useEffect, useMemo, useState } from 'react';
import type { CodeLang, FillExercise as FillEx, ParsonsExercise as ParsonsEx } from '../content/types';
import { BLANK } from '../content/lessonFile';
import { execute, execMode, type ExecResult } from '../engine/execute';
import { tracePython, warmPython, type TraceResult } from '../engine/runners';
import { useGame } from '../engine/store';
import { shuffled } from '../engine/shuffle';
import { Markdown } from './Markdown';
import { LANG_LABEL } from './Editor';
import { ResultView } from './ResultView';
import { TraceViewer } from './TraceViewer';
import { SOLUTION_LOCKED, solutionUnlocked } from './CodeExercise';

type Done = (o: { hints: number; solution: boolean; scale?: number }) => void;
type Props<E> = { ex: E; lessonId: string; step?: number; done: boolean; onComplete: Done; xp?: number };

/** Remember a puzzle's state on the device, like code drafts. */
function useSaved<T>(key: string, initial: () => T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as T;
    } catch {
      /* fall through */
    }
    return initial();
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable */
    }
  }, [key, value]);
  return [value, setValue];
}

/** Running, submitting, hints, the solution lock and step-through, shared by both puzzle types. */
function usePuzzle(lang: CodeLang, lessonId: string, done: boolean, hints: string[], onComplete: Done) {
  const [result, setResult] = useState<ExecResult | null>(null);
  const [trace, setTrace] = useState<TraceResult | null>(null);
  const [running, setRunning] = useState(false);
  const [hintsShown, setHintsShown] = useState(0);
  const [failed, setFailed] = useState(0);
  const [sawSolution, setSawSolution] = useState(false);
  const [passed, setPassed] = useState(false);
  const bump = useGame((s) => s.bump);
  useEffect(() => {
    if (lang === 'python') warmPython().catch(() => {});
  }, [lang]);

  const run = async (code: string, ex: { check: ParsonsEx['check']; prompt: string }, reference: string, submit: boolean) => {
    setRunning(true);
    setTrace(null);
    bump('runs');
    try {
      const stdin = 'stdin' in ex.check ? ex.check.stdin : undefined;
      const r = await execute(lang, code, submit ? ex.check : undefined, ex.prompt, { solution: reference }, stdin);
      if (!submit) r.passed = undefined;
      setResult(r);
      if (submit && r.passed === false) {
        useGame.getState().noteStruggle(lessonId);
        setFailed((n) => n + 1);
      }
      if (submit && r.passed && !passed) {
        setPassed(true);
        onComplete({ hints: hintsShown, solution: sawSolution });
      }
    } finally {
      setRunning(false);
    }
  };

  const stepThrough = async (code: string, stdin?: string) => {
    setRunning(true);
    setResult(null);
    try {
      const t = await tracePython(code, stdin);
      if ('failed' in t) setResult({ ok: false, output: '', error: t.failed, mode: 'app' });
      else setTrace(t);
    } finally {
      setRunning(false);
    }
  };

  const solutionOpen = solutionUnlocked({ done, failed, hintsShown, hints: hints.length });
  const revealSolution = (apply: () => void) => {
    if (!done && !confirm('Viewing the solution means you earn no XP for this exercise. Show it anyway?')) return;
    setSawSolution(true);
    apply();
  };
  const nextHint = () => {
    setHintsShown((h) => Math.min(h + 1, hints.length));
    bump('hints');
  };
  return { result, trace, setTrace, running, hintsShown, nextHint, solutionOpen, revealSolution, run, stepThrough };
}

function PuzzleFooter({ p, lang, code, hints, done, xp, stdin, onSolution, onRun, onSubmit }: { p: ReturnType<typeof usePuzzle>; lang: CodeLang; code: string; hints: string[]; done: boolean; xp?: number; stdin?: string; onSolution: () => void; onRun: () => void; onSubmit: () => void }) {
  const canRun = execMode(lang) === 'app';
  return (
    <>
      <div className="ex-actions">
        {canRun && <button onClick={onRun} disabled={p.running}>{p.running ? '⏳ Running…' : '▶ Run'}</button>}
        <button className="primary" onClick={onSubmit} disabled={p.running}>✔ Submit</button>
        {lang === 'python' && canRun && (
          <button className="ghost" onClick={() => p.stepThrough(code, stdin)} disabled={p.running}>👣 Step through</button>
        )}
        <span className="spacer" />
        <button className="ghost" onClick={p.nextHint} disabled={p.hintsShown >= hints.length}>
          💡 Hint {hints.length ? `(${p.hintsShown}/${hints.length})` : ''}
        </button>
        <button className="ghost" onClick={onSolution} disabled={!p.solutionOpen} title={p.solutionOpen ? 'Show the solution' : SOLUTION_LOCKED}>
          {p.solutionOpen ? '👁 Solution' : '🔒 Solution'}
        </button>
      </div>
      {p.hintsShown > 0 && (
        <div className="hints">
          {hints.slice(0, p.hintsShown).map((h, i) => (
            <div key={i} className="hint">💡 {h}</div>
          ))}
          {!done && xp ? <small className="muted">Each hint reduces this step's XP by 15%: you'll now earn <b>{Math.round(xp * Math.max(0.25, 1 - 0.15 * p.hintsShown))} XP</b> instead of {xp}.</small> : null}
        </div>
      )}
      {p.result && <ResultView result={p.result} lang={lang} code={code} />}
      {p.trace && <TraceViewer code={code} trace={p.trace} onClose={() => p.setTrace(null)} />}
    </>
  );
}

/** "Put the lines in order": build the program from shuffled lines, leaving out the ones that don't belong. */
export function ParsonsExercise({ ex, lessonId, step, done, onComplete, xp }: Props<ParsonsEx>) {
  const items = useMemo(() => [...ex.lines, ...ex.distractors], [ex]);
  // A stable shuffle per exercise, never already in the right order
  const order = useMemo(() => {
    const ids = items.map((_, i) => i);
    for (let n = 0; n < 20; n++) {
      const s = shuffled(ids, `${lessonId}#${step ?? 0}#${n}`);
      if (s.some((id, i) => id !== i)) return s;
    }
    return ids;
  }, [items, lessonId, step]);
  const [program, setProgram] = useSaved<number[]>(`parsons:${lessonId}#${step ?? 0}`, () => []);
  const [drag, setDrag] = useState<{ from: 'pool' | 'program'; id: number } | null>(null);
  const p = usePuzzle(ex.lang, lessonId, done, ex.hints, onComplete);
  const pool = order.filter((id) => !program.includes(id));
  const code = program.map((id) => items[id]).join('\n') + '\n';
  const reference = ex.lines.join('\n') + '\n';
  const stdin = 'stdin' in ex.check ? ex.check.stdin : undefined;

  const move = (index: number, by: number) => {
    const next = [...program];
    const [id] = next.splice(index, 1);
    next.splice(Math.max(0, Math.min(next.length, index + by)), 0, id);
    setProgram(next);
  };
  const dropAt = (index: number) => {
    if (!drag) return;
    const next = program.filter((id) => id !== drag.id);
    next.splice(Math.min(index, next.length), 0, drag.id);
    setProgram(next);
    setDrag(null);
  };

  return (
    <div className="code-ex parsons">
      <div className="ex-prompt">
        <span className="tag">🧩 {LANG_LABEL[ex.lang]} · put the lines in order</span>
        <Markdown source={ex.prompt} />
        {ex.distractors.length > 0 && <p className="small muted">Careful: {ex.distractors.length === 1 ? 'one line doesn\'t' : `${ex.distractors.length} lines don't`} belong in the program.</p>}
      </div>
      <div className="parsons-cols">
        <div className="parsons-col" onDragOver={(e) => e.preventDefault()} onDrop={() => { if (drag?.from === 'program') { setProgram(program.filter((id) => id !== drag.id)); setDrag(null); } }}>
          <div className="muted small">Lines (click or drag to add)</div>
          {pool.map((id) => (
            <button key={id} className="pline" draggable onDragStart={() => setDrag({ from: 'pool', id })} onClick={() => setProgram([...program, id])} title="Add to your program">
              <code>{items[id]}</code>
            </button>
          ))}
          {!pool.length && <div className="muted small">All lines used.</div>}
        </div>
        <div className="parsons-col program" onDragOver={(e) => e.preventDefault()} onDrop={() => dropAt(program.length)}>
          <div className="muted small">Your program</div>
          {program.map((id, i) => (
            <div key={id} className="pline placed" draggable onDragStart={() => setDrag({ from: 'program', id })} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.stopPropagation(); dropAt(i); }}>
              <code>{items[id]}</code>
              <span className="pline-tools">
                <button className="ghost small" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
                <button className="ghost small" onClick={() => move(i, 1)} disabled={i === program.length - 1} aria-label="Move down">↓</button>
                <button className="ghost small" onClick={() => setProgram(program.filter((x) => x !== id))} aria-label="Remove">✕</button>
              </span>
            </div>
          ))}
          {!program.length && <div className="muted small parsons-empty">Add lines here, in order. Indentation is already part of each line.</div>}
        </div>
      </div>
      <PuzzleFooter
        p={p}
        lang={ex.lang}
        code={code}
        hints={ex.hints}
        done={done}
        xp={xp}
        stdin={stdin}
        onRun={() => p.run(code, ex, reference, false)}
        onSubmit={() => p.run(code, ex, reference, true)}
        onSolution={() => p.revealSolution(() => setProgram(ex.lines.map((_, i) => i)))}
      />
    </div>
  );
}

/** Fill in the blanks of a program; checked by running it. */
export function FillExercise({ ex, lessonId, step, done, onComplete, xp }: Props<FillEx>) {
  const parts = useMemo(() => ex.template.replace(/\n$/, '').split(BLANK), [ex]);
  const [values, setValues] = useSaved<string[]>(`fill:${lessonId}#${step ?? 0}`, () => ex.answers.map(() => ''));
  const p = usePuzzle(ex.lang, lessonId, done, ex.hints, onComplete);
  const fill = (vals: string[]) => parts.map((part, i) => part + (i < vals.length ? vals[i] : '')).join('') + '\n';
  const code = fill(values);
  const reference = fill(ex.answers);
  const stdin = 'stdin' in ex.check ? ex.check.stdin : undefined;

  return (
    <div className="code-ex fill">
      <div className="ex-prompt">
        <span className="tag">✏️ {LANG_LABEL[ex.lang]} · fill in the blanks</span>
        <Markdown source={ex.prompt} />
      </div>
      <pre className="fill-code">
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < ex.answers.length && (
              <input
                className="blank"
                aria-label={`Blank ${i + 1}`}
                value={values[i] ?? ''}
                spellCheck={false}
                style={{ width: `${Math.max(4, ex.answers[i].length, (values[i] ?? '').length) + 2}ch` }}
                onChange={(e) => setValues(values.map((v, j) => (j === i ? e.target.value : v)))}
                onKeyDown={(e) => { if (e.key === 'Enter') p.run(code, ex, reference, true); }}
              />
            )}
          </span>
        ))}
      </pre>
      <PuzzleFooter
        p={p}
        lang={ex.lang}
        code={code}
        hints={ex.hints}
        done={done}
        xp={xp}
        stdin={stdin}
        onRun={() => p.run(code, ex, reference, false)}
        onSubmit={() => p.run(code, ex, reference, true)}
        onSolution={() => p.revealSolution(() => setValues([...ex.answers]))}
      />
    </div>
  );
}
