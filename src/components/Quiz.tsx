import { useState } from 'react';
import type { QuizQuestion } from '../content/types';

/** Multiple-choice quiz. Wrong answers explain and let you retry; finishing reports whether every answer was right first time. */
export function Quiz({ questions, onComplete, done, onMistake }: { questions: QuizQuestion[]; onComplete: (perfect: boolean) => void; done?: boolean; onMistake?: () => void }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [finished, setFinished] = useState(false);
  /** Wrong options already tried on the current question (ruled out after a miss). */
  const [tried, setTried] = useState<number[]>([]);
  const q = questions[idx];
  const correct = picked === q?.answer;

  const pick = (i: number) => {
    if (picked !== null && correct) return;
    setPicked(i);
    if (i !== q.answer) {
      setTried((t) => (t.includes(i) ? t : [...t, i]));
      setMistakes((m) => m + 1);
      onMistake?.();
    }
  };

  const next = () => {
    if (idx + 1 < questions.length) {
      setIdx(idx + 1);
      setPicked(null);
      setTried([]);
    } else {
      setFinished(true);
      onComplete(mistakes === 0);
    }
  };

  if (finished)
    return (
      <div className="quiz-done">
        <div className="big-emoji">{mistakes === 0 ? '💎' : '✅'}</div>
        <h3>{mistakes === 0 ? 'Flawless!' : 'Quiz complete!'}</h3>
        <p className="muted">{mistakes === 0 ? 'Every answer right on the first try.' : `${mistakes} wrong attempt${mistakes > 1 ? 's' : ''} along the way. That's how you learn.`}</p>
        <button onClick={() => { setIdx(0); setPicked(null); setMistakes(0); setTried([]); setFinished(false); }}>Retake quiz</button>
      </div>
    );

  return (
    <div className="quiz">
      <div className="quiz-progress">
        {questions.map((_, i) => (
          <span key={i} className={i < idx ? 'done' : i === idx ? 'cur' : ''} />
        ))}
      </div>
      <h3 className="quiz-q">{q.q}</h3>
      <div className="quiz-opts">
        {q.options.map((o, i) => {
          const state = picked === null ? '' : i === q.answer && correct ? 'right' : i === picked ? 'wrong' : tried.includes(i) && !correct ? 'tried' : '';
          return (
            <button key={i} className={`opt ${state}`} onClick={() => pick(i)} disabled={!correct && tried.includes(i) && i !== picked} aria-label={tried.includes(i) && !correct ? `${o} (already tried)` : undefined}>
              <span className="opt-key">{'ABCD'[i]}</span> {o}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className={`feedback ${correct ? 'ok' : 'bad'}`}>
          {correct ? '✅ Correct! ' : '❌ Not quite. Try again. '}
          {correct && q.explain}
          {!correct && tried.length >= 2 && (
            <div className="nudge">
              💡 You've ruled out {tried.length} options, so you're getting closer. Skim the lesson above for this topic, then pick from the {q.options.length - tried.length} that are left.
            </div>
          )}
        </div>
      )}
      {correct && (
        <button className="primary" onClick={next}>
          {idx + 1 < questions.length ? 'Next question →' : done ? 'Finish' : 'Finish & claim XP'}
        </button>
      )}
    </div>
  );
}
