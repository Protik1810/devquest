import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PATHS, recommendPath, resolveSteps, pathTrackIds } from '../content/paths';
import { focusPath, focusTracks } from '../content/focus';
import { LANGUAGE_TRACKS, trackById, trackArt } from '../content';
import { trackProgress, tracksProgress, nextLesson } from '../content/progress';
import { PROJECTS, projectArt } from '../content/projects';
import { CHALLENGES } from '../content/dojo';
import type { CareerPath, Track } from '../content/types';
import { useGame } from '../engine/store';
import { Ring } from '../components/Ring';
import { APP_AUTHOR } from '../engine/platform';

const GOALS: [string, string, string][] = [
  ['websites', '🎨', 'Websites & web apps people see'],
  ['apis', '⚙️', 'APIs, servers & databases'],
  ['everything', '🧩', 'Whole products, front to back'],
  ['apps', '📱', 'Phone apps'],
  ['data', '📊', 'Insights from data'],
  ['ai', '🤖', 'AI & machine learning'],
  ['infra', '☁️', 'Cloud, servers & automation'],
  ['lowlevel', '🔧', 'Operating systems, devices & performance'],
  ['games', '🎮', 'Games'],
  ['hacking', '🛡️', 'Security & ethical hacking'],
  ['crypto', '⛓️', 'Blockchain & smart contracts'],
];

/** Languages a path uses, e.g. "Python / Go / Java" for choice steps. */
function pathLanguages(p: CareerPath) {
  const out: string[] = [];
  for (const st of p.stages) {
    for (const step of st.steps) {
      const ids = typeof step === 'string' ? [step] : step.options;
      const langs = ids.map((id) => trackById(id)).filter((t) => t?.kind === 'language').map((t) => t!.title.replace(/ \(.*\)/, '').replace('JavaScript & TypeScript', 'JavaScript'));
      if (langs.length) out.push(typeof step === 'string' ? langs[0] : langs.join(' / '));
    }
  }
  return [...new Set(out)];
}

function PathCard({ p, recommended, onPick }: { p: CareerPath; recommended?: boolean; onPick: () => void }) {
  const tracks = pathTrackIds(p, {}).map((id) => trackById(id)).filter(Boolean) as Track[];
  const lessons = tracks.reduce((a, t) => a + t.lessons.length, 0);
  return (
    <div className={`card path-card ${recommended ? 'recommended' : ''}`} style={{ ['--c' as string]: p.color }}>
      {recommended && <span className="pill gold">★ recommended for you</span>}
      <div className="row">
        <span className="path-icon">{p.icon}</span>
        <div className="grow">
          <h3>{p.title}</h3>
          <div className="muted small">{p.roles.join(' · ')}</div>
        </div>
      </div>
      <p className="small">{p.blurb}</p>
      <div className="chips">{pathLanguages(p).map((l) => <span key={l} className="lang-chip">{l}</span>)}</div>
      <div className="muted small">{tracks.length} tracks · {lessons} lessons · {p.projects.length} projects</div>
      <button className="primary" onClick={onPick}>Choose this path →</button>
    </div>
  );
}

export function PathPicker() {
  const setPath = useGame((s) => s.setPath);
  const current = useGame((s) => s.path);
  const nav = useNavigate();
  const [goal, setGoal] = useState<string | null>(null);
  const rec = goal ? recommendPath(goal) : null;
  const pick = (id: string | null) => {
    setPath(id);
    nav(id ? '/path' : '/map');
  };
  const ordered = rec ? [...PATHS].sort((a, b) => (a.id === rec ? -1 : b.id === rec ? 1 : 0)) : PATHS;

  return (
    <div className="path-picker">
      <div className="page-hero" style={{ backgroundImage: 'url(./art/hero-guide.webp)' }}>
        <div>
          <h1>🧭 Choose your direction</h1>
          <p>You don't need to learn everything. Pick a career path and DevQuest shows only what that job needs: the right languages, plus the computer science, databases, architecture and engineering practices every developer uses. You can switch any time.</p>
        </div>
      </div>

      <section className="card">
        <h3>What do you want to build?</h3>
        <div className="goal-grid">
          {GOALS.map(([id, icon, label]) => (
            <button key={id} className={goal === id ? 'active' : ''} onClick={() => setGoal(id)}>
              <span>{icon}</span> {label}
            </button>
          ))}
        </div>
      </section>

      <h2>🎯 Career paths</h2>
      <div className="path-grid">
        {ordered.map((p) => (
          <PathCard key={p.id} p={p} recommended={p.id === rec} onPick={() => pick(p.id)} />
        ))}
      </div>

      <h2>🔤 Or learn just one language</h2>
      <p className="muted">Already know what you want? Focus on a single language and skip the rest.</p>
      <div className="lang-mini-grid">
        {LANGUAGE_TRACKS.map((t) => (
          <button key={t.id} className="lang-mini" onClick={() => pick(`lang:${t.id}`)} style={{ ['--c' as string]: t.color }}>
            <span className="lang-mini-icon">{t.icon}</span>
            <span>{t.title.replace(' & TypeScript', '')}</span>
          </button>
        ))}
      </div>

      <div className="card center explore-card">
        <p>Prefer to wander? Every track stays open.</p>
        <button onClick={() => pick(null)}>🗺️ Explore everything freely</button>
        {current !== undefined && <div className="muted small">Your current choice is kept until you pick another.</div>}
      </div>
    </div>
  );
}

function Certificate({ path, name }: { path: CareerPath; name: string }) {
  return (
    <div className="certificate">
      <div className="cert-inner">
        <div className="muted small">DevQuest certificate of completion</div>
        <h2>{path.icon} {path.title}</h2>
        <p>
          This certifies that <b>{name}</b> completed every track in the <b>{path.title}</b> path.
        </p>
        <div className="muted small">
          {new Date().toLocaleDateString()} · DevQuest by {APP_AUTHOR}
        </div>
        <button className="ghost small no-print" onClick={() => window.print()}>🖨️ Print / save as PDF</button>
      </div>
    </div>
  );
}

export function PathPage() {
  const focus = useGame((s) => s.path);
  const completed = useGame((s) => s.completed);
  const name = useGame((s) => s.name);
  const setChoice = useGame((s) => s.setPathChoice);
  const path = focusPath(focus);
  if (!path || !focus) return <PathPicker />;

  const tracks = focusTracks(focus);
  const total = tracksProgress(tracks, completed);
  const next = nextLesson(completed, tracks);
  const langIds = new Set(tracks.filter((t) => t.kind === 'language').map((t) => t.lang));
  const challenges = CHALLENGES.filter((c) => langIds.has(c.exercise.lang));
  const projects = path.projects.map((id) => PROJECTS.find((p) => p.id === id)).filter(Boolean) as typeof PROJECTS;

  return (
    <div className="path-page">
      <div className="path-hero card" style={{ borderColor: path.color }}>
        <Ring pct={total.pct} size={96} color={path.color} label={path.icon} />
        <div className="grow">
          <div className="muted small">{focus.id.startsWith('lang:') ? 'Language focus' : 'Career path'}</div>
          <h1>{path.title}</h1>
          <p className="muted">{path.blurb}</p>
          <div className="small">
            {total.done}/{total.total} lessons · {Math.round(total.pct * 100)}% complete
          </div>
          {path.roles.length > 0 && <div className="chips">{path.roles.map((r) => <span key={r} className="lang-chip">{r}</span>)}</div>}
        </div>
        <div className="path-actions">
          {next && <Link className="primary-btn" to={`/lesson/${next.lesson.id}`}>Continue: {next.lesson.title} →</Link>}
          <Link to="/paths" className="small">Change path</Link>
        </div>
      </div>

      {total.pct === 1 && <Certificate path={path} name={name} />}

      <div className="grid-2">
        <div className="card">
          <h3>🎓 You'll be able to</h3>
          <ul className="small">{path.outcomes.map((o) => <li key={o}>{o}</li>)}</ul>
        </div>
        <div className="card">
          <h3>🏋️ Practise</h3>
          <p className="small">
            {challenges.length ? <><Link to="/dojo">{challenges.length} Code Dojo challenges</Link> in your languages</> : 'Use the Playground to experiment in your languages.'}
            {projects.length > 0 && <> · <Link to="/projects">{projects.length} recommended projects</Link></>}
          </p>
          <p className="small muted">Every track outside your path stays open in the <Link to="/map">Skill Map</Link>.</p>
        </div>
      </div>

      <h2>🗺️ Roadmap</h2>
      <div className="roadmap">
        {path.stages.map((stage, si) => {
          const ids = resolveSteps(stage.steps, focus.choices);
          return (
            <section key={stage.name} className="stage">
              <div className="stage-head">
                <span className="tier-num">{si + 1}</span>
                <b>{stage.name}</b>
              </div>
              <div className="stage-tracks">
                {stage.steps.map((step, i) => {
                  const t = trackById(ids[i]);
                  if (!t) return null;
                  const p = trackProgress(t, completed);
                  return (
                    <div key={t.id + i} className="stage-item">
                      {typeof step !== 'string' && (
                        <label className="choice small">
                          {step.label}:
                          <select value={ids[i]} onChange={(e) => setChoice(step.choose, e.target.value)}>
                            {step.options.map((o) => (
                              <option key={o} value={o}>{trackById(o)?.icon} {trackById(o)?.title}</option>
                            ))}
                          </select>
                        </label>
                      )}
                      <Link to={`/track/${t.id}`} className={`node ${p.pct === 1 ? 'mastered' : p.done ? 'started' : ''}`} style={{ ['--c' as string]: t.color }}>
                        <div className="node-cover" style={{ backgroundImage: `url(${trackArt(t.id)})` }}>
                          <Ring pct={p.pct} size={34} color={t.color} label={t.icon} />
                        </div>
                        <div>
                          <b>{t.title}</b>
                          <div className="muted small">{t.kind === 'language' ? 'Language' : t.kind === 'skill' ? 'Specialization' : 'Core engineering'} · {p.done}/{p.total} lessons</div>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {projects.length > 0 && (
        <>
          <h2>🏗️ Portfolio projects for this path</h2>
          <div className="project-grid">
            {projects.map((p) => (
              <Link key={p.id} to={`/projects/${p.id}`} className="card project-card">
                <div className="cover" style={{ backgroundImage: `url(${projectArt(p)})` }}>
                  <span className="cover-emoji">{p.emoji}</span>
                </div>
                <div className="project-meta">
                  <b>{p.title}</b>
                  <div className="muted small">{p.level} · {p.xp} XP</div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
