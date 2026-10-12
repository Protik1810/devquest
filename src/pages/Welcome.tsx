import { useState } from 'react';
import { useGame } from '../engine/store';

export function Welcome() {
  const setName = useGame((s) => s.setName);
  const [name, setLocal] = useState('');
  // New learners pick a career path (or a single language) right after naming themselves
  const start = () => {
    if (!name.trim()) return;
    window.location.hash = '#/paths';
    setName(name.trim());
  };
  return (
    <div className="welcome">
      <div className="welcome-card">
        <img src="./icon.svg" alt="" width={72} height={72} />
        <h1>Welcome to DevQuest</h1>
        <p className="lead">
          A game-like academy that takes you from <b>"what is a bit?"</b> to <b>designing distributed systems</b>. You'll write real code, run real commands, and level up as you go.
        </p>
        <div className="welcome-features">
          <div><span aria-hidden="true">🧭</span><span><b>11 career paths</b> or one language</span></div>
          <div><span aria-hidden="true">🔤</span><span><b>20 languages</b>, hands-on</span></div>
          <div><span aria-hidden="true">🗄️</span><span><b>5 databases</b>, right in the app</span></div>
          <div><span aria-hidden="true">🐚</span><span>Safe <b>Linux terminal</b> sandbox</span></div>
          <div><span aria-hidden="true">🎨</span><span><b>Illustrations</b> & visualizers</span></div>
          <div><span aria-hidden="true">🃏</span><span><b>Spaced-repetition</b> flashcards</span></div>
          <div><span aria-hidden="true">🔥</span><span>XP, streaks, quests & gems</span></div>
          <div><span aria-hidden="true">🤖</span><span>Optional <b>AI tutor</b> & agent</span></div>
        </div>
        <label className="welcome-name">
          What should we call you, adventurer?
          <input autoFocus value={name} onChange={(e) => setLocal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && start()} placeholder="Your name" maxLength={30} />
        </label>
        <button className="primary big" onClick={start} disabled={!name.trim()}>
          Start my quest →
        </button>
        <p className="muted small">Your progress is saved on this device. No account needed.</p>
        <p className="small credit-line">Created and developed by <b>Protik</b></p>
      </div>
    </div>
  );
}
