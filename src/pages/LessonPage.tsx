import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { findLesson, lessonXp } from '../content';
import { isUnlocked } from '../content/progress';
import { useGame } from '../engine/store';
import { useLessonCtx } from '../engine/lessonCtx';
import { Markdown } from '../components/Markdown';
import { Quiz } from '../components/Quiz';
import { CodeExercise } from '../components/CodeExercise';
import { Terminal } from '../components/Terminal';

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
    const ex = found.lesson.exercise;
    setCtx({
      title: `${found.track.title}: ${found.lesson.title}`,
      prompt: ex?.kind === 'code' ? ex.prompt : ex?.kind === 'terminal' ? ex.prompt : ex?.kind === 'quiz' ? ex.questions.map((q) => q.q).join(' | ') : '',
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

  const finish = (o: { hints?: number; solution?: boolean; perfect?: boolean; scale?: number }) => {
    if (done) return;
    const perfect = o.perfect ?? (!o.solution && !o.hints && !o.scale);
    setJustEarned(completeLesson(lesson.id, xp, { ...o, perfect }));
  };

  const ex = lesson.exercise;

  return (
    <div className="lesson">
      <div className="crumbs small">
        <Link to={`/track/${track.id}`} className="muted">
          {track.icon} {track.title}
        </Link>
        <span className="muted"> · Lesson {index + 1}/{track.lessons.length}</span>
        {done && <span className="pill green">✓ completed</span>}
      </div>
      <div className={`lesson-grid ${ex && ex.kind !== 'quiz' ? 'split' : ''}`}>
        <article className="lesson-body card">
          <h1>{lesson.title}</h1>
          <div className="muted small">⭐ {xp} XP{lesson.cards?.length ? ` · 🃏 ${lesson.cards.length} flashcards unlock on completion` : ''}</div>
          <Markdown source={lesson.body} />
          {ex?.kind === 'quiz' && (
            <div className="card inset">
              <h2>❓ Check your understanding</h2>
              <Quiz key={lesson.id} questions={ex.questions} done={done} onComplete={(perfect) => finish({ perfect })} onMistake={() => useGame.getState().noteStruggle(lesson.id)} />
            </div>
          )}
          {!ex && !done && (
            <button className="primary" onClick={() => finish({ perfect: true })}>Mark as read (+{xp} XP)</button>
          )}
        </article>
        {ex && ex.kind !== 'quiz' && (
          <aside className="lesson-ex card">
            {ex.kind === 'code' && <CodeExercise key={lesson.id} ex={ex} lessonId={lesson.id} title={lesson.title} xp={xp} done={done} onComplete={(o) => finish(o)} />}
            {ex.kind === 'terminal' && <Terminal key={lesson.id} ex={ex} done={done} onComplete={(o) => finish({ hints: o.hints })} />}
          </aside>
        )}
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
        {next && (done ? <Link to={`/lesson/${next.id}`}>{next.title} →</Link> : <span className="muted small">Complete the exercise to unlock the next lesson</span>)}
      </div>
    </div>
  );
}
