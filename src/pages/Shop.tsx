import { SHOP, useGame } from '../engine/store';

export function Shop() {
  const gems = useGame((s) => s.gems);
  const freezes = useGame((s) => s.freezes);
  const potionUntil = useGame((s) => s.potionUntil);
  const buy = useGame((s) => s.buy);
  const potionMin = Math.max(0, Math.ceil((potionUntil - Date.now()) / 60000));
  return (
    <div>
      <h1>💎 Gem Shop</h1>
      <p className="muted">
        You have <b>{gems} 💎</b>. Earn gems by finishing lessons (+2, or +5 when flawless), claiming daily quests and levelling up (+25). Gems are earned by learning only, never bought.
      </p>
      <div className="shop-grid">
        {SHOP.map((item) => {
          const owned = item.id === 'freeze' ? `${freezes}/3 owned` : potionMin ? `active: ${potionMin} min left` : '';
          const blocked = item.id === 'freeze' && freezes >= 3;
          return (
            <div key={item.id} className="card shop-item">
              <div className="big-emoji">{item.emoji}</div>
              <h3>{item.name}</h3>
              <p className="muted small">{item.desc}</p>
              {owned && <div className="pill">{owned}</div>}
              <button className="primary" disabled={gems < item.cost || blocked} onClick={() => buy(item.id)}>
                {blocked ? 'Max owned' : `Buy for ${item.cost} 💎`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
