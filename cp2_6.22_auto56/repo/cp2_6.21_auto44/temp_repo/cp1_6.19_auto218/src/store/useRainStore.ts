import { create } from 'zustand';
import type { RainType, RainParticleConfig } from '@/types';
import { RAIN_CONFIGS, lerpConfig } from '@/modules/rain-simulator/rainConfig';

interface RainState {
  currentType: RainType;
  intensity: number;
  targetConfig: RainParticleConfig;
  currentConfig: RainParticleConfig;
  transitionProgress: number;
  isTransitioning: boolean;
  rainStartTime: number;
  setRainType: (type: RainType) => void;
  setIntensity: (v: number) => void;
  updateTransition: (delta: number) => void;
}

export const useRainStore = create<RainState>((set, get) => ({
  currentType: 'frontal',
  intensity: 1,
  targetConfig: RAIN_CONFIGS.frontal,
  currentConfig: RAIN_CONFIGS.frontal,
  transitionProgress: 1,
  isTransitioning: false,
  rainStartTime: Date.now(),

  setRainType: (type: RainType) => {
    set({
      currentType: type,
      targetConfig: RAIN_CONFIGS[type],
      transitionProgress: 0,
      isTransitioning: true,
    });
  },

  setIntensity: (v: number) => {
    set({ intensity: Math.max(0.2, Math.min(2, v)) });
  },

  updateTransition: (delta: number) => {
    const state = get();
    if (!state.isTransitioning) return;

    const newProgress = Math.min(1, state.transitionProgress + delta * 2);
    const newConfig = lerpConfig(
      state.currentConfig,
      state.targetConfig,
      newProgress,
    );

    set({
      transitionProgress: newProgress,
      currentConfig: newConfig,
      isTransitioning: newProgress < 1,
    });
  },
}));
