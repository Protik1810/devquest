import { ACHIEVEMENTS, useGame } from '../engine/store';
import { levelFromXp, rankFor } from '../engine/levels';

export function Achievements() {
  const s = useGame();
  const got = s.achievements;
  const lv = levelFromXp(s.xp);
  const rank = rankFor(lv.level);
  const stats: [string, string | number][] = [
    ['Level', `${lv.level} (${rank.emoji} ${rank.name})`],
    ['Total XP', s.xp.toLocaleString()],
    ['Lessons completed', Object.keys(s.completed).length],
    ['Best streak', `${s.streak.best} days`],
    ['Flawless exercises', s.stats.perfect],
    ['Code runs', s.stats.runs],
    ['Terminal commands', s.stats.commands],
    ['Flashcards reviewed', s.stats.reviews],
    ['Hints used', s.stats.hints],
    ['Quests claimed', s.stats.questsClaimed],
  ];
  return (
    <div>
      <h1>🏆 Achievements</h1>
      <p className="muted">
        {Object.keys(got).length} of {ACHIEVEMENTS.length} unlocked
      </p>
      <div className="ach-grid">
        {ACHIEVEMENTS.map((a) => (
          <div key={a.id} className={`card ach ${got[a.id] ? 'got' : 'locked'}`}>
            <div className="big-emoji">{got[a.id] ? a.emoji : '🔒'}</div>
            <b>{a.name}</b>
            <div className="muted small">{a.desc}</div>
            {got[a.id] && <div className="small">Unlocked {got[a.id]}</div>}
          </div>
        ))}
      </div>
      <h2>📊 Stats</h2>
      <div className="card">
        <table className="stats">
          <tbody>
            {stats.map(([k, v]) => (
              <tr key={k}>
                <td className="muted">{k}</td>
                <td><b>{v}</b></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
