import { create } from 'zustand';

export interface GameState {
  score: number;
  lives: number;
  isPaused: boolean;
  isGameOver: boolean;
  gameOverOpacity: number;
  speedMultiplier: number;
  elapsedTime: number;
  flashOpacity: number;
  lastMilestone: number;

  addScore: (points: number) => void;
  loseLife: () => void;
  togglePause: () => void;
  resumeGame: () => void;
  setGameOver: (v: boolean) => void;
  setGameOverOpacity: (v: number) => void;
  setSpeedMultiplier: (v: number) => void;
  setElapsedTime: (v: number) => void;
  setFlashOpacity: (v: number) => void;
  setLastMilestone: (v: number) => void;
  restart: () => void;
}

const initialState = {
  score: 0,
  lives: 3,
  isPaused: false,
  isGameOver: false,
  gameOverOpacity: 0,
  speedMultiplier: 1,
  elapsedTime: 0,
  flashOpacity: 0,
  lastMilestone: 0,
};

export const useGameStore = create<GameState>((set) => ({
  ...initialState,

  addScore: (points) =>
    set((s) => ({ score: s.score + points })),

  loseLife: () =>
    set((s) => ({ lives: Math.max(0, s.lives - 1) })),

  togglePause: () =>
    set((s) => ({ isPaused: !s.isPaused })),

  resumeGame: () =>
    set({ isPaused: false }),

  setGameOver: (v) => set({ isGameOver: v }),

  setGameOverOpacity: (v) => set({ gameOverOpacity: v }),

  setSpeedMultiplier: (v) => set({ speedMultiplier: v }),

  setElapsedTime: (v) => set({ elapsedTime: v }),

  setFlashOpacity: (v) => set({ flashOpacity: v }),

  setLastMilestone: (v) => set({ lastMilestone: v }),

  restart: () => set({ ...initialState }),
}));
