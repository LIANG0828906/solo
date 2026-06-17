export type GameState = 'idle' | 'playing' | 'paused' | 'gameover';

export interface GameStore {
  state: GameState;
  score: number;
  lives: number;
  bpm: number;
  speedMultiplier: number;
  progress: number;
  flashRed: boolean;
  setGameState: (state: GameState) => void;
  setScore: (score: number) => void;
  addScore: (points: number) => void;
  setLives: (lives: number) => void;
  setBpm: (bpm: number) => void;
  setSpeedMultiplier: (mult: number) => void;
  setProgress: (progress: number) => void;
  setFlashRed: (flash: boolean) => void;
  reset: () => void;
}

import { create } from 'zustand';

export const useGameStore = create<GameStore>((set) => ({
  state: 'idle',
  score: 0,
  lives: 3,
  bpm: 150,
  speedMultiplier: 1,
  progress: 0,
  flashRed: false,
  setGameState: (state) => set({ state }),
  setScore: (score) => set({ score }),
  addScore: (points) =>
    set((s) => {
      const newScore = s.score + points;
      const newMult = Math.min(2, 1 + Math.floor(newScore / 100) * 0.1);
      return { score: newScore, speedMultiplier: newMult };
    }),
  setLives: (lives) => set({ lives }),
  setBpm: (bpm) => set({ bpm }),
  setSpeedMultiplier: (speedMultiplier) => set({ speedMultiplier }),
  setProgress: (progress) => set({ progress }),
  setFlashRed: (flashRed) => set({ flashRed }),
  reset: () =>
    set({
      state: 'idle',
      score: 0,
      lives: 3,
      bpm: 150,
      speedMultiplier: 1,
      progress: 0,
      flashRed: false,
    }),
}));
