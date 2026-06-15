import { create } from 'zustand';
import type { Planet } from '../types/planet';

interface PlanetState {
  planets: Planet[];
  selectedPlanetId: string | null;
  compareList: string[];
  currentDay: number;
  showOrbits: boolean;
  isPlaying: boolean;
  cameraPosition: [number, number, number] | null;
  setPlanets: (planets: Planet[]) => void;
  selectPlanet: (id: string | null) => void;
  addToCompare: (id: string) => void;
  removeFromCompare: (id: string) => void;
  setCurrentDay: (day: number) => void;
  toggleOrbits: () => void;
  togglePlaying: () => void;
  setCameraPosition: (pos: [number, number, number]) => void;
}

export const usePlanetStore = create<PlanetState>((set) => ({
  planets: [],
  selectedPlanetId: null,
  compareList: [],
  currentDay: 0,
  showOrbits: true,
  isPlaying: false,
  cameraPosition: null,

  setPlanets: (planets) => set({ planets }),

  selectPlanet: (id) => set({ selectedPlanetId: id }),

  addToCompare: (id) =>
    set((state) => {
      if (state.compareList.length >= 3 || state.compareList.includes(id)) {
        return state;
      }
      return { compareList: [...state.compareList, id] };
    }),

  removeFromCompare: (id) =>
    set((state) => ({
      compareList: state.compareList.filter((planetId) => planetId !== id),
    })),

  setCurrentDay: (day) => set({ currentDay: Math.max(0, Math.min(365, day)) }),

  toggleOrbits: () => set((state) => ({ showOrbits: !state.showOrbits })),

  togglePlaying: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setCameraPosition: (pos) => set({ cameraPosition: pos }),
}));
