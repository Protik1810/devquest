import { create } from 'zustand';

/** What the learner is currently looking at, shared with the AI tutor. */
type LessonCtx = { title: string; prompt: string; code: string; set: (p: Partial<Omit<LessonCtx, 'set'>>) => void };

export const useLessonCtx = create<LessonCtx>((set) => ({ title: '', prompt: '', code: '', set: (p) => set(p) }));
