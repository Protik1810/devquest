import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PROJECTS, projectArt } from '../content/projects';
import type { Project } from '../content/types';
import { useGame } from '../engine/store';
import { generateProject, useAIReady } from '../engine/ai';
import { letterFor } from '../engine/ai';
import { toast } from '../engine/toast';
import { focusPath } from '../content/focus';

const LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced'] as const;
const LANG_ICON = { python: '🐍 Python', javascript: '🟨 JavaScript', web: '🌐 Web' };

function ProjectCard({ p }: { p: Project }) {
  const state = useGame((s) => s.projects[p.id]);
  const best = state?.best ?? 0;
  return (
    <Link to={`/projects/${p.id}`} className="card project-card">
      <div className="cover" style={{ backgroundImage: `url(${projectArt(p)})` }}>
        <span className="cover-emoji">{p.emoji}</span>
        {state?.grades.length ? <span className={`grade-pill ${best >= 85 ? 'g' : best >= 65 ? 'y' : 'r'}`}>{letterFor(best)} · {best}</span> : null}
      </div>
      <div className="project-meta">
        <b>{p.title}</b>
        <div className="muted small">
          {LANG_ICON[p.lang]} · {p.level} · {p.xp} XP{p.custom ? ' · ✨ AI-generated' : ''}
        </div>
      </div>
    </Link>
  );
}

function Creator() {
  const ready = useAIReady();
  const add = useGame((s) => s.addCustomProject);
  const nav = useNavigate();
  const [idea, setIdea] = useState('');
  const [level, setLevel] = useState<Project['level']>('Beginner');
  const [lang, setLang] = useState<Project['lang']>('python');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const create = async () => {
    setBusy(true);
    setErr('');
    try {
      const p = await generateProject({ idea, level, lang });
      add(p);
      toast({ kind: 'info', title: `✨ Project created: ${p.title}` });
      nav(`/projects/${p.id}`);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card creator">
      <h3>✨ Create a project with AI</h3>
      <p className="muted small">Describe something you'd like to build. The AI writes a brief, requirements, a grading rubric and starter code tailored to your level.</p>
      {!ready ? (
        <p className="small">
          Set up an AI provider in <Link to="/settings">Settings</Link> first. A free local model works.
        </p>
      ) : (
        <>
          <textarea value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="e.g. a habit tracker that shows streaks, a recipe scaler, a quiz game about planets…" rows={3} maxLength={1500} />
          <div className="row">
            <select value={level} onChange={(e) => setLevel(e.target.value as Project['level'])}>
              {LEVELS.slice(1).map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
            <select value={lang} onChange={(e) => setLang(e.target.value as Project['lang'])}>
              <option value="python">🐍 Python</option>
              <option value="javascript">🟨 JavaScript</option>
              <option value="web">🌐 HTML/CSS/JS</option>
            </select>
            <button className="primary" disabled={busy || idea.trim().length < 8} onClick={create}>
              {busy ? '✨ Designing your project…' : '✨ Generate project'}
            </button>
          </div>
          {err && <div className="feedback bad small">⚠️ {err}</div>}
        </>
      )}
    </div>
  );
}

export function Projects() {
  const custom = useGame((s) => s.customProjects);
  const [level, setLevel] = useState<(typeof LEVELS)[number]>('All');
  const list = PROJECTS.filter((p) => level === 'All' || p.level === level);
  const path = focusPath(useGame((s) => s.path));
  const forPath = (path?.projects ?? []).map((id) => PROJECTS.find((p) => p.id === id)).filter((p): p is Project => !!p);
  return (
    <div>
      <div className="page-hero" style={{ backgroundImage: 'url(./art/hero-projects.webp)' }}>
        <div>
          <h1>🏗️ Projects Studio</h1>
          <p>Build real programs from a brief, like on the job. Each submission runs automated tests, then an AI reviewer grades it against a rubric and tells you exactly what to improve.</p>
        </div>
      </div>
      <Creator />
      {custom.length > 0 && (
        <>
          <h2>✨ Your AI-generated projects</h2>
          <div className="project-grid">{custom.map((p) => <ProjectCard key={p.id} p={p} />)}</div>
        </>
      )}
      {forPath.length > 0 && (
        <>
          <h2>{path!.icon} Recommended for {path!.title}</h2>
          <div className="project-grid">{forPath.map((p) => <ProjectCard key={p.id} p={p} />)}</div>
        </>
      )}
      <h2>📦 Project library</h2>
      <div className="tabs">
        {LEVELS.map((l) => (
          <button key={l} className={level === l ? 'active' : ''} onClick={() => setLevel(l)}>{l}</button>
        ))}
      </div>
      <div className="project-grid">{list.map((p) => <ProjectCard key={p.id} p={p} />)}</div>
    </div>
  );
}
