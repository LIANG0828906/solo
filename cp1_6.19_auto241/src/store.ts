import { create } from 'zustand';
import { SimulationState } from './types';

export const useSimulationStore = create<SimulationState>((set) => ({
  permeability: 0.5,
  evaporationRate: 0.1,
  rainfallIntensity: 3,
  totalRainfall: 0,
  totalEvaporated: 0,
  totalInfiltrated: 0,
  activeParticles: 0,
  viewMode: 'normal',
  isRaining: false,

  setPermeability: (v: number) => set({ permeability: v }),
  setEvaporationRate: (v: number) => set({ evaporationRate: v }),
  setRainfallIntensity: (v: number) => set({ rainfallIntensity: v }),
  
  triggerRainfall: () => set({ isRaining: true }),
  
  updateStats: (stats: Partial<{
    totalRainfall: number;
    totalEvaporated: number;
    totalInfiltrated: number;
    activeParticles: number;
  }>) => set((state) => ({
    ...state,
    ...stats,
  })),
  
  setViewMode: (mode) => set({ viewMode: mode }),
  
  setIsRaining: (raining) => set({ isRaining: raining }),
  
  reset: () => set({
    totalRainfall: 0,
    totalEvaporated: 0,
    totalInfiltrated: 0,
    activeParticles: 0,
    viewMode: 'normal',
    isRaining: false,
  }),
}));
