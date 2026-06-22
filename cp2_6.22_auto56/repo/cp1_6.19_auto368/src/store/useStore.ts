import { create } from 'zustand';
import { MaterialType, MATERIAL_PRESETS } from '../utils/materialConfig';

interface RightParams {
  materialType: MaterialType;
  roughness: number;
  metalness: number;
  envIntensity: number;
  timeOfDay: number;
}

interface MaterialState {
  materialType: MaterialType;
  roughness: number;
  metalness: number;
  envIntensity: number;
  timeOfDay: number;
  compareMode: boolean;
  rightParams: RightParams;
  activeSide: 'left' | 'right';

  setMaterialType: (type: MaterialType) => void;
  setRoughness: (value: number) => void;
  setMetalness: (value: number) => void;
  setEnvIntensity: (value: number) => void;
  setTimeOfDay: (value: number) => void;
  toggleCompareMode: () => void;
  setActiveSide: (side: 'left' | 'right') => void;
  setRightMaterialType: (type: MaterialType) => void;
  setRightRoughness: (value: number) => void;
  setRightMetalness: (value: number) => void;
  setRightEnvIntensity: (value: number) => void;
  setRightTimeOfDay: (value: number) => void;
  syncRightFromLeft: () => void;
}

const defaultPreset = MATERIAL_PRESETS.brushedMetal;

export const useStore = create<MaterialState>((set, get) => ({
  materialType: 'brushedMetal',
  roughness: defaultPreset.roughness,
  metalness: defaultPreset.metalness,
  envIntensity: 1.0,
  timeOfDay: 12,
  compareMode: false,
  activeSide: 'left',
  rightParams: {
    materialType: 'brushedMetal',
    roughness: defaultPreset.roughness,
    metalness: defaultPreset.metalness,
    envIntensity: 1.0,
    timeOfDay: 12,
  },

  setMaterialType: (type) => {
    const preset = MATERIAL_PRESETS[type];
    if (get().activeSide === 'left' || !get().compareMode) {
      set({
        materialType: type,
        roughness: preset.roughness,
        metalness: preset.metalness,
      });
    } else {
      const state = get();
      set({
        rightParams: {
          ...state.rightParams,
          materialType: type,
          roughness: preset.roughness,
          metalness: preset.metalness,
        },
      });
    }
  },

  setRoughness: (value) => {
    if (get().activeSide === 'left' || !get().compareMode) {
      set({ roughness: value });
    } else {
      const state = get();
      set({ rightParams: { ...state.rightParams, roughness: value } });
    }
  },

  setMetalness: (value) => {
    if (get().activeSide === 'left' || !get().compareMode) {
      set({ metalness: value });
    } else {
      const state = get();
      set({ rightParams: { ...state.rightParams, metalness: value } });
    }
  },

  setEnvIntensity: (value) => {
    if (get().activeSide === 'left' || !get().compareMode) {
      set({ envIntensity: value });
    } else {
      const state = get();
      set({ rightParams: { ...state.rightParams, envIntensity: value } });
    }
  },

  setTimeOfDay: (value) => {
    if (get().activeSide === 'left' || !get().compareMode) {
      set({ timeOfDay: value });
    } else {
      const state = get();
      set({ rightParams: { ...state.rightParams, timeOfDay: value } });
    }
  },

  toggleCompareMode: () => {
    const state = get();
    if (!state.compareMode) {
      set({
        compareMode: true,
        rightParams: {
          materialType: state.materialType,
          roughness: state.roughness,
          metalness: state.metalness,
          envIntensity: state.envIntensity,
          timeOfDay: state.timeOfDay,
        },
        activeSide: 'right',
      });
    } else {
      set({ compareMode: false, activeSide: 'left' });
    }
  },

  setActiveSide: (side) => set({ activeSide: side }),

  setRightMaterialType: (type) => {
    const preset = MATERIAL_PRESETS[type];
    const state = get();
    set({
      rightParams: {
        ...state.rightParams,
        materialType: type,
        roughness: preset.roughness,
        metalness: preset.metalness,
      },
    });
  },

  setRightRoughness: (value) => {
    const state = get();
    set({ rightParams: { ...state.rightParams, roughness: value } });
  },

  setRightMetalness: (value) => {
    const state = get();
    set({ rightParams: { ...state.rightParams, metalness: value } });
  },

  setRightEnvIntensity: (value) => {
    const state = get();
    set({ rightParams: { ...state.rightParams, envIntensity: value } });
  },

  setRightTimeOfDay: (value) => {
    const state = get();
    set({ rightParams: { ...state.rightParams, timeOfDay: value } });
  },

  syncRightFromLeft: () => {
    const state = get();
    set({
      rightParams: {
        materialType: state.materialType,
        roughness: state.roughness,
        metalness: state.metalness,
        envIntensity: state.envIntensity,
        timeOfDay: state.timeOfDay,
      },
    });
  },
}));
