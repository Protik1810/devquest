import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CHALLENGES } from '../content/dojo';
import { useGame } from '../engine/store';
import { CodeExercise } from '../components/CodeExercise';
import { LANG_LABEL } from '../components/Editor';
import { LANG_META } from '../content/langMeta';
import type { CodeLang } from '../content/types';

/** Languages that have Dojo challenges, in catalogue order. */
const LANGS = [...new Set(CHALLENGES.map((c) => c.exercise.lang))] as CodeLang[];

const DIFFS = ['All', 'Easy', 'Medium', 'Hard'] as const;

function Challenge({ id }: { id: string }) {
  const c = CHALLENGES.find((x) => x.id === id);
  const completed = useGame((s) => s.completed);
  const completeLesson = useGame((s) => s.completeLesson);
  const nav = useNavigate();
  if (!c) return <p>Challenge not found. <Link to="/dojo">Back to the Dojo</Link></p>;
  const done = !!completed[c.id];
  const idx = CHALLENGES.indexOf(c);
  const next = CHALLENGES.slice(idx + 1).find((x) => !completed[x.id]) ?? CHALLENGES.find((x) => !completed[x.id] && x.id !== c.id);
  return (
    <div>
      <Link to="/dojo" className="muted small">← Code Dojo</Link>
      <div className="row">
        <h1 className="grow">🥋 {c.title}</h1>
        <span className={`diff ${c.difficulty}`}>{c.difficulty}</span>
        <span className="chip">⭐ {c.xp} XP</span>
        {done && <span className="pill green">✓ solved</span>}
      </div>
      <div className="muted small">{c.tags.join(' · ')}</div>
      <div className="card">
        <CodeExercise
          key={c.id}
          ex={c.exercise}
          lessonId={c.id}
          title={c.title}
          xp={c.xp}
          done={done}
          onComplete={(o) => completeLesson(c.id, c.xp, { ...o, perfect: !o.hints && !o.solution && !o.scale })}
        />
      </div>
      {next && (
        <div className="lesson-nav">
          <span />
          <button className="primary" onClick={() => nav(`/dojo/${next.id}`)}>Next challenge: {next.title} →</button>
        </div>
      )}
    </div>
  );
}

export function Dojo() {
  const { id } = useParams();
  const completed = useGame((s) => s.completed);
  const nav = useNavigate();
  const [diff, setDiff] = useState<(typeof DIFFS)[number]>('All');
  const [lang, setLang] = useState<CodeLang | 'all'>('all');
  const [hideSolved, setHideSolved] = useState(false);
  const list = useMemo(
    () => CHALLENGES.filter((c) => (diff === 'All' || c.difficulty === diff) && (lang === 'all' || c.exercise.lang === lang) && (!hideSolved || !completed[c.id])),
    [diff, lang, hideSolved, completed],
  );
  if (id) return <Challenge id={id} />;
  const solved = CHALLENGES.filter((c) => completed[c.id]).length;
  const random = () => {
    const pool = CHALLENGES.filter((c) => !completed[c.id]);
    const pick = (pool.length ? pool : CHALLENGES)[Math.floor(Math.random() * (pool.length || CHALLENGES.length))];
    nav(`/dojo/${pick.id}`);
  };

  return (
    <div>
      <div className="page-hero" style={{ backgroundImage: 'url(./art/hero-dojo.webp)' }}>
        <div>
          <h1>🥋 Code Dojo</h1>
          <p>Short, focused programs to sharpen your skills in {LANGS.length} languages: string puzzles, algorithms, async JavaScript and SQL queries, plus classic problems solved the same way in Go, Rust, Java, C#, Kotlin, Swift and more, so you can compare languages. Every solution is auto-graded, and you can ask the AI to review your code style.</p>
          <div className="row">
            <span className="chip">✅ {solved}/{CHALLENGES.length} solved</span>
            <button className="primary" onClick={random}>🎲 Random challenge</button>
          </div>
        </div>
      </div>
      <div className="row filters">
        <div className="tabs">
          {DIFFS.map((d) => (
            <button key={d} className={diff === d ? 'active' : ''} onClick={() => setDiff(d)}>{d}</button>
          ))}
        </div>
        <select aria-label="Filter by language" value={lang} onChange={(e) => setLang(e.target.value as CodeLang | 'all')}>
          <option value="all">All languages ({CHALLENGES.length})</option>
          {LANGS.map((l) => (
            <option key={l} value={l}>{LANG_META[l].icon} {LANG_META[l].label} ({CHALLENGES.filter((c) => c.exercise.lang === l).length})</option>
          ))}
        </select>
        <label className="toggle">
          <input type="checkbox" checked={hideSolved} onChange={(e) => setHideSolved(e.target.checked)} /> Hide solved
        </label>
      </div>
      <div className="dojo-list">
        {list.map((c) => (
          <Link key={c.id} to={`/dojo/${c.id}`} className={`card dojo-item ${completed[c.id] ? 'solved' : ''}`}>
            <span className="dojo-check">{completed[c.id] ? '✅' : '⬜'}</span>
            <div className="grow">
              <b>{c.title}</b>
              <div className="muted small">{LANG_LABEL[c.exercise.lang]} · {c.tags.join(', ')}</div>
            </div>
            <span className={`diff ${c.difficulty}`}>{c.difficulty}</span>
            <span className="muted small">{c.xp} XP</span>
          </Link>
        ))}
        {!list.length && <p className="muted">Nothing matches these filters.</p>}
      </div>
    </div>
  );
}
