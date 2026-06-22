import { create } from 'zustand';

export type EmotionType = '宁静' | '欢愉' | '忧郁' | '激昂';

interface ColorFlowState {
  h: number;
  s: number;
  speed: number;
  emotion: EmotionType;
  setH: (h: number) => void;
  setS: (s: number) => void;
  setSpeed: (speed: number) => void;
  setEmotion: (emotion: EmotionType) => void;
}

export const useColorFlowStore = create<ColorFlowState>((set) => ({
  h: 220,
  s: 70,
  speed: 1.0,
  emotion: '宁静',
  setH: (h) => set({ h }),
  setS: (s) => set({ s }),
  setSpeed: (speed) => set({ speed }),
  setEmotion: (emotion) => set({ emotion }),
}));
