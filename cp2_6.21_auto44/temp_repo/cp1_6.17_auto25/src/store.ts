import { create } from 'zustand';
import { AppState, WrinkleStats } from './types';

export const useAppStore = create<AppState>((set) => ({
  capturedImage: null,
  sensitivity: 50,
  wrinkleStats: null,
  isLoading: false,

  setCapturedImage: (image: string | null) =>
    set({ capturedImage: image }),

  setSensitivity: (value: number) =>
    set({ sensitivity: value }),

  setWrinkleStats: (stats: WrinkleStats | null) =>
    set({ wrinkleStats: stats }),

  setIsLoading: (loading: boolean) =>
    set({ isLoading: loading }),

  resetAll: () =>
    set({
      capturedImage: null,
      wrinkleStats: null,
      isLoading: false,
    }),
}));
