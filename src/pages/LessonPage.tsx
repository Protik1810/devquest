import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { findLesson, lessonXp } from '../content';
import { exercisesOf } from '../content/exercises';
import { isUnlocked } from '../content/progress';
import type { Exercise } from '../content/types';
import { useGame } from '../engine/store';
import { useLessonCtx } from '../engine/lessonCtx';
import { Markdown } from '../components/Markdown';
import { Quiz } from '../components/Quiz';
import { CodeExercise } from '../components/CodeExercise';
import { Terminal } from '../components/Terminal';

type Outcome = { hints?: number; solution?: boolean; perfect?: boolean; scale?: number };

const exPrompt = (ex?: Exercise) =>
  ex?.kind === 'code' || ex?.kind === 'terminal' ? ex.prompt : ex?.kind === 'quiz' ? ex.questions.map((q) => q.q).join(' | ') : '';

const KIND_ICON = { quiz: '❓', code: '💻', terminal: '🐚' } as const;
const KIND_NAME = { quiz: 'Quiz', code: 'Exercise', terminal: 'Terminal' } as const;

/** Per-step results of a multi-exercise lesson, kept on the device so a learner can stop halfway. */
const stepsKey = (id: string) => `dq-steps:${id}`;
function loadSteps(id: string, n: number): (Outcome | null)[] {
  try {
    const v = JSON.parse(localStorage.getItem(stepsKey(id)) ?? '[]');
    if (Array.isArray(v)) return Array.from({ length: n }, (_, i) => v[i] ?? null);
  } catch {
    /* fall through */
  }
  return Array(n).fill(null);
}

/** One exercise of a lesson: quiz, coding exercise or terminal missions. */
function Step({ ex, lessonId, step, title, xp, done, onComplete }: { ex: Exercise; lessonId: string; step: number; title: string; xp: number; done: boolean; onComplete: (o: Outcome) => void }) {
  if (ex.kind === 'quiz')
    return <Quiz key={`${lessonId}#${step}`} questions={ex.questions} done={done} onComplete={(perfect) => onComplete({ perfect })} onMistake={() => useGame.getState().noteStruggle(lessonId)} />;
  if (ex.kind === 'code') return <CodeExercise key={`${lessonId}#${step}`} ex={ex} lessonId={lessonId} step={step} title={title} xp={xp} done={done} onComplete={onComplete} />;
  return <Terminal key={`${lessonId}#${step}`} ex={ex} done={done} onComplete={(o) => onComplete({ hints: o.hints })} />;
}

/** Several exercises done in order; the lesson completes when the last one does. */
function Steps({ exs, lessonId, title, xp, done, onFinish }: { exs: Exercise[]; lessonId: string; title: string; xp: number; done: boolean; onFinish: (o: Outcome) => void }) {
  const [results, setResults] = useState(() => loadSteps(lessonId, exs.length));
  const firstOpen = results.findIndex((r) => !r);
  const [cur, setCur] = useState(done || firstOpen < 0 ? 0 : firstOpen);
  const setCtx = useLessonCtx((s) => s.set);

  useEffect(() => {
    setCtx({ prompt: exPrompt(exs[cur]), code: '' });
  }, [cur]); // eslint-disable-line react-hooks/exhaustive-deps

  const complete = (i: number, o: Outcome) => {
    const next = results.map((r, j) => (j === i ? r ?? o : r));
    setResults(next);
    try {
      localStorage.setItem(stepsKey(lessonId), JSON.stringify(next));
    } catch {
      /* progress through steps just won't survive a reload */
    }
    if (next.every(Boolean)) {
      const all = next as Outcome[];
      onFinish({
        hints: all.reduce((n, r) => n + (r.hints ?? 0), 0),
        solution: all.some((r) => r.solution),
        perfect: all.every((r) => r.perfect ?? (!r.solution && !r.hints && !r.scale)),
        scale: Math.min(...all.map((r) => r.scale ?? 1)) < 1 ? Math.min(...all.map((r) => r.scale ?? 1)) : undefined,
      });
    } else if (i + 1 < exs.length) setCur(next.findIndex((r) => !r));
  };

  const ex = exs[cur];
  return (
    <div className="steps">
      <div className="step-tabs" role="tablist" aria-label="Exercises in this lesson">
        {exs.map((e, i) => {
          const open = done || i === 0 || !!results[i - 1] || !!results[i];
          return (
            <button key={i} role="tab" aria-selected={i === cur} className={`step-tab ${i === cur ? 'cur' : ''} ${results[i] || done ? 'done' : ''}`} disabled={!open} onClick={() => setCur(i)} title={open ? undefined : 'Finish the previous step first'}>
              {results[i] || done ? '✓' : KIND_ICON[e.kind]} {i + 1}. {KIND_NAME[e.kind]}
            </button>
          );
        })}
      </div>
      <div className="muted small step-count">Step {cur + 1} of {exs.length}</div>
      <Step ex={ex} lessonId={lessonId} step={cur} title={title} xp={xp} done={done || !!results[cur]} onComplete={(o) => complete(cur, o)} />
      {!done && results[cur] && cur + 1 < exs.length && (
        <button className="primary" onClick={() => setCur(cur + 1)}>Next step →</button>
      )}
    </div>
  );
}

export function LessonPage() {
  const { id } = useParams();
  const found = findLesson(id ?? '');
  const completed = useGame((s) => s.completed);
  const completeLesson = useGame((s) => s.completeLesson);
  const setCtx = useLessonCtx((s) => s.set);
  const [justEarned, setJustEarned] = useState<number | null>(null);

  useEffect(() => {
    setJustEarned(null);
    if (!found) return;
    setCtx({
      title: `${found.track.title}: ${found.lesson.title}`,
      prompt: exPrompt(exercisesOf(found.lesson)[0]),
      code: '',
    });
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!found) return <p>Lesson not found. <Link to="/map">Back to map</Link></p>;
  const { track, lesson, index } = found;
  const done = !!completed[lesson.id];
  const xp = lessonXp(lesson);
  const prev = track.lessons[index - 1];
  const next = track.lessons[index + 1];

  if (!isUnlocked(track, index, completed))
    return (
      <div className="card locked-card">
        <div className="big-emoji">🔒</div>
        <h2>{lesson.title}</h2>
        <p>Finish <Link to={`/lesson/${prev.id}`}>{prev.title}</Link> first to unlock this lesson.</p>
      </div>
    );

  const finish = (o: Outcome) => {
    if (done) return;
    const perfect = o.perfect ?? (!o.solution && !o.hints && !o.scale);
    setJustEarned(completeLesson(lesson.id, xp, { ...o, perfect }));
  };

  const exs = exercisesOf(lesson);
  const ex = exs[0];
  const multi = exs.length > 1;
  // Hands-on work sits beside the reading; a lesson that only has quizzes keeps them under it.
  const split = exs.some((e) => e.kind !== 'quiz');

  const practice = multi ? (
    <Steps key={lesson.id} exs={exs} lessonId={lesson.id} title={lesson.title} xp={xp} done={done} onFinish={finish} />
  ) : ex ? (
    <Step ex={ex} lessonId={lesson.id} step={0} title={lesson.title} xp={xp} done={done} onComplete={finish} />
  ) : null;

  return (
    <div className="lesson">
      <div className="crumbs small">
        <Link to={`/track/${track.id}`} className="muted">
          {track.icon} {track.title}
        </Link>
        <span className="muted"> · {lesson.module ? `${lesson.module} · ` : ''}Lesson {index + 1}/{track.lessons.length}</span>
        {done && <span className="pill green">✓ completed</span>}
      </div>
      <div className={`lesson-grid ${split ? 'split' : ''}`}>
        <article className="lesson-body card">
          <h1>{lesson.title}</h1>
          <div className="muted small">
            ⭐ {xp} XP
            {multi ? ` · ${exs.length} steps` : ''}
            {lesson.cards?.length ? ` · 🃏 ${lesson.cards.length} flashcard${lesson.cards.length === 1 ? '' : 's'} unlock${lesson.cards.length === 1 ? 's' : ''} on completion` : ''}
          </div>
          <Markdown source={lesson.body} />
          {practice && !split && (
            <div className="card inset">
              <h2>❓ Check your understanding</h2>
              {practice}
            </div>
          )}
          {!ex && !done && (
            <button className="primary" onClick={() => finish({ perfect: true })}>Mark as read (+{xp} XP)</button>
          )}
        </article>
        {practice && split && <aside className="lesson-ex card">{practice}</aside>}
      </div>

      {(justEarned !== null || done) && (
        <div className="card complete-banner">
          <div className="big-emoji">{justEarned !== null ? '🎉' : '✅'}</div>
          <div className="grow">
            <b>{justEarned !== null ? `Lesson complete! +${justEarned} XP` : 'You completed this lesson'}</b>
            <div className="muted small">{lesson.cards?.length ? 'New flashcards were added to your review deck.' : 'Keep the momentum going!'}</div>
          </div>
          {next ? (
            <Link className="primary-btn" to={`/lesson/${next.id}`}>Next: {next.title} →</Link>
          ) : (
            <Link className="primary-btn" to={`/track/${track.id}`}>🏁 Track complete! Back to track</Link>
          )}
        </div>
      )}

      <div className="lesson-nav">
        {prev ? <Link to={`/lesson/${prev.id}`}>← {prev.title}</Link> : <span />}
        {next && (done ? <Link to={`/lesson/${next.id}`}>{next.title} →</Link> : <span className="muted small">Complete the {multi ? 'steps' : 'exercise'} to unlock the next lesson</span>)}
      </div>
    </div>
  );
}
