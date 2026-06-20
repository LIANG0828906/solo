import { create } from 'zustand';
import type {
  BuildingType,
  FacadeDirection,
  OpeningRates,
  SavedScheme,
  BuildingState
} from '../types';

export const useBuildingStore = create<BuildingState>((set, get) => ({
  buildingType: 'cube',
  openingRates: {
    south: 20,
    north: 20,
    east: 20,
    west: 20
  },
  savedSchemes: [],

  setBuildingType: (type: BuildingType) => {
    set({ buildingType: type });
  },

  setOpeningRate: (direction: FacadeDirection, value: number) => {
    const clampedValue = Math.max(0, Math.min(60, value));
    set((state) => ({
      openingRates: {
        ...state.openingRates,
        [direction]: clampedValue
      }
    }));
  },

  saveScheme: (name?: string) => {
    const state = get();
    if (state.savedSchemes.length >= 4) {
      return;
    }

    const newScheme: SavedScheme = {
      id: Date.now(),
      name: name || `方案 ${state.savedSchemes.length + 1}`,
      buildingType: state.buildingType,
      openingRates: { ...state.openingRates },
      createdAt: Date.now()
    };

    set((state) => ({
      savedSchemes: [...state.savedSchemes, newScheme]
    }));
  },

  loadScheme: (index: number) => {
    const state = get();
    const scheme = state.savedSchemes[index];
    if (scheme) {
      set({
        buildingType: scheme.buildingType,
        openingRates: { ...scheme.openingRates }
      });
    }
  },

  deleteScheme: (index: number) => {
    set((state) => ({
      savedSchemes: state.savedSchemes.filter((_, i) => i !== index)
    }));
  }
}));

export const selectBuildingType = (state: BuildingState) => state.buildingType;
export const selectOpeningRates = (state: BuildingState) => state.openingRates;
export const selectSavedSchemes = (state: BuildingState) => state.savedSchemes;
export const selectTotalOpeningArea = (state: BuildingState) => {
  const rates = state.openingRates;
  return (rates.south + rates.north + rates.east + rates.west) / 4;
};

export const getTotalOpeningRate = (rates: OpeningRates): number => {
  return rates.south + rates.north + rates.east + rates.west;
};

export const getParticleCount = (rates: OpeningRates): number => {
  const totalRate = getTotalOpeningRate(rates);
  const minCount = 20;
  const maxCount = 100;
  const normalized = totalRate / 240;
  return Math.round(minCount + normalized * (maxCount - minCount));
};
