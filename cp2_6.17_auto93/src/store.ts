import { create } from 'zustand';
import type { UIState, PlanetData } from './types';
import { PLANETS } from './types';

interface StoreState extends UIState {
  planets: PlanetData[];
  selectPlanet: (planetId: string | null) => void;
  focusPlanet: (planetId: string | null) => void;
  setPanelVisible: (visible: boolean) => void;
  focusAndSelect: (planetId: string) => void;
  getPlanetById: (id: string | null) => PlanetData | undefined;
}

export const useStore = create<StoreState>((set, get) => ({
  selectedPlanetId: null,
  focusedPlanetId: null,
  isPanelVisible: false,
  planets: PLANETS,

  selectPlanet: (planetId) => set({
    selectedPlanetId: planetId,
    isPanelVisible: planetId !== null
  }),

  focusPlanet: (planetId) => set({
    focusedPlanetId: planetId
  }),

  setPanelVisible: (visible) => set({
    isPanelVisible: visible,
    selectedPlanetId: visible ? get().selectedPlanetId : null
  }),

  focusAndSelect: (planetId) => set({
    focusedPlanetId: planetId,
    selectedPlanetId: planetId,
    isPanelVisible: true
  }),

  getPlanetById: (id) => {
    if (!id) return undefined;
    return get().planets.find(p => p.id === id);
  }
}));
