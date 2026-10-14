import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { findLesson, lessonXp } from '../content';
import { exercisesOf, isHandsOn, KIND_ICON, KIND_NAME, lessonMinutes } from '../content/exercises';
import { isUnlocked } from '../content/progress';
import type { Exercise, Lesson, QuizQuestion, Track } from '../content/types';
import { useGame } from '../engine/store';
import { useLessonCtx } from '../engine/lessonCtx';
import { shuffled } from '../engine/shuffle';
import { marked } from 'marked';
import { Markdown } from '../components/Markdown';
import { Quiz, type ExamMode } from '../components/Quiz';
import { CodeExercise } from '../components/CodeExercise';
import { FillExercise, ParsonsExercise } from '../components/PuzzleExercises';
import { Terminal } from '../components/Terminal';

type Outcome = { hints?: number; solution?: boolean; perfect?: boolean; scale?: number };

const exPrompt = (ex?: Exercise) => (!ex ? '' : ex.kind === 'quiz' ? ex.questions.map((q) => q.q).join(' | ') : ex.prompt);

/** Share of the step's XP kept: hints cost 15% each, a viewed solution all of it, self-check half. */
const stepMultiplier = (o: Outcome) => (o.solution ? 0 : (o.scale ?? 1) * Math.max(0.25, 1 - 0.15 * (o.hints ?? 0)));

/** Pass mark for module tests, and how many review questions from earlier lessons they mix in. */
const PASS_MARK = 0.7;
const REVIEW_QUESTIONS = 3;

/** A few quiz questions from the track's earlier lessons, so module tests also revisit older topics. */
function reviewQuestions(track: Track, index: number): QuizQuestion[] {
  const pool = track.lessons
    .slice(0, index)
    .filter((l) => !l.exam)
    .flatMap((l) => exercisesOf(l).flatMap((e) => (e.kind === 'quiz' ? e.questions : [])));
  return shuffled(pool).slice(0, REVIEW_QUESTIONS);
}

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

/** One exercise of a lesson. */
function Step({ ex, lesson, step, xp, done, exam, onComplete }: { ex: Exercise; lesson: Lesson; step: number; xp: number; done: boolean; exam?: ExamMode; onComplete: (o: Outcome) => void }) {
  const key = `${lesson.id}#${step}`;
  const common = { lessonId: lesson.id, step, done, xp, onComplete };
  if (ex.kind === 'quiz')
    return <Quiz key={key} questions={ex.questions} done={done} exam={exam} onComplete={(perfect) => onComplete({ perfect })} onMistake={() => useGame.getState().noteStruggle(lesson.id)} />;
  if (ex.kind === 'code') return <CodeExercise key={key} ex={ex} title={lesson.title} {...common} />;
  if (ex.kind === 'parsons') return <ParsonsExercise key={key} ex={ex} {...common} />;
  if (ex.kind === 'fill') return <FillExercise key={key} ex={ex} {...common} />;
  return <Terminal key={key} ex={ex} done={done} onComplete={(o) => onComplete({ hints: o.hints })} />;
}

/** Several exercises done in order; the lesson completes when the last one does. */
function Steps({ exs, lesson, xp, done, exam, onFinish }: { exs: Exercise[]; lesson: Lesson; xp: number; done: boolean; exam?: ExamMode; onFinish: (o: Outcome) => void }) {
  const [results, setResults] = useState(() => loadSteps(lesson.id, exs.length));
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
      localStorage.setItem(stepsKey(lesson.id), JSON.stringify(next));
    } catch {
      /* progress through steps just won't survive a reload */
    }
    if (next.every(Boolean)) {
      const all = next as Outcome[];
      // Each step is worth an equal share; hints and solutions only cost the step they were used in
      onFinish({
        scale: all.reduce((sum, r) => sum + stepMultiplier(r), 0) / all.length,
        hints: 0,
        solution: all.every((r) => r.solution),
        perfect: all.every((r) => r.perfect ?? (!r.solution && !r.hints && !r.scale)),
      });
    } else if (!done && exs[i].kind !== 'quiz') {
      // Move on to the next unfinished step (after a quiz, stay on its result screen, which reviews any mistakes)
      const ahead = next.findIndex((r, j) => j > i && !r);
      setCur(ahead >= 0 ? ahead : next.findIndex((r) => !r));
    }
  };

  const ex = exs[cur];
  return (
    <div className="steps">
      <div className="step-tabs" role="tablist" aria-label="Exercises in this lesson">
        {exs.map((e, i) => {
          const open = done || i === 0 || !!results[i - 1] || !!results[i];
          return (
            <button key={i} role="tab" aria-selected={i === cur} className={`step-tab ${i === cur ? 'cur' : ''} ${results[i] || done ? 'done' : ''}`} disabled={!open} onClick={() => setCur(i)} title={open ? undefined : 'Finish the previous step first'}>
              {results[i] || done ? '✓' : KIND_ICON[e.kind]} {i + 1}. {e.kind === 'quiz' && exam ? 'Test' : KIND_NAME[e.kind]}
            </button>
          );
        })}
      </div>
      <div className="muted small step-count">Step {cur + 1} of {exs.length}</div>
      <Step ex={ex} lesson={lesson} step={cur} xp={Math.round(xp / exs.length)} done={done || !!results[cur]} exam={exam} onComplete={(o) => complete(cur, o)} />
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
  const split = exs.some(isHandsOn);
  const exam: ExamMode | undefined = lesson.exam ? { passMark: PASS_MARK, extra: () => reviewQuestions(track, index) } : undefined;

  const practice = multi ? (
    <Steps key={lesson.id} exs={exs} lesson={lesson} xp={xp} done={done} exam={exam} onFinish={finish} />
  ) : ex ? (
    <Step ex={ex} lesson={lesson} step={0} xp={xp} done={done} exam={exam} onComplete={finish} />
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
            ⭐ {xp} XP · ⏱ about {lessonMinutes(lesson)} min
            {multi ? ` · ${exs.length} steps` : ''}
            {lesson.cards?.length ? ` · 🃏 ${lesson.cards.length} flashcard${lesson.cards.length === 1 ? '' : 's'} unlock${lesson.cards.length === 1 ? 's' : ''} on completion` : ''}
          </div>
          {lesson.goals?.length ? (
            <div className="goals">
              <b>🎯 {lesson.exam ? 'This test checks that you can:' : "By the end of this lesson you'll be able to:"}</b>
              <ul>
                {lesson.goals.map((g) => (
                  // Trusted lesson text: inline markdown such as `code` and *emphasis*
                  <li key={g} dangerouslySetInnerHTML={{ __html: marked.parseInline(g) as string }} />
                ))}
              </ul>
            </div>
          ) : null}
          <Markdown source={lesson.body} interactive />
          {practice && !split && (
            <div className="card inset">
              <h2>{lesson.exam ? '📝 Module test' : '❓ Check your understanding'}</h2>
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
