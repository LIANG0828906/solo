import { create } from 'zustand';
import type { GameStore, Fragment, Challenge, WeeklyReport } from './types';

const STORAGE_KEY = 'game-state';

const initialState: Omit<GameStore, keyof { [K in keyof GameStore as GameStore[K] extends Function ? K : never]: GameStore[K] }> = {
  score: 0,
  fragments: [],
  challenges: [],
  currentChallengeIndex: 0,
  completedChallenges: [],
  timeRemaining: 0,
  isTimerRunning: false,
  placedFragments: [],
  showReport: false,
  weeklyReport: null,
  isAnimating: false,
  animationType: null,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  setScore: (score: number) => set({ score }),

  setFragments: (fragments: Fragment[]) => set({ fragments }),

  setChallenges: (challenges: Challenge[]) => set({ challenges }),

  setCurrentChallengeIndex: (index: number) => set({ currentChallengeIndex: index }),

  addCompletedChallenge: (id: string) =>
    set((state) => ({
      completedChallenges: [...state.completedChallenges, id],
    })),

  setTimeRemaining: (time: number) => set({ timeRemaining: time }),

  decrementTime: () =>
    set((state) => ({
      timeRemaining: Math.max(0, state.timeRemaining - 1),
    })),

  startTimer: () => set({ isTimerRunning: true }),

  stopTimer: () => set({ isTimerRunning: false }),

  resetTimer: (seconds: number) =>
    set({
      timeRemaining: seconds,
      isTimerRunning: false,
    }),

  addPlacedFragment: (fragment: Fragment) =>
    set((state) => ({
      placedFragments: [...state.placedFragments, fragment],
    })),

  removePlacedFragment: (id: string) =>
    set((state) => ({
      placedFragments: state.placedFragments.filter((f) => f.id !== id),
    })),

  clearPlacedFragments: () => set({ placedFragments: [] }),

  setShowReport: (show: boolean) => set({ showReport: show }),

  setWeeklyReport: (report: WeeklyReport | null) => set({ weeklyReport: report }),

  setIsAnimating: (animating: boolean, type: 'success' | 'fail' | null) =>
    set({
      isAnimating: animating,
      animationType: type,
    }),

  loadGameState: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        set(parsed);
      }
    } catch (error) {
      console.error('Failed to load game state:', error);
    }
  },

  saveGameState: () => {
    try {
      const state = get();
      const {
        score,
        fragments,
        challenges,
        currentChallengeIndex,
        completedChallenges,
        weeklyReport,
      } = state;
      const toSave = {
        score,
        fragments,
        challenges,
        currentChallengeIndex,
        completedChallenges,
        weeklyReport,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (error) {
      console.error('Failed to save game state:', error);
    }
  },
}));
