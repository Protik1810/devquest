import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { hasLabs, lessonXp, trackArt, trackById } from '../content';
import { isUnlocked, trackProgress } from '../content/progress';
import type { QuizQuestion, Track } from '../content/types';
import { exercisesOf, lessonMinutes } from '../content/exercises';
import { useGame } from '../engine/store';
import { toast } from '../engine/toast';
import { Ring } from '../components/Ring';
import { Inline } from '../components/Quiz';

/** Build a placement test from the track's quiz questions plus its flashcards turned into multiple choice. */
function placementQuestions(t: Track): QuizQuestion[] {
  const qs: QuizQuestion[] = t.lessons.flatMap((l) => exercisesOf(l).flatMap((e) => (e.kind === 'quiz' ? e.questions : [])));
  const cards = t.lessons.flatMap((l) => l.cards ?? []);
  for (const c of cards) {
    const wrong = cards.filter((x) => x.back !== c.back).sort(() => Math.random() - 0.5).slice(0, 3).map((x) => x.back);
    if (wrong.length < 3) continue;
    const options = [...wrong, c.back].sort(() => Math.random() - 0.5);
    qs.push({ q: `What best describes: "${c.front}"?`, options, answer: options.indexOf(c.back) });
  }
  return qs.sort(() => Math.random() - 0.5).slice(0, 8);
}

function Placement({ track, onClose }: { track: Track; onClose: () => void }) {
  const questions = useMemo(() => placementQuestions(track), [track]);
  const [score, setScore] = useState<number | null>(null);
  const s = useGame();
  // Quiz only finishes when every question is answered correctly, so we track first-try correctness here
  const [firstTry, setFirstTry] = useState(0);
  const [answered, setAnswered] = useState<Set<number>>(new Set());

  if (questions.length < 4) return <div className="card">This track doesn't have a placement test yet.</div>;

  return (
    <div className="card placement">
      <div className="row">
        <h3 className="grow">⏩ Placement test: {track.title}</h3>
        <button className="ghost small" onClick={onClose}>✕</button>
      </div>
      <p className="muted small">Score 80%+ on first tries to unlock every lesson in this track (you'll earn 50% of their XP). Wrong answers can be retried but won't count.</p>
      {score === null ? (
        <PlacementQuiz
          questions={questions}
          onAnswer={(i, right) => {
            if (answered.has(i)) return;
            setAnswered(new Set(answered).add(i));
            if (right) setFirstTry((x) => x + 1);
          }}
          onDone={() => {
            const pct = firstTry / questions.length;
            setScore(pct);
            if (pct >= 0.8) {
              for (const l of track.lessons) s.completeLesson(l.id, lessonXp(l), { scale: 0.5 });
              s.bump('placementsPassed');
              toast({ kind: 'achievement', title: '⏩ Placement passed!', body: `${track.title} unlocked` });
            }
          }}
        />
      ) : (
        <div className="quiz-done">
          <div className="big-emoji">{score >= 0.8 ? '🎉' : '📚'}</div>
          <h3>{Math.round(score * 100)}% on first tries</h3>
          <p className="muted">{score >= 0.8 ? 'The whole track is now marked complete.' : 'Not quite 80%. Work through the lessons and you\'ll get there.'}</p>
          <button onClick={onClose}>Close</button>
        </div>
      )}
    </div>
  );
}

function PlacementQuiz({ questions, onAnswer, onDone }: { questions: QuizQuestion[]; onAnswer: (i: number, right: boolean) => void; onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const q = questions[idx];
  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    onAnswer(idx, i === q.answer);
  };
  return (
    <div className="quiz">
      <div className="muted small">Question {idx + 1} / {questions.length}</div>
      <h3 className="quiz-q"><Inline text={q.q} /></h3>
      {q.code && <pre className="quiz-code"><code>{q.code}</code></pre>}
      <div className="quiz-opts">
        {q.options.map((o, i) => (
          <button key={i} className={`opt ${picked === null ? '' : i === q.answer ? 'right' : i === picked ? 'wrong' : ''}`} onClick={() => pick(i)}>
            <span className="opt-key">{'ABCDEF'[i]}</span> <Inline text={o} />
          </button>
        ))}
      </div>
      {picked !== null && (
        <button className="primary" onClick={() => (idx + 1 < questions.length ? (setIdx(idx + 1), setPicked(null)) : onDone())}>
          {idx + 1 < questions.length ? 'Next →' : 'See result'}
        </button>
      )}
    </div>
  );
}

export function TrackPage() {
  const { id } = useParams();
  const track = trackById(id ?? '');
  const completed = useGame((s) => s.completed);
  const [placement, setPlacement] = useState(false);
  if (!track) return <p>Track not found. <Link to="/map">Back to map</Link></p>;
  const p = trackProgress(track, completed);
  const totalXp = track.lessons.reduce((a, l) => a + lessonXp(l), 0);

  return (
    <div>
      <Link to="/map" className="muted small">← Skill Map</Link>
      <div className="track-banner" style={{ backgroundImage: `url(${trackArt(track.id)})` }} />
      <div className="track-head" style={{ borderColor: track.color }}>
        <Ring pct={p.pct} size={90} color={track.color} label={track.icon} />
        <div className="grow">
          <h1>{track.title}</h1>
          <p className="muted">{track.blurb}</p>
          <div className="small">
            {p.done}/{p.total} lessons · {totalXp} XP available
            {track.depth === 'overview' && <span className="pill">{hasLabs(track) ? 'illustrated primer + hands-on labs' : 'illustrated primer'}</span>}
          </div>
        </div>
        {p.pct < 1 && <button onClick={() => setPlacement(true)}>⏩ Placement test</button>}
      </div>
      {placement && <Placement track={track} onClose={() => setPlacement(false)} />}
      <ol className="lesson-list">
        {track.lessons.map((l, i) => {
          const done = !!completed[l.id];
          const open = isUnlocked(track, i, completed);
          const exs = exercisesOf(l);
          const count = (k: string) => exs.filter((e) => e.kind === k).length;
          const parts = [
            count('quiz') && `❓ ${count('quiz') > 1 ? `${count('quiz')} quizzes` : 'quiz'}`,
            count('code') && `💻 ${count('code') > 1 ? `${count('code')} coding exercises` : 'coding exercise'}`,
            count('terminal') && '🐚 terminal missions',
            count('parsons') + count('fill') && `🧩 ${count('parsons') + count('fill')} puzzle${count('parsons') + count('fill') > 1 ? 's' : ''}`,
          ].filter(Boolean);
          // A module heading whenever the module changes
          const heading = l.module && l.module !== track.lessons[i - 1]?.module ? l.module : null;
          const inner = (
            <>
              <span className={`lesson-dot ${done ? 'done' : open ? 'open' : ''}`}>{done ? '✓' : open ? i + 1 : '🔒'}</span>
              <div className="grow">
                <b>{l.title}</b>
                <div className="muted small">
                  {l.exam ? '📝 module test · ' : ''}{parts.length ? parts.join(' · ') : '📖 reading'} · ⏱ ~{lessonMinutes(l)} min · {lessonXp(l)} XP
                  {done && ` · earned ${completed[l.id].xp} XP`}
                </div>
              </div>
            </>
          );
          return (
            <li key={l.id} className={heading ? 'has-module' : undefined}>
              {heading && <h3 className="module-heading">{heading}</h3>}
              {open ? <Link to={`/lesson/${l.id}`} className="lesson-row">{inner}</Link> : <div className="lesson-row locked" title="Finish the previous lesson to unlock">{inner}</div>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
