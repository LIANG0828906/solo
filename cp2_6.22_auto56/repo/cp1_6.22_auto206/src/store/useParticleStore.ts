import { create } from 'zustand';
import type { ParticleParams } from '../particlePresets';
import { defaultParams, presets, lerpParams } from '../particlePresets';

export type RenderMode = 'points' | 'mesh';

interface ParticleState {
  params: ParticleParams;
  targetParams: ParticleParams;
  renderMode: RenderMode;
  activePreset: string;
  autoRotate: boolean;
  isTransitioning: boolean;
  transitionProgress: number;
  transitionStartParams: ParticleParams | null;
  transitionEndParams: ParticleParams | null;
  transitionStartTime: number;
  transitionDuration: number;

  setParam: <K extends keyof ParticleParams>(key: K, value: ParticleParams[K]) => void;
  setParams: (params: Partial<ParticleParams>) => void;
  applyPreset: (presetId: string) => void;
  updateTransition: (currentTime: number) => void;
  setRenderMode: (mode: RenderMode) => void;
  toggleRenderMode: () => void;
  setAutoRotate: (value: boolean) => void;
  toggleAutoRotate: () => void;
  resetParams: () => void;
}

export const useParticleStore = create<ParticleState>((set, get) => ({
  params: { ...defaultParams },
  targetParams: { ...defaultParams },
  renderMode: 'points',
  activePreset: 'spiral',
  autoRotate: true,
  isTransitioning: false,
  transitionProgress: 0,
  transitionStartParams: null,
  transitionEndParams: null,
  transitionStartTime: 0,
  transitionDuration: 1000,

  setParam: (key, value) => {
    const state = get();
    if (state.isTransitioning) return;
    set((state) => ({
      params: { ...state.params, [key]: value },
      targetParams: { ...state.targetParams, [key]: value },
      activePreset: '',
    }));
  },

  setParams: (newParams) => {
    const state = get();
    if (state.isTransitioning) return;
    set((state) => ({
      params: { ...state.params, ...newParams },
      targetParams: { ...state.targetParams, ...newParams },
      activePreset: '',
    }));
  },

  applyPreset: (presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return;

    const state = get();
    const now = performance.now();

    set({
      isTransitioning: true,
      transitionProgress: 0,
      transitionStartParams: { ...state.params },
      transitionEndParams: { ...preset.params },
      transitionStartTime: now,
      transitionDuration: preset.transitionDuration,
      activePreset: presetId,
    });
  },

  updateTransition: (currentTime) => {
    const state = get();
    if (!state.isTransitioning || !state.transitionStartParams || !state.transitionEndParams) {
      return;
    }

    const elapsed = currentTime - state.transitionStartTime;
    const progress = Math.min(elapsed / state.transitionDuration, 1);

    if (progress >= 1) {
      set({
        params: { ...state.transitionEndParams },
        targetParams: { ...state.transitionEndParams },
        isTransitioning: false,
        transitionProgress: 1,
        transitionStartParams: null,
        transitionEndParams: null,
      });
    } else {
      const interpolated = lerpParams(
        state.transitionStartParams,
        state.transitionEndParams,
        progress
      );
      set({
        params: interpolated,
        transitionProgress: progress,
      });
    }
  },

  setRenderMode: (mode) => set({ renderMode: mode }),
  toggleRenderMode: () => set((state) => ({ renderMode: state.renderMode === 'points' ? 'mesh' : 'points' })),
  setAutoRotate: (value) => set({ autoRotate: value }),
  toggleAutoRotate: () => set((state) => ({ autoRotate: !state.autoRotate })),
  resetParams: () => set({
    params: { ...defaultParams },
    targetParams: { ...defaultParams },
    activePreset: 'spiral',
    isTransitioning: false,
  }),
}));
