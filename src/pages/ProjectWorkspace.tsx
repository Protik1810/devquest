import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { projectArt, projectById } from '../content/projects';
import type { CodeCheck } from '../content/types';
import { useGame } from '../engine/store';
import { useLessonCtx } from '../engine/lessonCtx';
import { runCode, warmPython, type RunResult } from '../engine/runners';
import { gradeProject, letterFor, useAIReady, type ProjectGrade } from '../engine/ai';
import { Markdown } from '../components/Markdown';
import { Editor, LANG_LABEL, WebPreview } from '../components/Editor';
import { ResultView } from '../components/ResultView';
import { GradeReport } from '../components/GradeReport';

// Keyed by id so switching projects resets the editor, results and hints
export function ProjectWorkspace() {
  const { id = '' } = useParams();
  return <Workspace key={id} id={id} />;
}

function Workspace({ id }: { id: string }) {
  const custom = useGame((s) => s.customProjects);
  const project = projectById(id, custom);
  const saved = useGame((s) => s.projects[id]);
  const saveCode = useGame((s) => s.saveProjectCode);
  const addGrade = useGame((s) => s.addProjectGrade);
  const removeCustom = useGame((s) => s.removeCustomProject);
  const setCtx = useLessonCtx((s) => s.set);
  const aiReady = useAIReady();
  const nav = useNavigate();
  const [code, setCode] = useState(saved?.code || project?.starter || '');
  const [result, setResult] = useState<RunResult | null>(null);
  const [busy, setBusy] = useState<'' | 'run' | 'test' | 'grade'>('');
  const [hints, setHints] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [gradeErr, setGradeErr] = useState('');

  useEffect(() => {
    if (project?.lang === 'python') warmPython().catch(() => {});
    if (project) setCtx({ title: `Project: ${project.title}`, prompt: project.requirements.join(' | '), code: '' });
  }, [project?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Autosave the workspace shortly after typing stops
  useEffect(() => {
    if (!project) return;
    setCtx({ code });
    const t = setTimeout(() => saveCode(project.id, code), 600);
    return () => clearTimeout(t);
  }, [code, project, saveCode, setCtx]);

  if (!project) return <p>Project not found. <Link to="/projects">Back to projects</Link></p>;

  const check: CodeCheck | undefined = project.tests ? (project.lang === 'web' ? { type: 'web', tests: project.tests } : { type: 'tests', code: project.tests }) : undefined;
  const grades = saved?.grades ?? [];

  const run = async () => {
    setBusy('run');
    setResult(await runCode(project.lang, code));
    setBusy('');
  };

  const runTests = async () => {
    setBusy('test');
    setResult(await runCode(project.lang, code, check));
    setBusy('');
  };

  const submit = async () => {
    setBusy('grade');
    setGradeErr('');
    try {
      // Automated tests first (if any), then a plain run to capture output or errors for the grader
      const tested = check ? await runCode(project.lang, code, check) : null;
      const plain = await runCode(project.lang, code);
      setResult(tested ?? plain);
      const tests = tested ? { passed: !!tested.passed, message: tested.passed ? 'all automated checks passed' : tested.message ?? tested.error ?? 'failed' } : undefined;
      let grade: ProjectGrade;
      if (aiReady) {
        grade = await gradeProject(project, code, { tests, output: plain.output, error: plain.error });
      } else {
        if (!tests) throw new Error('This project is graded by AI only. Set up an AI provider in Settings.');
        // Without AI, grade from the automated tests alone (capped, since quality isn't assessed)
        const score = tests.passed ? 70 : 0;
        grade = { at: new Date().toISOString(), score, letter: letterFor(score), criteria: [{ criterion: 'Automated tests', score, max: 100, comment: tests.passed ? 'All checks passed. Add an AI provider to get your code quality graded too.' : tests.message }], summary: 'Tests-only grade (no AI provider configured).', strengths: [], improvements: [], tests, model: 'automated tests' };
      }
      addGrade(project, grade);
      document.querySelector('.grade-anchor')?.scrollIntoView({ behavior: 'smooth' });
    } catch (e) {
      setGradeErr((e as Error).message);
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="workspace">
      <Link to="/projects" className="muted small">← Projects</Link>
      <div className="project-head" style={{ backgroundImage: `url(${projectArt(project)})` }}>
        <div className="project-head-inner">
          <h1>{project.emoji} {project.title}</h1>
          <div className="small">
            {LANG_LABEL[project.lang]} · {project.level} · up to {project.xp} XP
            {saved?.best ? ` · best ${letterFor(saved.best)} (${saved.best})` : ''}
          </div>
        </div>
      </div>

      <div className="lesson-grid split">
        <article className="card">
          <h2>📋 Brief</h2>
          <Markdown source={project.brief} untrusted={!!project.custom} />
          <h3>✅ Requirements</h3>
          <ol className="reqs">
            {project.requirements.map((r, i) => (
              <li key={i}><Markdown source={r} untrusted={!!project.custom} /></li>
            ))}
          </ol>
          <h3>🧾 Rubric</h3>
          <table className="rubric">
            <tbody>
              {project.rubric.map((r) => (
                <tr key={r.criterion}>
                  <td><b>{r.criterion}</b><div className="muted small">{r.description}</div></td>
                  <td className="pts">{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {project.hints && project.hints.length > 0 && (
            <div className="hints">
              {project.hints.slice(0, hints).map((h, i) => <div key={i} className="hint">💡 {h}</div>)}
              {hints < project.hints.length && <button className="ghost small" onClick={() => setHints(hints + 1)}>💡 Show a hint ({hints}/{project.hints.length})</button>}
            </div>
          )}
          {project.custom && (
            <button className="danger small" onClick={() => { if (confirm('Delete this AI-generated project and its grades?')) { removeCustom(project.id); nav('/projects'); } }}>🗑️ Delete project</button>
          )}
        </article>

        <aside className="card lesson-ex">
          <Editor lang={project.lang} value={code} onChange={setCode} height="420px" onRun={run} />
          {project.lang === 'web' && <WebPreview code={code} height={360} />}
          <div className="ex-actions">
            <button onClick={run} disabled={!!busy} title="Ctrl+Enter">{busy === 'run' ? '⏳…' : '▶ Run'}</button>
            {check && <button onClick={runTests} disabled={!!busy}>{busy === 'test' ? '⏳…' : '🧪 Run tests'}</button>}
            <button className="primary" onClick={submit} disabled={!!busy}>{busy === 'grade' ? '🤖 Grading…' : '🎓 Submit for grading'}</button>
            <span className="spacer" />
            <button className="ghost" onClick={() => { if (confirm('Reset your code to the starter? Your saved work will be replaced.')) setCode(project.starter); }} title="Reset">↺</button>
          </div>
          {!aiReady && <div className="muted small">ℹ️ Without an AI provider, projects are graded by automated tests only (max 70). <Link to="/settings">Set one up</Link> for full rubric grading and feedback.</div>}
          {gradeErr && <div className="feedback bad small">⚠️ {gradeErr}</div>}
          {result && <ResultView result={result} lang={project.lang} code={code} />}
        </aside>
      </div>

      <div className="grade-anchor" />
      {grades.length > 0 && (
        <section className="card">
          <h2>🎓 Latest grade</h2>
          <GradeReport grade={grades[0]} />
          {grades.length > 1 && (
            <details>
              <summary className="small">Previous submissions ({grades.length - 1})</summary>
              <ul className="small">
                {grades.slice(1).map((g) => (
                  <li key={g.at}>{new Date(g.at).toLocaleString()}: <b>{g.letter}</b> ({g.score}) · {g.model}</li>
                ))}
              </ul>
            </details>
          )}
          {project.solution && (
            <div>
              <button className="ghost small" onClick={() => setShowSolution(!showSolution)}>{showSolution ? 'Hide' : '👁 Compare with a reference solution'}</button>
              {showSolution && <Markdown source={'```' + (project.lang === 'web' ? 'html' : project.lang) + '\n' + project.solution + '\n```'} untrusted={!!project.custom} />}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
