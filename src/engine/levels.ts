/** XP needed to reach `level` (level 1 = 0 XP). Grows quadratically. */
export const xpForLevel = (level: number) => 50 * (level - 1) * level;

export function levelFromXp(xp: number) {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  const floor = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { level, into: xp - floor, span: next - floor, progress: (xp - floor) / (next - floor) };
}

const RANKS: [number, string, string][] = [
  [1, 'Novice', '🌱'],
  [3, 'Apprentice', '🔧'],
  [6, 'Coder', '💻'],
  [10, 'Engineer', '⚙️'],
  [15, 'Senior Engineer', '🛠️'],
  [20, 'Architect', '🏛️'],
  [30, 'Archmage', '🧙'],
];

export function rankFor(level: number) {
  let r = RANKS[0];
  for (const rank of RANKS) if (level >= rank[0]) r = rank;
  const next = RANKS.find((x) => x[0] > level);
  return { name: r[1], emoji: r[2], nextName: next?.[1], nextLevel: next?.[0] };
}

export const today = (d = new Date()) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
};

export const daysBetween = (a: string, b: string) =>
  Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
