import { create } from 'zustand';
import { SeedParams, DEFAULT_SEED, PRESETS, Preset } from '@/types';

interface GardenState {
  seed: SeedParams;
  isTransitioning: boolean;
  setSeed: (params: Partial<SeedParams>) => void;
  applyPreset: (presetId: string) => void;
  setTransitioning: (value: boolean) => void;
}

export const useStore = create<GardenState>((set, get) => ({
  seed: { ...DEFAULT_SEED },
  isTransitioning: false,

  setSeed: (params: Partial<SeedParams>) => {
    set((state) => ({
      seed: { ...state.seed, ...params },
    }));
  },

  applyPreset: (presetId: string) => {
    const preset = PRESETS.find((p: Preset) => p.id === presetId);
    if (preset) {
      set({ isTransitioning: true });
      set((state) => ({
        seed: { ...preset.params },
      }));
      setTimeout(() => {
        set({ isTransitioning: false });
      }, 800);
    }
  },

  setTransitioning: (value: boolean) => {
    set({ isTransitioning: value });
  },
}));

export const selectSeed = (state: GardenState) => state.seed;
export const selectIsTransitioning = (state: GardenState) => state.isTransitioning;
export const selectSetSeed = (state: GardenState) => state.setSeed;
export const selectApplyPreset = (state: GardenState) => state.applyPreset;
