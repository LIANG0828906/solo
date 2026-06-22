import { create } from 'zustand';

interface AppState {
  health: number;
  glitchCount: number;
  repairCount: number;
  frequency: number;
  incrementGlitch: () => void;
  incrementRepair: () => void;
  setFrequency: (value: number) => void;
  calculateHealth: () => void;
}

const useAppStore = create<AppState>((set, get) => ({
  health: 100,
  glitchCount: 0,
  repairCount: 0,
  frequency: 50,

  incrementGlitch: () => {
    set((state) => ({ glitchCount: state.glitchCount + 1 }));
    get().calculateHealth();
  },

  incrementRepair: () => {
    set((state) => ({ repairCount: state.repairCount + 1 }));
    get().calculateHealth();
  },

  setFrequency: (value: number) => {
    set({ frequency: value });
  },

  calculateHealth: () => {
    const { glitchCount, repairCount } = get();
    const health = Math.max(0, 100 - glitchCount * 2 + repairCount * 5);
    set({ health });
  },
}));

export default useAppStore;
