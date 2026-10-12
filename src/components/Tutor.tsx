import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { askTutor, TutorError, type ChatMsg } from '../engine/tutor';
import { cfgFor, isConfigured, providerDef } from '../engine/providers';
import { useGame } from '../engine/store';
import { useLessonCtx } from '../engine/lessonCtx';
import { Markdown } from './Markdown';

/** Floating Socratic tutor. Works with any configured cloud or local LLM provider. */
export function Tutor() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const provider = useGame((s) => s.settings.provider);
  const saved = useGame((s) => s.settings.providers[s.settings.provider]);
  const bump = useGame((s) => s.bump);
  const endRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const def = providerDef(provider);
  const cfg = cfgFor(provider, saved);
  const ready = isConfigured(provider, cfg);

  const send = async (text = input) => {
    if (!text.trim() || busy) return;
    const ctx = useLessonCtx.getState();
    const history: ChatMsg[] = [...msgs, { role: 'user', content: text }];
    setMsgs([...history, { role: 'assistant', content: '' }]);
    setInput('');
    setBusy(true);
    bump('tutorQuestions');
    const ac = new AbortController();
    abortRef.current = ac;
    let acc = '';
    try {
      await askTutor({
        provider,
        cfg,
        signal: ac.signal,
        context: `Lesson: ${ctx.title}\nExercise: ${ctx.prompt || '(reading)'}\nLearner's current code/state:\n${ctx.code || '(none)'}`,
        history,
        onText: (d) => {
          acc += d;
          setMsgs([...history, { role: 'assistant', content: acc }]);
          endRef.current?.parentElement?.scrollTo({ top: 1e9 });
        },
      });
      if (!acc) setMsgs([...history, { role: 'assistant', content: '_(empty reply)_' }]);
    } catch (e) {
      if ((e as Error).name === 'AbortError') {
        setMsgs([...history, { role: 'assistant', content: acc + '\n\n_(stopped)_' }]);
      } else {
        const status = e instanceof TutorError ? e.status : undefined;
        const msg = status === 401 || status === 403 ? `${def.name} rejected the API key. Check it in Settings.` : status === 429 ? 'Rate limited. Wait a moment and try again.' : (e as Error).message;
        setMsgs([...history, { role: 'assistant', content: `⚠️ ${msg}` }]);
      }
    } finally {
      abortRef.current = null;
      setBusy(false);
    }
  };

  return (
    <>
      <button className="tutor-fab" onClick={() => setOpen(!open)} title="Ask the Owl tutor">
        🦉
      </button>
      {open && (
        <div className="tutor">
          <div className="tutor-head">
            <div>
              <b>🦉 Owl, your Socratic tutor</b>
              {ready && (
                <div className="muted small">
                  {def.local ? '💻' : '☁️'} {def.name}
                  {cfg.model ? ` · ${cfg.model}` : ''}
                </div>
              )}
            </div>
            <div className="row">
              {msgs.length > 0 && !busy && <button className="ghost small" onClick={() => setMsgs([])} title="New chat">↺</button>}
              <button className="ghost small" onClick={() => setOpen(false)}>✕</button>
            </div>
          </div>
          {!ready ? (
            <div className="tutor-body">
              <p>Owl guides you with questions rather than handing over answers.</p>
              <p>
                Choose an AI provider in <Link to="/settings" onClick={() => setOpen(false)}>Settings</Link>: Claude, OpenAI, Gemini and others with your own API key, or a <b>free local model</b> through Ollama or LM Studio.
              </p>
              <p className="muted">Without one, use the 💡 hints on each exercise. They get more specific each time you ask.</p>
            </div>
          ) : (
            <>
              <div className="tutor-body">
                {msgs.length === 0 && (
                  <div className="tutor-suggest">
                    {["I'm stuck, give me a nudge", 'Explain this lesson more simply', 'What is wrong with my code?', 'Give me a real-world example'].map((s) => (
                      <button key={s} className="ghost small" onClick={() => send(s)}>{s}</button>
                    ))}
                  </div>
                )}
                {msgs.map((m, i) => (
                  <div key={i} className={`bubble ${m.role}`}>
                    {m.role === 'assistant' ? <Markdown source={m.content || '…'} untrusted /> : m.content}
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <div className="tutor-input">
                <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Ask Owl anything…" disabled={busy} />
                {busy ? (
                  <button onClick={() => abortRef.current?.abort()}>■ Stop</button>
                ) : (
                  <button className="primary" onClick={() => send()}>Send</button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
