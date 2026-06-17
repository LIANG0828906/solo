import { create } from 'zustand';
import {
  FlavorProfile,
  FlavorDimension,
  FlavorScores,
  PresetFlavor,
  MAX_PROFILES,
} from '@/shared/types';
import {
  PRESET_FLAVORS,
  createProfileFromPreset,
  createCustomProfile,
  calculateAverageScores,
  calculateBalanceScore,
  findRecommendedPreset,
  updateProfileScore,
} from '@/data/flavorData';

interface FlavorState {
  profiles: FlavorProfile[];
  selectedId: string | null;

  addPreset: (presetId: string) => boolean;
  addCustom: (name: string) => boolean;
  removeProfile: (id: string) => void;
  updateScore: (id: string, dimension: FlavorDimension, value: number) => void;
  toggleVisible: (id: string) => void;
  selectProfile: (id: string | null) => void;

  getSelectedProfile: () => FlavorProfile | null;
  getAverageScores: () => FlavorScores;
  getBalanceScore: (id: string) => number;
  getRecommendedPreset: () => PresetFlavor | null;
  canAddMore: () => boolean;
  getAvailablePresets: () => PresetFlavor[];
}

export const useFlavorStore = create<FlavorState>((set, get) => ({
  profiles: [],
  selectedId: null,

  addPreset: (presetId: string) => {
    const state = get();
    if (state.profiles.length >= MAX_PROFILES) return false;

    const preset = PRESET_FLAVORS.find((p) => p.id === presetId);
    if (!preset) return false;

    const profile = createProfileFromPreset(preset, state.profiles.length);
    set({
      profiles: [...state.profiles, profile],
      selectedId: profile.id,
    });
    return true;
  },

  addCustom: (name: string) => {
    const state = get();
    if (state.profiles.length >= MAX_PROFILES) return false;

    const profile = createCustomProfile(name, state.profiles.length);
    set({
      profiles: [...state.profiles, profile],
      selectedId: profile.id,
    });
    return true;
  },

  removeProfile: (id: string) => {
    const state = get();
    const profiles = state.profiles.filter((p) => p.id !== id);
    const selectedId = state.selectedId === id
      ? profiles.length > 0
        ? profiles[profiles.length - 1].id
        : null
      : state.selectedId;
    set({ profiles, selectedId });
  },

  updateScore: (id: string, dimension: FlavorDimension, value: number) => {
    const state = get();
    const profiles = state.profiles.map((p) =>
      p.id === id ? updateProfileScore(p, dimension, value) : p,
    );
    set({ profiles });
  },

  toggleVisible: (id: string) => {
    const state = get();
    const profiles = state.profiles.map((p) =>
      p.id === id ? { ...p, visible: !p.visible } : p,
    );
    set({ profiles });
  },

  selectProfile: (id: string | null) => {
    set({ selectedId: id });
  },

  getSelectedProfile: () => {
    const state = get();
    return state.profiles.find((p) => p.id === state.selectedId) ?? null;
  },

  getAverageScores: () => {
    return calculateAverageScores(get().profiles);
  },

  getBalanceScore: (id: string) => {
    const profile = get().profiles.find((p) => p.id === id);
    if (!profile) return 0;
    return calculateBalanceScore(profile.scores);
  },

  getRecommendedPreset: () => {
    const avgScores = get().getAverageScores();
    const visibleCount = get().profiles.filter((p) => p.visible).length;
    if (visibleCount === 0) return null;
    return findRecommendedPreset(avgScores);
  },

  canAddMore: () => {
    return get().profiles.length < MAX_PROFILES;
  },

  getAvailablePresets: () => {
    return PRESET_FLAVORS;
  },
}));
