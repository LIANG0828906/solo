import { create } from 'zustand';
import { GameState, GameActions, ThrowRecord } from '../types/game';

type Store = GameState & GameActions;

export const useGameStore = create<Store>((set, get) => ({
  totalScore: 0,
  currentRound: 1,
  maxRounds: 10,
  currentRoundScore: 0,
  records: [],
  isPlaying: false,
  isAnimating: false,
  potShaking: false,
  showFlash: false,

  startGame: () => set({ isPlaying: true }),

  resetGame: () => set({
    totalScore: 0,
    currentRound: 1,
    currentRoundScore: 0,
    records: [],
    isPlaying: true,
    isAnimating: false,
    potShaking: false,
    showFlash: false,
  }),

  recordThrow: (hitType) => {
    const { currentRound } = get();
    const scoreMap = { mouth: 5, ear: 3, miss: 0 };
    const score = scoreMap[hitType];

    const newRecord: ThrowRecord = {
      id: Date.now(),
      round: currentRound,
      score,
      hitType,
      timestamp: Date.now(),
    };

    set((state) => ({
      totalScore: state.totalScore + score,
      currentRoundScore: score,
      records: [...state.records, newRecord],
      currentRound: Math.min(state.currentRound + 1, state.maxRounds + 1),
      isAnimating: false,
    }));
  },

  setAnimating: (value) => set({ isAnimating: value }),

  triggerPotEffect: () => set({ potShaking: true, showFlash: true }),

  clearPotEffect: () => set({ potShaking: false, showFlash: false }),
}));
