import { create } from 'zustand';
import type { ParticleSnapshot } from '../modules/particleSystem';

interface ParticleState {
  currentSnapshot: ParticleSnapshot | null;
  historySnapshots: ParticleSnapshot[];
  isPlaying: boolean;
  currentTime: number;
  windSpeed: number;
  setCurrentSnapshot: (snapshot: ParticleSnapshot) => void;
  addHistorySnapshot: (snapshot: ParticleSnapshot) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setWindSpeed: (speed: number) => void;
  clearHistory: () => void;
  reset: () => void;
}

export const useParticleStore = create<ParticleState>((set) => ({
  currentSnapshot: null,
  historySnapshots: [],
  isPlaying: false,
  currentTime: 0,
  windSpeed: 5,

  setCurrentSnapshot: (snapshot) =>
    set(() => ({
      currentSnapshot: snapshot,
      currentTime: snapshot.timestamp,
    })),

  addHistorySnapshot: (snapshot) =>
    set((state) => {
      const newHistory = [...state.historySnapshots, snapshot];
      const maxFrames = 1800;
      if (newHistory.length > maxFrames) {
        newHistory.shift();
      }
      return { historySnapshots: newHistory };
    }),

  setIsPlaying: (playing) => set(() => ({ isPlaying: playing })),

  setCurrentTime: (time) => set(() => ({ currentTime: time })),

  setWindSpeed: (speed) => set(() => ({ windSpeed: speed })),

  clearHistory: () => set(() => ({ historySnapshots: [] })),

  reset: () =>
    set(() => ({
      currentSnapshot: null,
      historySnapshots: [],
      isPlaying: false,
      currentTime: 0,
    })),
}));
