import { create } from "zustand";
interface ProgressState {
  progress: number;
  velocity: number;
  reducedMotion: boolean;
  ready: boolean;
  pointer: { x: number; y: number };
  setProgress: (progress: number, velocity: number) => void;
}
export const useProgress = create<ProgressState>((set) => ({
  progress: 0,
  velocity: 0,
  reducedMotion: false,
  ready: false,
  pointer: { x: 0, y: 0 },
  setProgress: (progress, velocity) =>
    set({
      progress: Math.max(0, Math.min(1, progress)),
      velocity: Math.max(-1, Math.min(1, velocity)),
    }),
}));
