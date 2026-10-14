import { useState } from 'react';
import type { QuizQuestion } from '../content/types';
import { shuffled } from '../engine/shuffle';

/** Quiz text with `inline code` shown as code. */
export function Inline({ text }: { text: string }) {
  return <>{text.split(/`([^`]+)`/).map((part, i) => (i % 2 ? <code key={i}>{part}</code> : part))}</>;
}

/** Options that refer to other options ("all of the above") keep their order. */
const ORDER_BOUND = /\b(above|below|both of|none of|all of)\b/i;

/** The question with its options in a fresh random order (and the answer index moved with them). */
export function shuffleOptions(q: QuizQuestion): QuizQuestion {
  if (q.options.some((o) => ORDER_BOUND.test(o))) return q;
  const order = shuffled(q.options.map((_, i) => i));
  return { ...q, options: order.map((i) => q.options[i]), answer: order.indexOf(q.answer) };
}

type Card = { q: QuizQuestion; review: boolean };
/** A module test: one attempt per question, a pass mark, and `extra()` review questions from earlier lessons. */
export type ExamMode = { passMark: number; extra?: () => QuizQuestion[] };

/**
 * Multiple-choice quiz with shuffled options. Practice mode: wrong answers explain and let you retry; finishing
 * reports whether every answer was right first time. Exam mode: each question is answered once, and the quiz
 * completes only with a score at or above the pass mark (otherwise: review the mistakes and retake).
 */
export function Quiz({ questions, onComplete, done, onMistake, exam }: { questions: QuizQuestion[]; onComplete: (perfect: boolean) => void; done?: boolean; onMistake?: () => void; exam?: ExamMode }) {
  const build = (): Card[] => [...questions.map((q) => ({ q, review: false })), ...(exam?.extra?.() ?? []).map((q) => ({ q, review: true }))].map((c) => ({ ...c, q: shuffleOptions(c.q) }));
  const [deck, setDeck] = useState<Card[]>(build);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [missed, setMissed] = useState<Card[]>([]);
  const [finished, setFinished] = useState(false);
  const [passedOnce, setPassedOnce] = useState(false);
  /** Wrong options already tried on the current question (ruled out after a miss). */
  const [tried, setTried] = useState<number[]>([]);
  const card = deck[idx];
  const q = card?.q;
  const correct = picked === q?.answer;
  const locked = exam ? picked !== null : correct;

  const pick = (i: number) => {
    if (locked) return;
    setPicked(i);
    if (i !== q.answer) {
      setTried((t) => (t.includes(i) ? t : [...t, i]));
      setMistakes((m) => m + 1);
      if (exam) setMissed((m) => [...m, card]);
      onMistake?.();
    }
  };

  const restart = () => {
    setDeck(build());
    setIdx(0);
    setPicked(null);
    setMistakes(0);
    setMissed([]);
    setTried([]);
    setFinished(false);
  };

  const next = () => {
    if (idx + 1 < deck.length) {
      setIdx(idx + 1);
      setPicked(null);
      setTried([]);
      return;
    }
    setFinished(true);
    if (!exam) return onComplete(mistakes === 0);
    const score = (deck.length - missed.length) / deck.length;
    if (score >= exam.passMark && !passedOnce) {
      setPassedOnce(true);
      onComplete(missed.length === 0);
    }
  };

  if (finished && exam) {
    const right = deck.length - missed.length;
    const pct = Math.round((100 * right) / deck.length);
    const pass = right / deck.length >= exam.passMark;
    return (
      <div className="quiz-done">
        <div className="big-emoji">{pass ? (missed.length ? '✅' : '💎') : '📚'}</div>
        <h3>{pass ? `Passed: ${right}/${deck.length} (${pct}%)` : `Not yet: ${right}/${deck.length} (${pct}%)`}</h3>
        <p className="muted">
          {pass ? (missed.length ? 'Well done. Look over the questions you missed before moving on.' : 'A perfect score!') : `You need ${Math.round(exam.passMark * 100)}% to pass. Review the answers below, re-read those lessons if you need to, then retake the test with reshuffled questions.`}
        </p>
        {missed.length > 0 && (
          <div className="missed">
            {missed.map((c, i) => (
              <div key={i} className="missed-q">
                <b><Inline text={c.q.q} /></b>
                {c.q.code && <pre className="quiz-code"><code>{c.q.code}</code></pre>}
                <div>✅ <Inline text={c.q.options[c.q.answer]} /></div>
                {c.q.explain && <div className="muted small"><Inline text={c.q.explain} /></div>}
              </div>
            ))}
          </div>
        )}
        <button className={pass ? '' : 'primary'} onClick={restart}>{pass ? 'Take it again' : '↻ Retake the test'}</button>
      </div>
    );
  }

  if (finished)
    return (
      <div className="quiz-done">
        <div className="big-emoji">{mistakes === 0 ? '💎' : '✅'}</div>
        <h3>{mistakes === 0 ? 'Flawless!' : 'Quiz complete!'}</h3>
        <p className="muted">{mistakes === 0 ? 'Every answer right on the first try.' : `${mistakes} wrong attempt${mistakes > 1 ? 's' : ''} along the way. That's how you learn.`}</p>
        <button onClick={restart}>Retake quiz</button>
      </div>
    );

  return (
    <div className="quiz">
      {exam && (
        <div className="muted small exam-note">
          📝 Test: each question counts once. Pass mark {Math.round(exam.passMark * 100)}%. Question {idx + 1} of {deck.length}.
        </div>
      )}
      <div className="quiz-progress">
        {deck.map((_, i) => (
          <span key={i} className={i < idx ? 'done' : i === idx ? 'cur' : ''} />
        ))}
      </div>
      {card.review && <div className="pill review-pill">🔁 Review: from an earlier lesson</div>}
      <h3 className="quiz-q"><Inline text={q.q} /></h3>
      {q.code && <pre className="quiz-code"><code>{q.code}</code></pre>}
      <div className="quiz-opts">
        {q.options.map((o, i) => {
          const state = picked === null ? '' : i === q.answer && (correct || exam) ? 'right' : i === picked ? 'wrong' : tried.includes(i) && !correct ? 'tried' : '';
          return (
            <button key={i} className={`opt ${state}`} onClick={() => pick(i)} disabled={(exam && picked !== null) || (!correct && tried.includes(i) && i !== picked)} aria-label={tried.includes(i) && !correct ? `${o} (already tried)` : undefined}>
              <span className="opt-key">{'ABCDEF'[i]}</span> <Inline text={o} />
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className={`feedback ${correct ? 'ok' : 'bad'}`}>
          {correct ? '✅ Correct! ' : exam ? '❌ Not quite. The right answer is highlighted. ' : '❌ Not quite. Try again. '}
          {(correct || exam) && q.explain && <Inline text={q.explain} />}
          {!correct && !exam && tried.length >= 2 && (
            <div className="nudge">
              💡 You've ruled out {tried.length} options, so you're getting closer. Skim the lesson above for this topic, then pick from the {q.options.length - tried.length} that are left.
            </div>
          )}
        </div>
      )}
      {locked && (
        <button className="primary" onClick={next}>
          {idx + 1 < deck.length ? 'Next question →' : exam ? 'See my score' : done ? 'Finish' : 'Finish & claim XP'}
        </button>
      )}
    </div>
  );
}
