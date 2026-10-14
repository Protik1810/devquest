import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ALL_CARDS } from '../content';
import { useGame } from '../engine/store';
import { today } from '../engine/levels';
import { dueDrills, type Drill } from '../engine/drills';
import { Markdown } from '../components/Markdown';
import { CodeExercise } from '../components/CodeExercise';

export function Review() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'drills' ? 'drills' : 'cards';
  const completed = useGame((s) => s.completed);
  const drills = useGame((s) => s.drills);
  const dueCount = useMemo(() => dueDrills({ completed, drills }, Infinity).length, [completed, drills]);

  return (
    <div className="review">
      <h1>🧠 Review</h1>
      <p className="muted">
        Memory fades unless it's used. Review brings back what you've learned just before you'd forget it: <b>flashcards</b> for ideas and <b>coding drills</b> for skills.
      </p>
      <div className="tabs">
        <button className={tab === 'cards' ? 'active' : ''} onClick={() => setParams({})}>🃏 Flashcards</button>
        <button className={tab === 'drills' ? 'active' : ''} onClick={() => setParams({ tab: 'drills' })}>
          💻 Coding drills{dueCount ? ` (${dueCount} due)` : ''}
        </button>
      </div>
      {tab === 'cards' ? <Flashcards /> : <Drills />}
    </div>
  );
}

function Flashcards() {
  const completed = useGame((s) => s.completed);
  const srs = useGame((s) => s.srs);
  const reviewCard = useGame((s) => s.reviewCard);
  const [mode, setMode] = useState<'due' | 'all'>('due');
  const [flipped, setFlipped] = useState(false);
  const [sessionDone, setSessionDone] = useState(0);

  const unlocked = ALL_CARDS.filter((c) => completed[c.lesson.id]);
  // Snapshot the queue so grading a card doesn't reshuffle it mid-session
  const queue = useMemo(() => {
    const t = today();
    const list = mode === 'due' ? unlocked.filter((c) => !srs[c.id] || srs[c.id].due <= t) : [...unlocked].sort(() => Math.random() - 0.5);
    return list;
  }, [mode, unlocked.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const card = queue[sessionDone];

  const grade = (g: 0 | 1 | 2 | 3) => {
    reviewCard(card.id, g);
    setFlipped(false);
    setSessionDone((n) => n + 1);
  };

  return (
    <>
      <p className="muted small">
        Spaced repetition shows each card just before you'd forget it. Cards unlock as you complete lessons. You have <b>{unlocked.length}</b> of {ALL_CARDS.length}.
      </p>
      <div className="tabs small-tabs">
        <button className={mode === 'due' ? 'active' : ''} onClick={() => { setMode('due'); setSessionDone(0); }}>Due today</button>
        <button className={mode === 'all' ? 'active' : ''} onClick={() => { setMode('all'); setSessionDone(0); }}>Practice all</button>
      </div>
      {!unlocked.length ? (
        <div className="card empty">
          <div className="big-emoji">📭</div>
          <p>No cards yet. <Link to="/">Complete a lesson</Link> to unlock your first flashcards.</p>
        </div>
      ) : !card ? (
        <div className="card empty">
          <div className="big-emoji">🎉</div>
          <h3>{sessionDone ? `Session complete: ${sessionDone} cards reviewed!` : 'All caught up!'}</h3>
          <p className="muted">Come back tomorrow, or switch to "Practice all".</p>
        </div>
      ) : (
        <>
          <div className="muted small">
            Card {sessionDone + 1} of {queue.length} · from {card.track.icon} {card.lesson.title}
          </div>
          <div className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(true)}>
            <div className="fc-face fc-front">
              <Markdown source={card.front} />
              {!flipped && <div className="muted small">click to reveal</div>}
            </div>
            {flipped && (
              <div className="fc-face fc-back">
                <Markdown source={card.back} />
              </div>
            )}
          </div>
          {flipped ? (
            <div className="grade-row">
              <button className="g0" onClick={() => grade(0)}>😵 Again</button>
              <button className="g1" onClick={() => grade(1)}>😬 Hard</button>
              <button className="g2" onClick={() => grade(2)}>🙂 Good</button>
              <button className="g3" onClick={() => grade(3)}>😎 Easy</button>
            </div>
          ) : (
            <div className="grade-row">
              <button className="primary" onClick={() => setFlipped(true)}>Show answer</button>
            </div>
          )}
        </>
      )}
    </>
  );
}

/** Coding drills: exercises from finished lessons, solved again from scratch on a spaced schedule. */
function Drills() {
  const completed = useGame((s) => s.completed);
  const reviewDrill = useGame((s) => s.reviewDrill);
  // A fixed session queue: finishing a drill reschedules it without reshuffling the list
  const [queue] = useState<Drill[]>(() => dueDrills(useGame.getState()));
  const [at, setAt] = useState(0);
  const [solved, setSolved] = useState(false);
  const drill = queue[at];

  if (!Object.keys(completed).length)
    return (
      <div className="card empty">
        <div className="big-emoji">📭</div>
        <p>Drills come from coding exercises in lessons you've finished. <Link to="/">Complete a lesson</Link> to start.</p>
      </div>
    );
  if (!drill)
    return (
      <div className="card empty">
        <div className="big-emoji">🎉</div>
        <h3>{at ? `Session complete: ${at} drill${at > 1 ? 's' : ''} done!` : 'No drills due right now.'}</h3>
        <p className="muted">Exercises come back a couple of days after you finish a lesson, then at growing intervals: 4 days, 10, 25… A drill you needed help with comes back the next day.</p>
      </div>
    );

  return (
    <>
      <p className="muted small">
        Drill {at + 1} of {queue.length} · from {drill.track.icon} <Link to={`/lesson/${drill.lesson.id}`}>{drill.lesson.title}</Link>. Solve it again from scratch, without peeking at your old answer: recalling how is what makes the skill stick.
      </p>
      <div className="card drill">
        <CodeExercise
          key={drill.key}
          ex={drill.ex}
          lessonId={`drill-${drill.key}`}
          title={drill.lesson.title}
          done={false}
          onComplete={(o) => {
            reviewDrill(drill.key, !o.solution && o.hints <= 1 && !o.scale);
            setSolved(true);
          }}
        />
        {solved && (
          <button className="primary" onClick={() => { setAt(at + 1); setSolved(false); }}>
            {at + 1 < queue.length ? 'Next drill →' : 'Finish'}
          </button>
        )}
      </div>
    </>
  );
}
