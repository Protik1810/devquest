import { create } from 'zustand';

export type Toast = { id: number; kind: 'xp' | 'level' | 'achievement' | 'info' | 'error'; title: string; body?: string };

export const useToasts = create<{ list: Toast[] }>(() => ({ list: [] }));

let nextId = 1;
export function toast(t: Omit<Toast, 'id'>) {
  const id = nextId++;
  useToasts.setState((s) => ({ list: [...s.list, { ...t, id }].slice(-5) }));
  setTimeout(() => useToasts.setState((s) => ({ list: s.list.filter((x) => x.id !== id) })), t.kind === 'level' || t.kind === 'achievement' ? 5000 : 3000);
}
