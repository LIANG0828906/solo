import { create } from 'zustand';
import type { WrinkleStats } from './types';

interface AppState {
  capturedImage: string | null;
  sensitivity: number;
  wrinkleStats: WrinkleStats | null;
  isLoading: boolean;
  setCapturedImage: (image: string | null) => void;
  setSensitivity: (value: number) => void;
  setWrinkleStats: (stats: WrinkleStats | null) => void;
  setIsLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  capturedImage: null,
  sensitivity: 50,
  wrinkleStats: null,
  isLoading: false,
  setCapturedImage: (image) => set({ capturedImage: image }),
  setSensitivity: (value) => set({ sensitivity: value }),
  setWrinkleStats: (stats) => set({ wrinkleStats: stats }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  reset: () => set({ capturedImage: null, wrinkleStats: null }),
}));
