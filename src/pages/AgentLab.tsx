import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGame } from '../engine/store';
import { currentAI, useAIReady } from '../engine/ai';
import { levelFromXp } from '../engine/levels';
import { toast } from '../engine/toast';
import { hasToolBridge } from '../engine/localRun';
import { focusPath, focusTracks } from '../content/focus';
import { langLabel } from '../content/langMeta';
import type { CodeLang } from '../content/types';
import { Markdown } from '../components/Markdown';
import { Editor, WebPreview } from '../components/Editor';
import { Sandbox, langOfPath } from '../engine/agent/sandbox';
import { MODES, runAgent, type AgentMode, type LearnerContext } from '../engine/agent/agent';
import { useAgent, type TermLine } from '../engine/agent/store';
import type { AgentMsg, ToolCall, ToolResult } from '../engine/agent/llm';
import type { ToolHost } from '../engine/agent/tools';

type Pending =
  | { kind: 'approve'; title: string; detail: string; code?: string; session?: boolean; resolve: (ok: boolean, session?: boolean) => void }
  | { kind: 'ask'; question: string; choices: string[]; resolve: (answer: string) => void };

const TOOL_ICON: Record<string, string> = { list_files: '📂', read_file: '👀', write_file: '📝', edit_file: '✏️', delete_file: '🗑️', run_command: '▶️', ask_learner: '❓', open_file: '📄' };

function toolSummary(c: ToolCall) {
  const a = c.input as Record<string, string>;
  switch (c.name) {
    case 'list_files': return `Listed ${a.path || 'the workspace'}`;
    case 'read_file': return `Read ${a.path}`;
    case 'write_file': return `Wrote ${a.path}`;
    case 'edit_file': return `Edited ${a.path}`;
    case 'delete_file': return `Deleted ${a.path}`;
    case 'run_command': return a.command;
    case 'ask_learner': return 'Asked you a question';
    case 'open_file': return `Opened ${a.path}`;
    default: return c.name;
  }
}

function ToolCard({ call, result, live }: { call: ToolCall; result?: ToolResult; live: boolean }) {
  const a = call.input as Record<string, string>;
  const detail =
    call.name === 'write_file' ? a.content :
    call.name === 'edit_file' ? `- ${String(a.old_text ?? '').split('\n').join('\n- ')}\n+ ${String(a.new_text ?? '').split('\n').join('\n+ ')}` :
    call.name === 'ask_learner' ? `${a.question}\n\n${result?.output ?? ''}` :
    result?.output;
  const status = result ? (result.isError ? '⚠️' : '✓') : live ? <span className="spinner" /> : '·';
  return (
    <details className={`tool-card ${result?.isError ? 'err' : ''}`}>
      <summary>
        <span>{TOOL_ICON[call.name] ?? '🔧'}</span>
        <code className={call.name === 'run_command' ? 'cmd' : ''}>{toolSummary(call)}</code>
        <span className="tool-status">{status}</span>
      </summary>
      {detail && <pre>{detail.length > 6000 ? detail.slice(0, 6000) + '\n…' : detail}</pre>}
      {call.name !== 'write_file' && call.name !== 'ask_learner' && result && call.name !== 'run_command' && detail !== result.output && <pre>{result.output}</pre>}
    </details>
  );
}

function ChatMessage({ m, results, live }: { m: AgentMsg; results: Map<string, ToolResult>; live: boolean }) {
  if (m.role === 'tool') return null;
  if (m.role === 'user') return <div className="agent-msg user">{m.display ?? m.text}</div>;
  return (
    <div className="agent-msg owl">
      {m.text.trim() && <Markdown source={m.text} untrusted />}
      {m.calls.map((c) => <ToolCard key={c.id} call={c} result={results.get(c.id)} live={live} />)}
    </div>
  );
}

function Terminal({ lines, onRun, busy }: { lines: TermLine[]; onRun: (cmd: string) => void; busy: boolean }) {
  const [cmd, setCmd] = useState('');
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (box.current) box.current.scrollTop = box.current.scrollHeight;
  }, [lines]);
  return (
    <div className="agent-term">
      <div className="agent-term-out" ref={box} tabIndex={0} role="log" aria-label="Terminal output">
        {lines.length === 0 && <div className="muted">Sandbox terminal. Try <code>ls</code>, <code>cat README.md</code> or <code>python hello.py</code>.</div>}
        {lines.map((l, i) => (
          <div key={i} className={`tl ${l.by}`}>
            {l.cmd !== undefined && (
              <div className="tl-cmd">
                <span className="who">{l.by === 'owl' ? '🦉' : '🧑'}</span> $ {l.cmd}
              </div>
            )}
            {l.text && <pre className={l.ok === false ? 'bad' : ''}>{l.text}</pre>}
          </div>
        ))}
      </div>
      <form
        className="agent-term-in"
        onSubmit={(e) => {
          e.preventDefault();
          if (!cmd.trim() || busy) return;
          onRun(cmd);
          setCmd('');
        }}
      >
        <span>$</span>
        <input value={cmd} onChange={(e) => setCmd(e.target.value)} placeholder="type a command…" spellCheck={false} autoCapitalize="off" aria-label="Terminal command" />
      </form>
    </div>
  );
}

export function AgentLab() {
  const ag = useAgent();
  const game = useGame();
  const aiReady = useAIReady();
  const sb = useMemo(() => new Sandbox(useAgent.getState().files), []);
  const [running, setRunning] = useState(false);
  const [stream, setStream] = useState('');
  const [liveCall, setLiveCall] = useState<ToolCall | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'chat' | 'code' | 'term'>('chat');
  const [preview, setPreview] = useState(false);
  const [termBusy, setTermBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  /** "Allow for this session" lasts 15 minutes and ends when the mode changes. */
  const nativeSession = useRef<{ until: number; mode: AgentMode } | null>(null);
  const chatEnd = useRef<HTMLDivElement>(null);
  const lastTermSent = useRef(ag.terminal.length);

  const results = useMemo(() => {
    const map = new Map<string, ToolResult>();
    for (const m of ag.messages) if (m.role === 'tool') for (const r of m.results) map.set(r.id, r);
    return map;
  }, [ag.messages]);

  useEffect(() => {
    const box = chatEnd.current?.parentElement;
    if (box) box.scrollTop = box.scrollHeight;
  }, [ag.messages, stream, pending, liveCall]);

  const syncFiles = () => useAgent.getState().setFiles(sb.files());

  const ask = <T,>(p: Pending) => new Promise<T>((resolve) => setPending({ ...p, resolve: (v: unknown, s?: boolean) => { setPending(null); (p.resolve as (v: unknown, s?: boolean) => void)(v, s); resolve(v as T); } } as Pending));

  const approveNative = async (lang: CodeLang, path: string) => {
    const ns = nativeSession.current;
    if (ns && ns.until > Date.now() && ns.mode === useAgent.getState().mode) return true;
    nativeSession.current = null;
    let session = false;
    let code = '';
    try {
      code = sb.read(path);
    } catch {
      /* shown as empty */
    }
    const ok = await ask<boolean>({
      kind: 'approve',
      title: `Run ${path} with your ${langLabel(lang)} toolchain?`,
      detail: 'This compiles and runs a real program on your computer (in a temporary folder, with a time limit). Read the code below before allowing it.',
      code,
      session: true,
      resolve: (_ok, s) => {
        session = !!s;
      },
    });
    if (ok && session) nativeSession.current = { until: Date.now() + 15 * 60_000, mode: useAgent.getState().mode };
    return ok;
  };

  const host: ToolHost = {
    sandbox: sb,
    isProtected: (p) => (useAgent.getState().mode === 'tutor' || useAgent.getState().mode === 'debug') && useAgent.getState().learnerFiles.includes(p),
    approveChange: (path, action) =>
      ask<boolean>({ kind: 'approve', title: `Let Owl ${action} ${path}?`, detail: 'You wrote this file. In this mode Owl asks before changing your work.', resolve: () => {} }),
    approveNative,
    askLearner: (question, choices) => ask<string>({ kind: 'ask', question, choices, resolve: () => {} }),
    openFile: (p) => useAgent.getState().setOpenPath(p),
    onCommand: (cmd, text, ok) => useAgent.getState().addTerminal({ by: 'owl', cmd, text, ok }),
    onFilesChanged: syncFiles,
  };

  const learnerContext = (): LearnerContext => {
    const tracks = focusTracks(game.path);
    return {
      name: game.name,
      level: levelFromXp(game.xp).level,
      path: focusPath(game.path)?.title,
      languages: [...new Set(tracks.filter((t) => t.kind === 'language').map((t) => t.title))].slice(0, 6),
      lessonsDone: Object.keys(game.completed).length,
    };
  };

  const send = async (text: string) => {
    const ai = currentAI();
    if (!text.trim() || running || !ai.ready) return;
    setError('');
    setInput('');
    setTab('chat');
    // Give Owl what the learner did since the last message: their open file and terminal commands
    const st = useAgent.getState();
    const newTerm = st.terminal.slice(lastTermSent.current).filter((l) => l.by === 'you');
    lastTermSent.current = st.terminal.length;
    const ctx = [
      `[Mode: ${MODES[st.mode].title}]`,
      st.openPath ? `[The learner has ${st.openPath} open in the editor${st.learnerFiles.includes(st.openPath) ? ' and has edited it' : ''}]` : '',
      newTerm.length ? `[The learner's terminal since your last reply]\n${newTerm.slice(-12).map((l) => `$ ${l.cmd}\n${l.text.slice(0, 600)}`).join('\n')}` : '',
    ].filter(Boolean);
    st.addMessage({ role: 'user', text: `${text}\n\n${ctx.join('\n')}`, display: text });

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setRunning(true);
    const key = `${ai.provider}:${ai.cfg.model}`;
    try {
      await runAgent({
        provider: ai.provider,
        cfg: ai.cfg,
        mode: st.mode,
        ctx: learnerContext(),
        protocol: st.effectiveProtocol(key),
        messages: useAgent.getState().messages,
        host,
        signal: ctrl.signal,
        events: {
          onMessage: (m) => {
            setStream('');
            useAgent.getState().addMessage(m);
          },
          onText: (d) => setStream((s) => s + d),
          onToolStart: (c) => setLiveCall(c),
          onToolEnd: () => setLiveCall(null),
          onUsage: (u) => useAgent.getState().addUsage(u),
          onProtocol: () => {
            useAgent.getState().rememberTextOnly(key);
            toast({ kind: 'info', title: '🔧 Switched to text tool calls', body: "This model doesn't support native tool calling, so Owl now calls tools through the prompt." });
          },
        },
      });
      game.bump('agentTurns');
    } catch (e) {
      if ((e as Error).name !== 'AbortError' && !ctrl.signal.aborted) setError((e as Error).message || String(e));
    } finally {
      setRunning(false);
      setStream('');
      setLiveCall(null);
      abortRef.current = null;
    }
  };

  const stop = () => {
    abortRef.current?.abort();
    if (pending) {
      if (pending.kind === 'ask') pending.resolve('(The learner stopped Owl instead of answering.)');
      else pending.resolve(false);
    }
  };

  const runInTerminal = async (cmd: string) => {
    setTermBusy(true);
    const before = new Set(Object.keys(sb.files()));
    const r = await sb.exec(cmd, { approveNative });
    setTermBusy(false);
    const st = useAgent.getState();
    if (r.clear) st.clearTerminal();
    else st.addTerminal({ by: 'you', cmd, text: r.output, ok: r.ok });
    for (const f of Object.keys(sb.files())) if (!before.has(f)) st.markLearnerFile(f);
    syncFiles();
    game.bump('commands');
  };

  // ----- editor -----
  const open = ag.openPath && ag.openPath in ag.files ? ag.openPath : null;
  const [draft, setDraft] = useState(open ? ag.files[open] : '');
  useEffect(() => setDraft(open ? useAgent.getState().files[open] ?? '' : ''), [open, ag.files]);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const edit = (v: string) => {
    if (!open) return;
    setDraft(v);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      sb.write(open, v);
      useAgent.getState().markLearnerFile(open);
      syncFiles();
    }, 300);
  };
  const openLang: CodeLang = (open && langOfPath(open)) || 'python';
  const newFile = () => {
    const name = prompt('New file name (e.g. main.py, notes.md, app/index.html):')?.trim();
    if (!name) return;
    try {
      if (sb.isFile(name)) throw new Error(`${name} already exists`);
      sb.write(name, '');
      syncFiles();
      useAgent.getState().markLearnerFile(sb.rel(name));
      useAgent.getState().setOpenPath(sb.rel(name));
      setTab('code');
    } catch (e) {
      toast({ kind: 'error', title: 'Could not create file', body: (e as Error).message });
    }
  };
  const removeFile = (p: string) => {
    if (!confirm(`Delete ${p}?`)) return;
    sb.remove(p);
    syncFiles();
  };

  const modeInfo = MODES[ag.mode];
  const empty = ag.messages.length === 0;

  return (
    <div className="agent-lab">
      <div className="agent-head">
        <div className="grow">
          <h1>🧪 Agent Lab</h1>
          <p className="muted small">Owl, your AI mentor, can read and write files, run programs and use the terminal in a sandbox shared with you. You learn by watching, answering, and doing.</p>
        </div>
        <div className="agent-mode">
          {(Object.keys(MODES) as AgentMode[]).map((m) => (
            <button key={m} className={ag.mode === m ? 'active' : ''} onClick={() => ag.setMode(m)} disabled={running} title={MODES[m].blurb}>
              {MODES[m].icon} {MODES[m].title}
            </button>
          ))}
        </div>
      </div>

      <div className="sandbox-chips small">
        <span title="Files exist only inside DevQuest on this device">🔒 Virtual workspace</span>
        <span title="A simulated Bash shell: it cannot reach your real system">🐚 Simulated terminal</span>
        <span title="Python, JS, TS, Lua run in isolated workers without network or storage access, with a time limit">🚫🌐 No network in code runs</span>
        {hasToolBridge && <span title="Compiled languages run on your toolchains only after you approve">✋ Real programs need your OK</span>}
        <span title="Owl stops after this many steps per message">⏱ 24-step limit</span>
      </div>

      <div className="agent-tabs">
        {(['chat', 'code', 'term'] as const).map((t) => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
            {t === 'chat' ? '💬 Chat' : t === 'code' ? '📝 Files' : '🐚 Terminal'}
          </button>
        ))}
      </div>

      <div className="agent-grid">
        <section className={`card agent-chat ${tab === 'chat' ? 'show' : ''}`}>
          <div className="agent-msgs" tabIndex={0} role="log" aria-label="Conversation with Owl" aria-live="polite">
            {empty && (
              <div className="agent-empty">
                <h3>{modeInfo.icon} {modeInfo.title}</h3>
                <p className="small muted">{modeInfo.blurb}</p>
                <div className="starter-list">
                  {modeInfo.starters.map((s) => (
                    <button key={s} className="ghost" disabled={!aiReady || running} onClick={() => send(s)}>{s}</button>
                  ))}
                </div>
              </div>
            )}
            {ag.messages.map((m, i) => <ChatMessage key={i} m={m} results={results} live={running && i >= ag.messages.length - 2} />)}
            {stream && <div className="agent-msg owl"><Markdown source={stream} untrusted /></div>}
            {liveCall && <div className="agent-msg owl"><ToolCard call={liveCall} live /></div>}
            {running && !stream && !liveCall && !pending && <div className="muted small thinking">🦉 Owl is thinking…</div>}
            {pending?.kind === 'approve' && (
              <div className="agent-approve">
                <b>✋ {pending.title}</b>
                <p className="small">{pending.detail}</p>
                {pending.code !== undefined ? (
                  <pre className="small">{pending.code.slice(0, 4000) || '(empty file)'}</pre>
                ) : (
                  liveCall && liveCall.name !== 'run_command' && <pre className="small">{JSON.stringify(liveCall.input, null, 2).slice(0, 1500)}</pre>
                )}
                <div className="row">
                  <button className="primary" onClick={() => pending.resolve(true)}>Allow once</button>
                  {pending.session && <button onClick={() => pending.resolve(true, true)}>Allow for 15 minutes</button>}
                  <button className="ghost" onClick={() => pending.resolve(false)}>Deny</button>
                </div>
              </div>
            )}
            {pending?.kind === 'ask' && <AskCard q={pending} />}
            {error && (
              <div className="agent-error small">
                ⚠️ {error} <Link to="/settings">Check AI settings</Link>
              </div>
            )}
            <div ref={chatEnd} />
          </div>
          {aiReady ? (
            <form
              className="agent-input"
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void send(input);
                  }
                }}
                placeholder={running ? 'Owl is working…' : `Message Owl (${modeInfo.title})`}
                rows={2}
                disabled={running}
              />
              {running ? <button type="button" className="danger" onClick={stop}>■ Stop</button> : <button className="primary" disabled={!input.trim()}>Send</button>}
            </form>
          ) : (
            <div className="agent-input-off small">
              Connect an AI provider (cloud or local) in <Link to="/settings">Settings → AI tutor</Link> to work with Owl. The workspace and terminal work without it.
            </div>
          )}
          <div className="row small agent-foot">
            <span className="muted grow">
              {currentAI().label} · {ag.effectiveProtocol(`${currentAI().provider}:${currentAI().cfg.model}`) === 'text' ? 'text tool calls' : 'native tool calls'}
              {ag.usage?.calls ? ` · ${ag.usage.calls} model calls, ${(ag.usage.input / 1000).toFixed(1)}k in / ${(ag.usage.output / 1000).toFixed(1)}k out tokens` : ''}
            </span>
            <select value={ag.protocol} onChange={(e) => ag.setProtocol(e.target.value as 'auto' | 'text')} title="How Owl calls tools" disabled={running}>
              <option value="auto">Tools: auto</option>
              <option value="text">Tools: text protocol</option>
            </select>
            <button className="ghost small" disabled={running || empty} onClick={() => ag.newChat()}>🗨️ New chat</button>
          </div>
        </section>

        <div className="agent-side">
          <section className={`card agent-files ${tab === 'code' ? 'show' : ''}`}>
            <div className="file-bar">
              {Object.keys(ag.files).map((p) => (
                <span key={p} className={`file-chip ${p === open ? 'active' : ''}`}>
                  <button className="link" onClick={() => useAgent.getState().setOpenPath(p)} title={ag.learnerFiles.includes(p) ? 'You edited this file' : 'Created by Owl'}>
                    {ag.learnerFiles.includes(p) ? '🧑' : '🦉'} {p}
                  </button>
                  <button className="link x" onClick={() => removeFile(p)} aria-label={`Delete ${p}`}>✕</button>
                </span>
              ))}
              <button className="ghost small" onClick={newFile}>＋ New file</button>
            </div>
            {open ? (
              <>
                <div className="row small file-tools">
                  <b className="grow">{open}</b>
                  {openLang === 'web' && <button className="ghost small" onClick={() => setPreview(!preview)}>{preview ? '📝 Code' : '👁 Preview'}</button>}
                  {langOfPath(open) && (
                    <button className="small" disabled={termBusy} onClick={() => { setTab('term'); void runInTerminal(`run ${open}`); }}>▶ Run</button>
                  )}
                </div>
                {preview && openLang === 'web' ? <WebPreview code={draft} height={360} /> : <Editor lang={openLang} value={draft} onChange={edit} height="360px" onRun={() => void runInTerminal(`run ${open}`)} />}
              </>
            ) : (
              <p className="muted small">Pick a file above, or create one.</p>
            )}
          </section>
          <section className={`card agent-terminal ${tab === 'term' ? 'show' : ''}`}>
            <div className="row small">
              <b className="grow">🐚 Terminal</b>
              <button className="ghost small" onClick={() => useAgent.getState().clearTerminal()}>Clear</button>
              <button className="ghost small" disabled={running} onClick={() => { if (confirm('Reset the workspace? All files, the chat and the terminal are cleared.')) { useAgent.getState().resetWorkspace(); location.reload(); } }}>♻️ Reset workspace</button>
            </div>
            <Terminal lines={ag.terminal} onRun={(c) => void runInTerminal(c)} busy={termBusy} />
          </section>
        </div>
      </div>
    </div>
  );
}

function AskCard({ q }: { q: Extract<Pending, { kind: 'ask' }> }) {
  const [text, setText] = useState('');
  return (
    <div className="agent-ask">
      <Markdown source={`❓ ${q.question}`} untrusted />
      {q.choices.length > 0 && (
        <div className="ask-choices">
          {q.choices.map((c, i) => (
            <button key={i} onClick={() => q.resolve(c)}>{String.fromCharCode(65 + i)}. {c}</button>
          ))}
        </div>
      )}
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) q.resolve(text.trim());
        }}
      >
        <input className="grow" value={text} onChange={(e) => setText(e.target.value)} placeholder={q.choices.length ? 'or type your own answer…' : 'Your answer…'} autoFocus />
        <button className="primary" disabled={!text.trim()}>Answer</button>
      </form>
    </div>
  );
}
