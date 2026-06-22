import { create } from 'zustand';

interface GameState {
  score: number;
  combo: number;
  maxCombo: number;
  lives: number;
  isPaused: boolean;
  isGameOver: boolean;
}

interface GameActions {
  addScore: (points: number) => void;
  incrementCombo: () => void;
  resetCombo: () => void;
  loseLife: () => void;
  setPaused: (paused: boolean) => void;
  setGameOver: (over: boolean) => void;
  resetGame: () => void;
}

const initialState: GameState = {
  score: 0,
  combo: 0,
  maxCombo: 0,
  lives: 3,
  isPaused: false,
  isGameOver: false,
};

export const useGameStore = create<GameState & GameActions>((set) => ({
  ...initialState,

  addScore: (points: number) =>
    set((state) => ({
      score: state.score + points,
    })),

  incrementCombo: () =>
    set((state) => {
      const newCombo = state.combo + 1;
      return {
        combo: newCombo,
        maxCombo: Math.max(state.maxCombo, newCombo),
      };
    }),

  resetCombo: () =>
    set(() => ({
      combo: 0,
    })),

  loseLife: () =>
    set((state) => {
      const newLives = state.lives - 1;
      return {
        lives: newLives,
        isGameOver: newLives <= 0,
      };
    }),

  setPaused: (paused: boolean) =>
    set(() => ({
      isPaused: paused,
    })),

  setGameOver: (over: boolean) =>
    set(() => ({
      isGameOver: over,
    })),

  resetGame: () =>
    set(() => ({
      ...initialState,
    })),
}));
