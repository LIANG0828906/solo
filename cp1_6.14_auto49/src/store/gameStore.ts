import { create } from 'zustand';
import { GameState, Level } from '../types';
import { mockLevels } from '../data/questions';

interface GameStore extends GameState {
  levels: Level[];
  displayScore: number;
  heartBreakIndex: number | null;
  setCurrentLevel: (level: number) => void;
  decrementLives: () => void;
  addScore: (points: number) => void;
  incrementCombo: () => void;
  resetCombo: () => void;
  completeLevel: (levelId: number) => void;
  resetLives: () => void;
  resetGame: () => void;
  animateScore: (targetScore: number) => void;
  clearHeartBreak: () => void;
}

const initialState: GameState = {
  currentLevel: 1,
  lives: 3,
  score: 0,
  combo: 0,
  completedLevels: [],
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,
  levels: mockLevels,
  displayScore: 0,
  heartBreakIndex: null,

  setCurrentLevel: (level: number) => set({ currentLevel: level }),

  decrementLives: () =>
    set((state) => {
      const newLives = Math.max(0, state.lives - 1);
      return {
        lives: newLives,
        heartBreakIndex: state.lives - 1,
        combo: 0,
      };
    }),

  addScore: (points: number) => {
    const state = get();
    const comboMultiplier = 1 + state.combo * 0.2;
    const finalPoints = Math.round(points * comboMultiplier);
    const newScore = state.score + finalPoints;
    set({ score: newScore });
    get().animateScore(newScore);
  },

  animateScore: (targetScore: number) => {
    const state = get();
    const startScore = state.displayScore;
    const diff = targetScore - startScore;
    const duration = 500;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startScore + diff * easeOut);
      set({ displayScore: current });
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  },

  incrementCombo: () => set((state) => ({ combo: state.combo + 1 })),

  resetCombo: () => set({ combo: 0 }),

  completeLevel: (levelId: number) =>
    set((state) => {
      if (state.completedLevels.includes(levelId)) return state;
      const newCompletedLevels = [...state.completedLevels, levelId];
      const nextLevelId = levelId + 1;
      const newLevels = state.levels.map((l) => {
        if (l.id === levelId) return { ...l, status: 'completed' as const };
        if (l.id === nextLevelId) return { ...l, status: 'current' as const };
        return l;
      });
      return {
        completedLevels: newCompletedLevels,
        levels: newLevels,
      };
    }),

  resetLives: () => set({ lives: 3, heartBreakIndex: null }),

  resetGame: () =>
    set({
      ...initialState,
      levels: mockLevels,
      displayScore: 0,
      heartBreakIndex: null,
    }),

  clearHeartBreak: () => set({ heartBreakIndex: null }),
}));
