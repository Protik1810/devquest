import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LANGUAGE_TRACKS, trackArt } from '../content';
import { trackProgress } from '../content/progress';
import type { CodeLang, NativeLang } from '../content/types';
import { useGame } from '../engine/store';
import { hasToolBridge, INSTALL_URL, runsInApp, useTools } from '../engine/localRun';
import { useAIReady } from '../engine/ai';
import { Ring } from '../components/Ring';

/** Broad career areas for filtering; each matches a language when any of its field tags fits. */
const AREAS: [string, RegExp][] = [
  ['All', /./],
  ['Web', /frontend|full-stack|web(?!3)|backend|node|cms|e-commerce/i],
  ['Mobile', /mobile|android|ios/i],
  ['Data & AI', /data|statistic|research|\bai\b/i],
  ['Systems', /systems|embedded|operating|performance|cli/i],
  ['DevOps & Cloud', /devops|cloud|linux|automation/i],
  ['Games', /game|modding/i],
  ['Security', /security/i],
  ['Blockchain', /blockchain|smart|web3/i],
];

function RuntimeBadge({ lang }: { lang: CodeLang }) {
  const tools = useTools((s) => s.langs);
  const ai = useAIReady();
  if (runsInApp(lang)) return <span className="rt rt-app">⚡ runs in DevQuest</span>;
  const local = tools[lang as NativeLang];
  if (local) return <span className="rt rt-local" title={local.tool}>⚙️ {local.tool.length > 34 ? local.tool.slice(0, 34) + '…' : local.tool}</span>;
  return (
    <span className="rt rt-ai">
      {ai ? '🤖 AI-checked' : '📝 self-check'}
      {hasToolBridge && (
        <>
          {' · '}
          <a href={INSTALL_URL[lang as NativeLang]} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>install</a>
        </>
      )}
    </span>
  );
}

export function Languages() {
  const completed = useGame((s) => s.completed);
  const focus = useGame((s) => s.path);
  const setPath = useGame((s) => s.setPath);
  const refresh = useTools((s) => s.refresh);
  const nav = useNavigate();
  const [field, setField] = useState('All');
  const re = AREAS.find(([a]) => a === field)![1];
  const list = LANGUAGE_TRACKS.filter((t) => (t.fields ?? []).some((f) => re.test(f)));

  return (
    <div>
      <h1>🔤 Languages</h1>
      <p className="muted">
        {LANGUAGE_TRACKS.length} languages, each with hands-on lessons and a mini project. Filter by the field you're interested in. <Link to="/paths">Career paths</Link> pick the right ones for you.
      </p>
      <div className="tabs">
        {AREAS.map(([f]) => (
          <button key={f} className={field === f ? 'active' : ''} onClick={() => setField(f)}>{f}</button>
        ))}
      </div>
      {hasToolBridge && (
        <p className="small muted">
          ⚙️ The desktop app runs compiled languages with the toolchains installed on this computer. <button className="ghost small" onClick={() => refresh(true)}>↻ Re-scan installed compilers</button>
        </p>
      )}
      <div className="lang-grid">
        {list.map((t) => {
          const p = trackProgress(t, completed);
          const focused = focus?.id === `lang:${t.id}`;
          return (
            <div key={t.id} className="card lang-card" style={{ ['--c' as string]: t.color }}>
              <Link to={`/track/${t.id}`} className="lang-cover" aria-label={`${t.title} track`} style={{ backgroundImage: `url(${trackArt(t.id)})` }}>
                <Ring pct={p.pct} size={42} color={t.color} label={t.icon} />
              </Link>
              <div className="lang-body">
                <Link to={`/track/${t.id}`}><b>{t.title}</b></Link>
                <p className="small muted">{t.blurb}</p>
                <div className="chips">{(t.fields ?? []).map((f) => <span key={f} className="lang-chip">{f}</span>)}</div>
                <div className="row small">
                  <RuntimeBadge lang={t.lang!} />
                  <span className="spacer" />
                  <span className="muted">{p.done}/{p.total}</span>
                </div>
                <button className={focused ? '' : 'ghost'} disabled={focused} onClick={() => { setPath(`lang:${t.id}`); nav('/path'); }}>
                  {focused ? '✓ Your focus' : '🎯 Focus on this language'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
