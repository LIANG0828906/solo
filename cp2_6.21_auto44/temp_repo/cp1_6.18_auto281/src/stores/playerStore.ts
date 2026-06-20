import { create } from 'zustand';
import { EchoInfo } from '../types/dataTypes';

interface PlayerState {
  position: { x: number; z: number };
  steps: number;
  echoes: EchoInfo[];
  soundIntensity: number;
  setPosition: (x: number, z: number) => void;
  incrementStep: () => void;
  updateEchoes: (echoes: EchoInfo[]) => void;
  updateSoundIntensity: (intensity: number) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  position: { x: 0, z: 0 },
  steps: 0,
  echoes: [],
  soundIntensity: 0,

  setPosition: (x, z) =>
    set({ position: { x, z } }),

  incrementStep: () =>
    set((state) => ({ steps: state.steps + 1 })),

  updateEchoes: (echoes) =>
    set({ echoes: echoes.slice(0, 5) }),

  updateSoundIntensity: (intensity) =>
    set({ soundIntensity: Math.max(0, Math.min(100, intensity)) }),
}));
