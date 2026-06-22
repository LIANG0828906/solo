import { create } from 'zustand';
import type { StoreState, Question, CheckResult } from './types';

export const useTimelineStore = create<StoreState>((set) => ({
  currentQuestions: [],
  userOrder: [],
  score: null,
  results: [],
  isStarted: false,
  isSubmitted: false,
  scoreHistory: [],

  setQuestions: (questions: Question[]) =>
    set({ currentQuestions: questions, userOrder: questions }),

  setUserOrder: (order: Question[]) => set({ userOrder: order }),

  setScore: (score: number) =>
    set((state) => ({
      score,
      scoreHistory: [...state.scoreHistory, score],
    })),

  setResults: (results: CheckResult[]) => set({ results }),

  setStarted: (started: boolean) => set({ isStarted: started }),

  setSubmitted: (submitted: boolean) => set({ isSubmitted: submitted }),

  reset: () =>
    set({
      currentQuestions: [],
      userOrder: [],
      score: null,
      results: [],
      isStarted: false,
      isSubmitted: false,
    }),
}));
