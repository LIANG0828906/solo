import { create } from 'zustand';
import type { SceneState, SceneActions, Hypocenter, GeologicLayerConfig } from '@/types';
import { DEFAULT_STATE, DEFAULT_GEOLOGIC_LAYERS } from '@/types';

type Store = SceneState & SceneActions;

export const useSceneStore = create<Store>((set, get) => ({
  ...DEFAULT_STATE,

  setHypocenter: (hypo: Partial<Hypocenter>) =>
    set((state) => ({
      hypocenter: { ...state.hypocenter, ...hypo },
      isPlaying: false,
      currentTime: 0,
    })),

  setMagnitude: (magnitude: number) =>
    set(() => ({
      magnitude,
      isPlaying: false,
      currentTime: 0,
    })),

  setDensity: (density: number) =>
    set(() => ({
      density,
      isPlaying: false,
      currentTime: 0,
    })),

  setElasticity: (elasticity: number) =>
    set(() => ({
      elasticity,
      isPlaying: false,
      currentTime: 0,
    })),

  setPlaying: (isPlaying: boolean) => {
    const state = get();
    if (isPlaying && state.currentTime >= 5) {
      set({ currentTime: 0, isPlaying: true });
    } else {
      set({ isPlaying });
    }
  },

  setCurrentTime: (time: number) =>
    set(() => ({
      currentTime: time,
    })),

  resetSimulation: () =>
    set(() => ({
      isPlaying: false,
      currentTime: 0,
    })),

  setStateFromUrl: (state: Partial<SceneState>) =>
    set(() => ({
      ...state,
      isPlaying: false,
      currentTime: 0,
    })),

  setGeologicLayer: (index: number, config: Partial<GeologicLayerConfig>) =>
    set((state) => {
      const newLayers = state.geologicLayers.layers.map((layer, i) =>
        i === index ? { ...layer, ...config } : layer
      );
      return {
        geologicLayers: {
          ...state.geologicLayers,
          layers: newLayers,
        },
      };
    }),

  setShowGrid: (show: boolean) =>
    set((state) => ({
      geologicLayers: {
        ...state.geologicLayers,
        showGrid: show,
      },
    })),

  setGridOpacity: (opacity: number) =>
    set((state) => ({
      geologicLayers: {
        ...state.geologicLayers,
        gridOpacity: opacity,
      },
    })),

  resetGeologicLayers: () =>
    set(() => ({
      geologicLayers: DEFAULT_GEOLOGIC_LAYERS,
    })),
}));

export const selectHypocenter = (state: Store) => state.hypocenter;
export const selectMagnitude = (state: Store) => state.magnitude;
export const selectDensity = (state: Store) => state.density;
export const selectElasticity = (state: Store) => state.elasticity;
export const selectIsPlaying = (state: Store) => state.isPlaying;
export const selectCurrentTime = (state: Store) => state.currentTime;
export const selectGeologicLayers = (state: Store) => state.geologicLayers;
export const selectSceneState = (state: Store): SceneState => ({
  hypocenter: state.hypocenter,
  magnitude: state.magnitude,
  density: state.density,
  elasticity: state.elasticity,
  isPlaying: state.isPlaying,
  currentTime: state.currentTime,
  geologicLayers: state.geologicLayers,
});
