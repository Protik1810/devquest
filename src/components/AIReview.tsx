import { useState } from 'react';
import { Link } from 'react-router-dom';
import { reviewCode, useAIReady, type CodeReview } from '../engine/ai';
import { useGame } from '../engine/store';

/** "Get AI feedback" button and the review card it produces. */
export function AIReview({ title, prompt, lang, code, passed, output }: { title: string; prompt: string; lang: string; code: string; passed?: boolean; output?: string }) {
  const ready = useAIReady();
  const bump = useGame((s) => s.bump);
  const [review, setReview] = useState<CodeReview | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    setErr('');
    try {
      setReview(await reviewCode({ title, prompt, lang, code, passed, output }));
      bump('aiReviews');
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!ready)
    return (
      <div className="ai-review muted small">
        🤖 Want feedback on your code quality? Set up an AI provider in <Link to="/settings">Settings</Link>. It can be a free local model.
      </div>
    );

  return (
    <div className="ai-review">
      {!review && (
        <button onClick={run} disabled={busy}>
          {busy ? '🤖 Reviewing your code…' : '🤖 Get AI code review'}
        </button>
      )}
      {err && <div className="feedback bad small">⚠️ {err}</div>}
      {review && (
        <div className="review-card">
          <div className="row">
            <div className={`score-badge s${Math.min(3, Math.floor(review.score / 3))}`}>{review.score}/10</div>
            <div className="grow">
              <b>AI code review</b>
              <div className="small">{review.summary}</div>
            </div>
            <button className="ghost small" onClick={run} disabled={busy} title="Review again">{busy ? '…' : '↻'}</button>
          </div>
          {review.strengths.length > 0 && (
            <div className="review-sec">
              <b className="small">👍 What's good</b>
              <ul>{review.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          )}
          {review.issues.length > 0 && (
            <div className="review-sec">
              <b className="small">🔧 To improve</b>
              <ul>
                {review.issues.map((s, i) => (
                  <li key={i}>
                    {s.issue}
                    {s.hint && <div className="muted small">💡 {s.hint}</div>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {review.next_step && <div className="small"><b>➡️ Next step:</b> {review.next_step}</div>}
        </div>
      )}
    </div>
  );
}
