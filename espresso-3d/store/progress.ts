import { create } from "zustand";

type ProgressState = {
  progress: number;
  velocity: number;
  cursor: { x: number; y: number };
  reducedMotion: boolean;
  ready: boolean;
  setScroll: (progress: number, velocity: number) => void;
  setCursor: (x: number, y: number) => void;
  setReducedMotion: (value: boolean) => void;
  setReady: (value: boolean) => void;
};

export const useProgress = create<ProgressState>((set) => ({
  progress: 0, velocity: 0, cursor: { x: 0, y: 0 }, reducedMotion: false, ready: false,
  setScroll: (progress, velocity) => set((state) => ({
    progress: Math.min(1, Math.max(0, progress)),
    velocity: state.reducedMotion ? 0 : Math.min(1, Math.max(-1, velocity / 2400)),
  })),
  setCursor: (x, y) => set({ cursor: { x, y } }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion, ...(reducedMotion ? { velocity: 0 } : {}) }),
  setReady: (ready) => set({ ready }),
}));
