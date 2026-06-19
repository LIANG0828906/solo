import { create } from 'zustand';
import type { EssaySubmission, GrammarError } from '@/types';

interface EssayState {
  currentSubmission: EssaySubmission | null;
  precheckErrors: GrammarError[];
  history: EssaySubmission[];
  isSubmitting: boolean;
  isPrechecking: boolean;

  setCurrentSubmission: (submission: EssaySubmission | null) => void;
  setPrecheckErrors: (errors: GrammarError[]) => void;
  setHistory: (history: EssaySubmission[]) => void;
  addToHistory: (submission: EssaySubmission) => void;
  setIsSubmitting: (loading: boolean) => void;
  setIsPrechecking: (loading: boolean) => void;
  reset: () => void;
}

const initialState = {
  currentSubmission: null,
  precheckErrors: [],
  history: [],
  isSubmitting: false,
  isPrechecking: false,
};

export const useEssayStore = create<EssayState>((set) => ({
  ...initialState,

  setCurrentSubmission: (submission) =>
    set({ currentSubmission: submission }),

  setPrecheckErrors: (errors) => set({ precheckErrors: errors }),

  setHistory: (history) => set({ history }),

  addToHistory: (submission) =>
    set((state) => ({
      history: [submission, ...state.history].slice(0, 20),
    })),

  setIsSubmitting: (loading) => set({ isSubmitting: loading }),

  setIsPrechecking: (loading) => set({ isPrechecking: loading }),

  reset: () => set(initialState),
}));

export default useEssayStore;
