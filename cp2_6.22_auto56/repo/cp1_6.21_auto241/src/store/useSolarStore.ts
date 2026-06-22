import { create } from 'zustand';
import type { PlanetBasic } from '../types/planet';

interface SolarState {
  planets: PlanetBasic[];
  selectedPlanetId: string | null;
  showOrbits: boolean;
  showLabels: boolean;
  glowIntensity: number;
  speedMultiplier: number;
  isPaused: boolean;
  performanceMode: boolean;
  viewResetTrigger: number;

  setPlanets: (planets: PlanetBasic[]) => void;
  setSelectedPlanetId: (id: string | null) => void;
  toggleOrbits: () => void;
  toggleLabels: () => void;
  setGlowIntensity: (v: number) => void;
  setSpeedMultiplier: (v: number) => void;
  togglePause: () => void;
  togglePerformanceMode: () => void;
  resetView: () => void;
}

export const useSolarStore = create<SolarState>((set) => ({
  planets: [],
  selectedPlanetId: null,
  showOrbits: true,
  showLabels: true,
  glowIntensity: 0.5,
  speedMultiplier: 1,
  isPaused: false,
  performanceMode: false,
  viewResetTrigger: 0,

  setPlanets: (planets) => set({ planets }),
  setSelectedPlanetId: (id) => set({ selectedPlanetId: id }),
  toggleOrbits: () => set((state) => ({ showOrbits: !state.showOrbits })),
  toggleLabels: () => set((state) => ({ showLabels: !state.showLabels })),
  setGlowIntensity: (v) => set({ glowIntensity: Math.max(0, Math.min(1, v)) }),
  setSpeedMultiplier: (v) => set({ speedMultiplier: Math.max(0.1, Math.min(5, v)) }),
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  togglePerformanceMode: () => set((state) => ({ performanceMode: !state.performanceMode })),
  resetView: () => set((state) => ({ viewResetTrigger: state.viewResetTrigger + 1 })),
}));
