import { create } from 'zustand';

export type GamePhase = 'idle' | 'running' | 'paused' | 'gameover';

interface GameState {
  score: number;
  displayScore: number;
  combo: number;
  maxCombo: number;
  phase: GamePhase;
  notesCollected: number;
  addScore: (points: number) => void;
  setCombo: (count: number) => void;
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: () => void;
  resetGame: () => void;
  collectNote: () => void;
  tickDisplayScore: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  score: 0,
  displayScore: 0,
  combo: 0,
  maxCombo: 0,
  phase: 'idle',
  notesCollected: 0,

  addScore: (points: number) =>
    set((s) => ({ score: s.score + points })),

  setCombo: (count: number) =>
    set((s) => ({
      combo: count,
      maxCombo: Math.max(s.maxCombo, count),
    })),

  startGame: () => set({ phase: 'running' }),
  pauseGame: () => set({ phase: 'paused' }),
  resumeGame: () => set({ phase: 'running' }),
  endGame: () => set({ phase: 'gameover' }),

  resetGame: () =>
    set({
      score: 0,
      displayScore: 0,
      combo: 0,
      maxCombo: 0,
      phase: 'idle',
      notesCollected: 0,
    }),

  collectNote: () =>
    set((s) => ({ notesCollected: s.notesCollected + 1 })),

  tickDisplayScore: () => {
    const { score, displayScore } = get();
    if (displayScore < score) {
      const diff = score - displayScore;
      const step = Math.max(1, Math.ceil(diff / 6));
      set({ displayScore: Math.min(displayScore + step, score) });
    }
  },
}));
