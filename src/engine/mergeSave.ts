/**
 * Merges two progress saves (zustand-persist JSON: { state, version }) from different devices, so syncing never
 * loses work: lessons, achievements and custom projects are united, counters keep the higher value, each flashcard
 * keeps its most-practised schedule, and per-device things (settings, today's quests, the path) stay local.
 */
type Save = { state: Record<string, unknown>; version?: number };

type Completed = Record<string, { xp: number; at: string }>;
type Card = { due: string; interval: number; ease: number; reps: number };
type Project = { code: string; grades: unknown[]; best: number };

const obj = <T>(v: unknown) => (v && typeof v === 'object' ? (v as T) : ({} as T));
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

function maxPerKey(a: Record<string, number>, b: Record<string, number>) {
  const out: Record<string, number> = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = Math.max(num(out[k]), num(v));
  return out;
}

export function mergeSaves(localText: string, remoteText: string): string {
  const local = JSON.parse(localText) as Save;
  const remote = JSON.parse(remoteText) as Save;
  const L = obj<Record<string, unknown>>(local.state);
  const R = obj<Record<string, unknown>>(remote.state);

  const completed: Completed = { ...obj<Completed>(R.completed) };
  for (const [id, c] of Object.entries(obj<Completed>(L.completed))) {
    const other = completed[id];
    completed[id] = !other || c.at <= other.at ? c : other; // keep the earliest completion
  }

  const achievements: Record<string, string> = { ...obj<Record<string, string>>(R.achievements) };
  for (const [id, at] of Object.entries(obj<Record<string, string>>(L.achievements))) if (!achievements[id] || at < achievements[id]) achievements[id] = at;

  const srs: Record<string, Card> = { ...obj<Record<string, Card>>(R.srs) };
  for (const [id, c] of Object.entries(obj<Record<string, Card>>(L.srs))) {
    const o = srs[id];
    srs[id] = !o || c.reps > o.reps || (c.reps === o.reps && c.due >= o.due) ? c : o;
  }

  const projects: Record<string, Project> = { ...obj<Record<string, Project>>(R.projects) };
  for (const [id, p] of Object.entries(obj<Record<string, Project>>(L.projects))) {
    const o = projects[id];
    projects[id] = !o || num(p.best) >= num(o.best) ? p : o;
  }

  const custom = [...(Array.isArray(L.customProjects) ? L.customProjects : [])] as { id: string }[];
  for (const p of (Array.isArray(R.customProjects) ? R.customProjects : []) as { id: string }[]) if (!custom.some((c) => c.id === p.id)) custom.push(p);

  const ls = obj<{ count: number; best: number; last: string }>(L.streak);
  const rs = obj<{ count: number; best: number; last: string }>(R.streak);
  const newer = (ls.last ?? '') >= (rs.last ?? '') ? ls : rs;
  const streak = { count: num(newer.count), best: Math.max(num(ls.best), num(rs.best)), last: newer.last ?? '' };

  const merged = {
    ...L,
    name: (L.name as string) || (R.name as string) || '',
    xp: Math.max(num(L.xp), num(R.xp)),
    gems: Math.max(num(L.gems), num(R.gems)),
    freezes: Math.max(num(L.freezes), num(R.freezes)),
    completed,
    achievements,
    srs,
    projects,
    customProjects: custom,
    streak,
    stats: maxPerKey(obj(L.stats), obj(R.stats)),
    xpLog: maxPerKey(obj(L.xpLog), obj(R.xpLog)),
    struggles: maxPerKey(obj(L.struggles), obj(R.struggles)),
    path: L.path !== undefined ? L.path : R.path,
  };
  // Keep this app's persist version, so its own migrations still apply
  return JSON.stringify({ ...local, state: merged });
}
