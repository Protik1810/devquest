import { Link } from 'react-router-dom';
import { questsFor, useDaily, useGame } from '../engine/store';
import { levelFromXp, rankFor, today } from '../engine/levels';
import { useState } from 'react';
import { dueDrillCount } from '../engine/drills';
import { ALL_CARDS, ALL_LESSONS, TRACKS, trackArt } from '../content';
import { cfgFor, isConfigured } from '../engine/providers';
import { nextLesson, trackProgress, tracksProgress } from '../content/progress';
import { focusPath, focusTracks } from '../content/focus';
import { Ring } from '../components/Ring';
import { CHALLENGES } from '../content/dojo';

function Heatmap({ log }: { log: Record<string, number> }) {
  const weeks = 16;
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - (weeks * 7 - 1) - end.getDay());
  const cells = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = today(d);
    const v = log[key] ?? 0;
    const lvl = v === 0 ? 0 : v < 40 ? 1 : v < 100 ? 2 : v < 200 ? 3 : 4;
    cells.push(<div key={key} className={`hm l${lvl}`} title={`${key}: ${v} XP`} />);
  }
  return <div className="heatmap">{cells}</div>;
}

/** First-week checklist so new learners discover every part of the app. Hides itself when done or dismissed. */
function GettingStarted() {
  const s = useGame();
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem('dq-hide-start') === '1';
    } catch {
      return false;
    }
  });
  const ai = isConfigured(s.settings.provider, cfgFor(s.settings.provider, s.settings.providers[s.settings.provider]));
  const items: [boolean, string, string, string][] = [
    [!!s.completed['f-computer'], '🧩', 'Finish your first lesson', '/lesson/f-computer'],
    [!!s.completed['py-hello'], '🐍', 'Write your first Python program', '/lesson/py-hello'],
    [s.stats.commands > 0, '🐚', 'Run a command in the terminal', '/playground'],
    [Object.keys(s.completed).some((k) => k.startsWith('dojo-')), '🥋', 'Solve a Code Dojo challenge', '/dojo'],
    [ai, '🦉', 'Connect an AI tutor (cloud or local)', '/settings'],
    [s.stats.projectsGraded > 0, '🏗️', 'Submit a project for grading', '/projects'],
    [s.stats.reviews > 0, '🃏', 'Review your flashcards', '/review'],
  ];
  const done = items.filter((i) => i[0]).length;
  if (hidden || done === items.length) return null;
  const hide = () => {
    try {
      localStorage.setItem('dq-hide-start', '1');
    } catch {
      /* fine: it just reappears next time */
    }
    setHidden(true);
  };
  return (
    <div className="card start-card">
      <div className="row">
        <h3 className="grow">🚀 Getting started ({done}/{items.length})</h3>
        <Link to="/guide" className="small">How DevQuest works →</Link>
        <button className="ghost small" onClick={hide} title="Hide">✕</button>
      </div>
      <ul className="start-list">
        {items.map(([ok, icon, label, to]) => (
          <li key={label} className={ok ? 'done' : ''}>
            <Link to={to}>
              <span>{ok ? '✅' : icon}</span> <b className="small">{label}</b>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

const NO_STRUGGLES: Record<string, number> = {};

/** Lessons and challenges with the most failed attempts: worth another go. */
function WeakSpots() {
  // A stable fallback: a new {} per render would make the store look changed forever (render loop)
  const struggles = useGame((s) => s.struggles) ?? NO_STRUGGLES;
  const completed = useGame((s) => s.completed);
  const items = Object.entries(struggles)
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([id, n]) => {
      const l = ALL_LESSONS.find((x) => x.lesson.id === id);
      if (l) return { id, n, title: l.lesson.title, icon: l.track.icon, to: `/lesson/${id}` };
      const c = CHALLENGES.find((x) => x.id === id);
      return c ? { id, n, title: c.title, icon: '🥋', to: `/dojo/${id}` } : null;
    })
    .filter((x): x is { id: string; n: number; title: string; icon: string; to: string } => !!x)
    .slice(0, 5);
  if (!items.length) return null;
  return (
    <div className="card">
      <h3>🎯 Practise your weak spots</h3>
      <p className="muted small">These took you several attempts. Revisiting them (and their flashcards) is the fastest way to make them stick.</p>
      <ul className="start-list">
        {items.map((i) => (
          <li key={i.id} className={completed[i.id] ? 'done' : ''}>
            <Link to={i.to}>
              <span>{i.icon}</span> <b className="small">{i.title}</b> <span className="muted small">· {i.n} tries</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Dashboard() {
  const s = useGame();
  const daily = useDaily();
  const lv = levelFromXp(s.xp);
  const rank = rankFor(lv.level);
  const path = focusPath(s.path);
  const mine = focusTracks(s.path);
  const mineP = tracksProgress(mine, s.completed);
  const next = nextLesson(s.completed, mine);
  const shown = mine.length ? mine : TRACKS;
  const quests = questsFor(today());
  const t = today();
  const dueCards = ALL_CARDS.filter((c) => s.completed[c.lesson.id] && (!s.srs[c.id] || s.srs[c.id].due <= t)).length;
  const dueCode = dueDrillCount(s);
  const totalLessons = TRACKS.reduce((a, tr) => a + tr.lessons.length, 0);
  const doneLessons = ALL_LESSONS.filter(({ lesson }) => s.completed[lesson.id]).length;
  const activeToday = s.streak.last === t;

  return (
    <div className="dashboard">
      <h1>
        Welcome back, {s.name}! {rank.emoji}
      </h1>
      <p className="muted">
        {activeToday ? "You've kept your streak alive today. Nice! 🔥" : s.streak.count ? `Complete a lesson today to keep your ${s.streak.count}-day streak!` : 'Complete a lesson to start a streak!'}
      </p>

      <GettingStarted />

      {path ? (
        <Link to="/path" className="card path-banner" style={{ borderColor: path.color }}>
          <Ring pct={mineP.pct} size={56} color={path.color} label={path.icon} />
          <div className="grow">
            <div className="muted small">{s.path!.id.startsWith('lang:') ? 'Your language focus' : 'Your career path'}</div>
            <b>{path.title}</b>
            <div className="muted small">{mineP.done}/{mineP.total} lessons · {Math.round(mineP.pct * 100)}%</div>
          </div>
          <span className="primary-btn">Roadmap →</span>
        </Link>
      ) : (
        <Link to="/paths" className="card path-banner">
          <span className="path-icon">🧭</span>
          <div className="grow">
            <b>{s.path === undefined ? 'Choose your path' : 'Exploring freely'}</b>
            <div className="muted small">Pick a career path or one language and DevQuest shows only what you need.</div>
          </div>
          <span className="primary-btn">Choose →</span>
        </Link>
      )}

      <div className="grid-3">
        <div className="card hero-card">
          <div className="row">
            <Ring pct={lv.progress} size={84} label={`Lv ${lv.level}`} />
            <div>
              <div className="big">{rank.name}</div>
              <div className="muted small">
                {lv.into}/{lv.span} XP to level {lv.level + 1}
              </div>
              {rank.nextName && <div className="muted small">Next rank: {rank.nextName} at Lv {rank.nextLevel}</div>}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="stat-row">
            <div><div className="big">🔥 {s.streak.count}</div><div className="muted small">day streak (best {s.streak.best})</div></div>
            <div><div className="big">🧊 {s.freezes}</div><div className="muted small">freezes</div></div>
          </div>
          <div className="stat-row">
            <div><div className="big">📘 {doneLessons}/{totalLessons}</div><div className="muted small">lessons</div></div>
            <div><div className="big">🏆 {Object.keys(s.achievements).length}</div><div className="muted small">badges</div></div>
          </div>
        </div>
        <div className="card">
          <h3>📅 Daily quests</h3>
          {quests.map((q) => {
            const prog = Math.min(daily[q.key], q.goal);
            const claimed = daily.claimed.includes(q.id);
            return (
              <div key={q.id} className="quest">
                <span>{q.emoji}</span>
                <div className="quest-main">
                  <div className="small">{q.title}</div>
                  <div className="qbar"><div style={{ width: `${(prog / q.goal) * 100}%` }} /></div>
                </div>
                {claimed ? (
                  <span className="muted small">✔</span>
                ) : prog >= q.goal ? (
                  <button className="primary small" onClick={() => s.claimQuest(q.id)}>+{q.gems}💎</button>
                ) : (
                  <span className="muted small">{prog}/{q.goal}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid-2">
        {next ? (
          <Link to={`/lesson/${next.lesson.id}`} className="card continue" style={{ borderColor: next.track.color }}>
            <div className="muted small">Continue learning</div>
            <div className="big">
              {next.track.icon} {next.lesson.title}
            </div>
            <div className="muted small">{next.track.title}</div>
            <span className="primary-btn">Start lesson →</span>
          </Link>
        ) : (
          <div className="card continue">🎓 You've completed every lesson. Legendary!</div>
        )}
        <Link to={dueCode && !dueCards ? '/review?tab=drills' : '/review'} className="card continue">
          <div className="muted small">Spaced repetition</div>
          <div className="big">🃏 {dueCards} card{dueCards === 1 ? '' : 's'} · 💻 {dueCode} drill{dueCode === 1 ? '' : 's'} to review</div>
          <div className="muted small">Short daily reviews of ideas (flashcards) and skills (coding drills) lock them into long-term memory.</div>
          <span className="primary-btn">{dueCards || dueCode ? 'Review now →' : 'All caught up ✓'}</span>
        </Link>
      </div>

      <WeakSpots />

      <div className="card">
        <h3>📈 Activity</h3>
        <Heatmap log={s.xpLog} />
      </div>

      <div className="row">
        <h2 className="grow">{mine.length ? 'Your path tracks' : 'All tracks'}</h2>
        <Link to="/map" className="small">Full skill map →</Link>
      </div>
      <div className="track-grid">
        {shown.map((tr) => {
          const p = trackProgress(tr, s.completed);
          return (
            <Link key={tr.id} to={`/track/${tr.id}`} className="card track-card" style={{ borderTopColor: tr.color }}>
              <div className="track-thumb" style={{ backgroundImage: `url(${trackArt(tr.id)})` }} />
              <div className="row">
                <span className="track-icon">{tr.icon}</span>
                <div className="grow">
                  <b>{tr.title}</b>
                  <div className="muted small">{p.done}/{p.total} lessons</div>
                </div>
                <Ring pct={p.pct} size={42} color={tr.color} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
