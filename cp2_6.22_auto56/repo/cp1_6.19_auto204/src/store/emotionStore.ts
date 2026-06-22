import { create } from 'zustand';
import { getCompositeLabel, getActivityLevel } from '../utils/emotionMath';

interface EmotionState {
  joy: number;
  sadness: number;
  anger: number;
  calm: number;
}

interface EmotionActions {
  setJoy: (value: number) => void;
  setSadness: (value: number) => void;
  setAnger: (value: number) => void;
  setCalm: (value: number) => void;
  reset: () => void;
  getCompositeLabel: () => string;
  getActivityLevel: () => number;
}

export type EmotionStore = EmotionState & EmotionActions;

export const useEmotionStore = create<EmotionStore>((set, get) => ({
  joy: 50,
  sadness: 30,
  anger: 20,
  calm: 60,

  setJoy: (value: number) => set({ joy: Math.max(0, Math.min(100, value)) }),
  setSadness: (value: number) => set({ sadness: Math.max(0, Math.min(100, value)) }),
  setAnger: (value: number) => set({ anger: Math.max(0, Math.min(100, value)) }),
  setCalm: (value: number) => set({ calm: Math.max(0, Math.min(100, value)) }),

  reset: () => set({ joy: 50, sadness: 30, anger: 20, calm: 60 }),

  getCompositeLabel: () => {
    const { joy, sadness, anger, calm } = get();
    return getCompositeLabel(joy, sadness, anger, calm);
  },

  getActivityLevel: () => {
    const { joy, sadness, anger, calm } = get();
    return getActivityLevel(joy, sadness, anger, calm);
  },
}));
