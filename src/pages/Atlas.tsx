import { useMemo, useState } from 'react';
import { COMMANDS } from '../content/commands';

const COLS = [
  ['linux', '🐧 Linux (bash)'],
  ['mac', '🍎 macOS (zsh)'],
  ['ps', '🪟 PowerShell'],
  ['cmd', '⬛ cmd.exe'],
] as const;

export function Atlas() {
  const [q, setQ] = useState('');
  const [show, setShow] = useState<Record<string, boolean>>({ linux: true, mac: true, ps: true, cmd: true });
  const [copied, setCopied] = useState('');
  const query = q.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      COMMANDS.map((cat) => ({
        ...cat,
        cmds: cat.cmds.filter((c) => !query || [c.task, c.linux, c.mac, c.ps, c.cmd, cat.name].some((x) => x?.toLowerCase().includes(query))),
      })).filter((c) => c.cmds.length),
    [query],
  );

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(text);
    setTimeout(() => setCopied(''), 1200);
  };

  const cols = COLS.filter(([k]) => show[k]);
  const total = COMMANDS.reduce((a, c) => a + c.cmds.length, 0);

  return (
    <div>
      <h1>📖 Command Atlas</h1>
      <p className="muted">
        {total} everyday tasks, side by side for every operating system. Click any command to copy it. Practise the Linux ones in the <a href="#/playground">Playground terminal</a>.
      </p>
      <div className="atlas-controls">
        <input className="search" placeholder="🔍 Search: e.g. kill, port, zip, grep, env…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="toggles">
          {COLS.map(([k, label]) => (
            <label key={k} className="toggle">
              <input type="checkbox" checked={show[k]} onChange={(e) => setShow({ ...show, [k]: e.target.checked })} /> {label}
            </label>
          ))}
        </div>
      </div>
      {filtered.map((cat) => (
        <section key={cat.name} className="card atlas-cat">
          <h3>
            {cat.emoji} {cat.name}
          </h3>
          <div className="table-wrap" tabIndex={0} role="region" aria-label="Commands table">
            <table className="atlas">
              <thead>
                <tr>
                  <th>Task</th>
                  {cols.map(([k, label]) => (
                    <th key={k}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cat.cmds.map((c) => (
                  <tr key={c.task}>
                    <td>
                      <b>{c.task}</b>
                      {c.note && <div className="muted small">{c.note}</div>}
                    </td>
                    {cols.map(([k]) => {
                      const v = k === 'mac' ? c.mac ?? c.linux : c[k];
                      return (
                        <td key={k}>
                          {v === '—' || v === 'same' ? (
                            <span className="muted">{v}</span>
                          ) : (
                            <code className={`cmd ${copied === v ? 'copied' : ''}`} onClick={() => copy(v)} title="Click to copy">
                              {v}
                            </code>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
      {!filtered.length && <p className="muted">No commands match "{q}".</p>}
    </div>
  );
}
