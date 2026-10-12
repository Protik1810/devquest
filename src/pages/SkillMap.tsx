import { Link } from 'react-router-dom';
import { LANGUAGE_TRACKS, TIERS, TRACKS, hasLabs, trackArt } from '../content';
import { trackProgress, tracksProgress } from '../content/progress';
import { focusPath, focusTracks } from '../content/focus';
import type { Track } from '../content/types';
import { useGame } from '../engine/store';
import { Ring } from '../components/Ring';

function Node({ t, completed }: { t: Track; completed: Record<string, unknown> }) {
  const p = trackProgress(t, completed);
  return (
    <Link to={`/track/${t.id}`} className={`node ${p.pct === 1 ? 'mastered' : p.done ? 'started' : ''}`} style={{ ['--c' as string]: t.color }}>
      <div className="node-cover" style={{ backgroundImage: `url(${trackArt(t.id)})` }}>
        <Ring pct={p.pct} size={34} color={t.color} label={t.icon} />
      </div>
      <div>
        <b>{t.title}</b>
        <div className="muted small">{t.blurb}</div>
        <div className="small">
          {p.done}/{p.total} lessons {t.depth === 'overview' && <span className="pill">{hasLabs(t) ? 'primer + labs' : 'illustrated primer'}</span>}
          {p.pct === 1 && <span className="pill gold">★ mastered</span>}
        </div>
      </div>
    </Link>
  );
}

export function SkillMap() {
  const completed = useGame((s) => s.completed);
  const focus = useGame((s) => s.path);
  const path = focusPath(focus);
  const mine = focusTracks(focus);
  const mineProgress = tracksProgress(mine, completed);
  const core = TRACKS.filter((t) => t.kind === 'core');
  const skills = TRACKS.filter((t) => t.kind === 'skill');

  return (
    <div>
      <h1>🗺️ Skill Map</h1>
      <p className="muted">Everything DevQuest teaches. Your path highlights what matters for your goal; every other track stays open.</p>

      {path ? (
        <section className="card map-path" style={{ borderColor: path.color }}>
          <div className="row">
            <Ring pct={mineProgress.pct} size={56} color={path.color} label={path.icon} />
            <div className="grow">
              <div className="muted small">Your path</div>
              <b>{path.title}</b>
              <div className="muted small">{mine.length} tracks · {mineProgress.done}/{mineProgress.total} lessons</div>
            </div>
            <Link to="/path" className="primary-btn">Open roadmap →</Link>
          </div>
          <div className="path-strip">
            {mine.map((t) => {
              const p = trackProgress(t, completed);
              return (
                <Link key={t.id} to={`/track/${t.id}`} className={`strip-item ${p.pct === 1 ? 'done' : ''}`} title={`${t.title}: ${p.done}/${p.total}`}>
                  <span>{t.icon}</span>
                  <small>{t.title.replace(/ \(.*\)/, '')}</small>
                </Link>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="card map-path">
          <div className="row">
            <div className="grow">
              <b>🧭 No path chosen</b>
              <div className="muted small">Pick a career path or a single language to get a focused roadmap.</div>
            </div>
            <Link to="/paths" className="primary-btn">Choose a path →</Link>
          </div>
        </section>
      )}

      <h2>🏛️ Core engineering</h2>
      <p className="muted small">The foundations every developer needs, whatever the language: computing, tools, algorithms, systems, databases, architecture and professional practice.</p>
      <div className="skillmap">
        {TIERS.map((tier) => {
          const tracks = core.filter((t) => t.tier === tier.tier);
          if (!tracks.length) return null;
          return (
            <section key={tier.tier} className="tier">
              <div className="tier-label">
                <span className="tier-num">{tier.tier}</span>
                <div>
                  <b>{tier.name}</b>
                  <div className="muted small">{tier.subtitle}</div>
                </div>
              </div>
              <div className="tier-tracks">{tracks.map((t) => <Node key={t.id} t={t} completed={completed} />)}</div>
            </section>
          );
        })}
      </div>

      <div className="row">
        <h2 className="grow">🔤 Languages</h2>
        <Link to="/languages" className="small">All languages & where they're used →</Link>
      </div>
      <div className="lang-mini-grid">
        {LANGUAGE_TRACKS.map((t) => {
          const p = trackProgress(t, completed);
          return (
            <Link key={t.id} to={`/track/${t.id}`} className={`lang-mini ${p.pct === 1 ? 'done' : ''}`} style={{ ['--c' as string]: t.color }}>
              <span className="lang-mini-icon">{t.icon}</span>
              <span>{t.title.replace(' & TypeScript', '')}</span>
              <small className="muted">{p.done}/{p.total}</small>
            </Link>
          );
        })}
      </div>

      <h2>🚀 Specializations</h2>
      <div className="tier-tracks">{skills.map((t) => <Node key={t.id} t={t} completed={completed} />)}</div>
    </div>
  );
}
