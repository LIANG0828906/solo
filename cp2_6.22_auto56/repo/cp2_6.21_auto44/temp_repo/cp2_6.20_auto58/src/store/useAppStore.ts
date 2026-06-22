import { create } from 'zustand';

export type Quality = 'low' | 'medium' | 'high';

export interface TargetPosition {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

interface AppState {
  density: number;
  theme: string;
  smoothness: number;
  quality: Quality;
  activeCount: number;
  currentColors: string[];
  bgSaturationBoost: number;
  targetPositionHistory: TargetPosition[];
  setDensity: (density: number) => void;
  setTheme: (theme: string) => void;
  setSmoothness: (smoothness: number) => void;
  setQuality: (quality: Quality) => void;
  setActiveCount: (activeCount: number) => void;
  setBgSaturationBoost: (boost: number) => void;
  pushTargetPosition: (p: { x: number; y: number; z: number }) => void;
}

const MAX_HISTORY = 7200;

export const useAppStore = create<AppState>((set) => ({
  density: 80,
  theme: 'aurora',
  smoothness: 5,
  quality: 'high',
  activeCount: 0,
  currentColors: [],
  bgSaturationBoost: 0,
  targetPositionHistory: [],

  setDensity: (density) => set({ density }),
  setTheme: (theme) => set({ theme }),
  setSmoothness: (smoothness) => set({ smoothness }),
  setQuality: (quality) => set({ quality }),
  setActiveCount: (activeCount) => set({ activeCount }),
  setBgSaturationBoost: (bgSaturationBoost) => set({ bgSaturationBoost }),

  pushTargetPosition: (p) =>
    set((state) => {
      const newEntry: TargetPosition = { ...p, timestamp: Date.now() };
      const newHistory = [...state.targetPositionHistory, newEntry];
      if (newHistory.length > MAX_HISTORY) {
        newHistory.splice(0, newHistory.length - MAX_HISTORY);
      }
      return { targetPositionHistory: newHistory };
    }),
}));
