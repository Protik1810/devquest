import { useState } from 'react';
import type { TraceResult } from '../engine/runners';

/**
 * Step through a recorded Python run: the line about to run, every frame on the call stack with its variables
 * (changed ones highlighted), return values, exceptions and the output so far.
 */
export function TraceViewer({ code, trace, onClose }: { code: string; trace: TraceResult; onClose: () => void }) {
  const steps = trace.steps;
  const [i, setI] = useState(0);
  if (!steps.length)
    return (
      <div className="trace">
        <div className="trace-head">
          <b>👣 Step through</b>
          <span className="spacer" />
          <button className="ghost small" onClick={onClose} aria-label="Close step-through">✕</button>
        </div>
        <p className="bad small">{trace.error ?? 'Nothing ran.'}</p>
      </div>
    );
  const step = steps[i];
  const prev = i > 0 ? steps[i - 1] : undefined;
  const before = new Map<string, string>();
  prev?.frames.forEach((f, d) => f.vars.forEach(([k, v]) => before.set(`${d}:${f.name}:${k}`, v)));
  const lines = code.replace(/\n$/, '').split('\n');
  const go = (n: number) => setI(Math.max(0, Math.min(steps.length - 1, n)));
  const last = i === steps.length - 1;
  const current = step.frames[step.frames.length - 1];
  // The main program "returning" just means it reached the end
  const finished = step.event === 'return' && step.frames.length === 1;

  return (
    <div
      className="trace"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(i + 1);
        else if (e.key === 'ArrowLeft') go(i - 1);
        else return;
        e.preventDefault();
      }}
    >
      <div className="trace-head">
        <b>👣 Step through</b>
        <span className="muted small">Step {i + 1} of {steps.length}{trace.truncated ? ' (stopped after this many steps)' : ''}</span>
        <span className="spacer" />
        <button className="ghost small" onClick={onClose} aria-label="Close step-through">✕</button>
      </div>
      <div className="trace-controls">
        <button className="ghost small" onClick={() => go(0)} disabled={i === 0} aria-label="First step">⏮</button>
        <button onClick={() => go(i - 1)} disabled={i === 0}>◀ Back</button>
        <button className="primary" onClick={() => go(i + 1)} disabled={last}>Next ▶</button>
        <button className="ghost small" onClick={() => go(steps.length - 1)} disabled={last} aria-label="Last step">⏭</button>
        <input type="range" min={0} max={steps.length - 1} value={i} onChange={(e) => go(Number(e.target.value))} aria-label="Step" />
      </div>
      <div className="trace-body">
        <pre className="trace-code" aria-label="Program, with the current line marked">
          {lines.map((text, n) => {
            const ln = n + 1;
            const cur = ln === step.line;
            return (
              <div key={n} className={`tl${cur ? ' cur' : ''}${!cur && prev && ln === prev.line ? ' prev' : ''}`}>
                <span className="ln">{ln}</span>
                <span className="arrow">{cur ? (finished ? '🏁' : step.event === 'return' ? '↩' : step.event === 'exception' ? '⚠' : '➜') : ''}</span>
                {text || ' '}
              </div>
            );
          })}
        </pre>
        <div className="trace-side">
          {finished && <div className="trace-note">🏁 The program has finished. These are the final values.</div>}
          {step.event === 'return' && !finished && current && (
            <div className="trace-note">↩ <b>{current.name}</b> returns <code>{step.ret}</code></div>
          )}
          {step.event === 'exception' && <div className="trace-note bad">⚠ {step.exc}</div>}
          {step.frames.map((f, d) => (
            <div key={d} className={`trace-frame${d === step.frames.length - 1 ? ' top' : ''}`}>
              <div className="trace-frame-name">{f.name}{d > 0 ? <span className="muted small"> called on line {step.frames[d - 1].line}</span> : null}</div>
              {f.vars.length ? (
                <table>
                  <tbody>
                    {f.vars.map(([k, v]) => {
                      const was = before.get(`${d}:${f.name}:${k}`);
                      const changed = prev && was !== v;
                      return (
                        <tr key={k} className={changed ? 'changed' : ''}>
                          <td>{k}</td>
                          <td><code>{v}</code></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="muted small">no variables yet</div>
              )}
            </div>
          ))}
          <div className="trace-out">
            <div className="muted small">Output so far</div>
            <pre>{step.out || ' '}</pre>
          </div>
        </div>
      </div>
      {last && trace.error && <div className="trace-note bad">The program stopped with <code>{trace.error}</code></div>}
      <p className="muted small trace-help">
        ➜ marks the line about to run; the variables show their values before it runs. Changed values are highlighted. Lists, dictionaries and objects get a <code>#number</code>: two names with the same number refer to the <b>same</b> object. Use ← and → to step.
      </p>
    </div>
  );
}
