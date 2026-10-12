import { useEffect, useMemo, useRef, useState } from 'react';
import type { TerminalExercise } from '../content/types';
import { HOME, Shell } from '../engine/shell';
import { useGame } from '../engine/store';
import { useLessonCtx } from '../engine/lessonCtx';

type Line = { kind: 'in' | 'out' | 'err' | 'sys'; text: string; cwd?: string };

const prettyCwd = (cwd: string) => (cwd.startsWith(HOME) ? '~' + cwd.slice(HOME.length) : cwd);

/** Simulated bash terminal with sequential missions checked after every command. */
export function Terminal({ ex, onComplete, done }: { ex?: TerminalExercise; onComplete?: (o: { hints: number }) => void; done?: boolean }) {
  const shell = useMemo(() => {
    const sh = new Shell();
    ex?.setup?.(sh);
    return sh;
  }, [ex]);
  const [lines, setLines] = useState<Line[]>([{ kind: 'sys', text: 'DevQuest simulated Linux terminal. Type `help` for commands. Safe sandbox, nothing touches your computer.' }]);
  const [input, setInput] = useState('');
  const [histIdx, setHistIdx] = useState(-1);
  const [mission, setMission] = useState(0);
  const [hints, setHints] = useState<Set<number>>(new Set());
  const [, force] = useState(0);
  const bump = useGame((s) => s.bump);
  const setCtx = useLessonCtx((s) => s.set);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const missions = ex?.missions ?? [];
  const finished = missions.length > 0 && mission >= missions.length;

  useEffect(() => {
    // Scroll only the terminal box, not the whole page
    const box = endRef.current?.parentElement;
    if (box) box.scrollTop = box.scrollHeight;
  }, [lines]);
  useEffect(() => {
    setCtx({ code: `Terminal history:\n${shell.history.slice(-15).join('\n')}\nCurrent mission: ${missions[mission]?.task ?? 'all done'}` });
  }, [lines, mission, missions, setCtx, shell]);

  const submit = () => {
    const cmd = input;
    setInput('');
    setHistIdx(-1);
    const cwd = shell.cwd;
    const out = shell.exec(cmd);
    if (cmd.trim()) bump('commands');
    if (out === '\x1bclear') {
      setLines([]);
      return;
    }
    const next: Line[] = [...lines, { kind: 'in', text: cmd, cwd }];
    if (out) next.push({ kind: out.startsWith('bash:') ? 'err' : 'out', text: out });
    let m = mission;
    while (m < missions.length && missions[m].check(shell, cmd)) {
      next.push({ kind: 'sys', text: `✅ Mission ${m + 1} complete: ${missions[m].task}` });
      m++;
      // only one mission per command unless the next is already satisfied by state
      if (m < missions.length && !missions[m].check(shell, '')) break;
    }
    if (m !== mission) {
      setMission(m);
      if (m >= missions.length && missions.length) {
        next.push({ kind: 'sys', text: '🏆 All missions complete!' });
        onComplete?.({ hints: hints.size });
      }
    }
    setLines(next);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const h = shell.history;
    if (e.key === 'Enter') submit();
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const i = histIdx < 0 ? h.length - 1 : Math.max(0, histIdx - 1);
      if (h[i] !== undefined) (setHistIdx(i), setInput(h[i]));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const i = histIdx + 1;
      if (histIdx >= 0 && i < h.length) (setHistIdx(i), setInput(h[i]));
      else (setHistIdx(-1), setInput(''));
    } else if (e.key === 'Tab') {
      e.preventDefault();
      setInput(complete(shell, input));
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  return (
    <div className="term-wrap">
      {ex && (
        <div className="missions">
          <div className="ex-prompt">
            <span className="tag">🐚 Terminal</span> {ex.prompt}
          </div>
          <ol>
            {missions.map((m, i) => (
              <li key={i} className={i < mission ? 'done' : i === mission ? 'cur' : 'todo'}>
                <span className="m-icon">{i < mission ? '✅' : i === mission ? '👉' : '⬜'}</span>
                <span className="m-text">{m.task}</span>
                {i === mission && !finished && (
                  <button className="ghost small" onClick={() => { if (!hints.has(i)) bump('hints'); setHints(new Set(hints).add(i)); force((x) => x + 1); }}>
                    {hints.has(i) ? <code>{m.hint}</code> : '💡 hint'}
                  </button>
                )}
              </li>
            ))}
          </ol>
          {finished && <div className="feedback ok">🏆 All missions complete! {done ? '' : 'XP awarded.'}</div>}
        </div>
      )}
      <div className="terminal" onClick={() => inputRef.current?.focus()}>
        {lines.map((l, i) =>
          l.kind === 'in' ? (
            <div key={i}>
              <span className="prompt">dev@devquest:{prettyCwd(l.cwd!)}$</span> {l.text}
            </div>
          ) : (
            <pre key={i} className={l.kind}>{l.text}</pre>
          ),
        )}
        <div className="input-line">
          <span className="prompt">dev@devquest:{prettyCwd(shell.cwd)}$</span>
          <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey} spellCheck={false} autoCapitalize="off" autoComplete="off" aria-label="terminal input" />
        </div>
        <div ref={endRef} />
      </div>
    </div>
  );
}

/** Tab-complete the last word against file names in the relevant directory. */
function complete(sh: Shell, input: string) {
  const parts = input.split(' ');
  const word = parts.pop() ?? '';
  const slash = word.lastIndexOf('/');
  const dirPart = slash >= 0 ? word.slice(0, slash + 1) : '';
  const prefix = word.slice(slash + 1);
  const node = sh.get(sh.resolve(dirPart || '.'));
  if (!node || node.type !== 'dir') return input;
  const matches = Object.keys(node.children).filter((n) => n.startsWith(prefix));
  if (matches.length !== 1) return input;
  const m = matches[0];
  const isDir = node.children[m].type === 'dir';
  return [...parts, dirPart + m + (isDir ? '/' : '')].join(' ');
}
