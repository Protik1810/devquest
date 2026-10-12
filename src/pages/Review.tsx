import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ALL_CARDS } from '../content';
import { useGame } from '../engine/store';
import { today } from '../engine/levels';
import { Markdown } from '../components/Markdown';

export function Review() {
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
    <div className="review">
      <h1>🃏 Review</h1>
      <p className="muted">
        Spaced repetition shows each card just before you'd forget it. Cards unlock as you complete lessons. You have <b>{unlocked.length}</b> of {ALL_CARDS.length}.
      </p>
      <div className="tabs">
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
    </div>
  );
}
