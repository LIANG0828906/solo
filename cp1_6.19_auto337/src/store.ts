import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface Turbine {
  id: string;
  position: [number, number, number];
  power: number;
  windSpeed: number;
}

interface Store {
  terrainAmplitude: number;
  particleCount: number;
  maxTurbines: number;
  turbines: Turbine[];
  suggestions: [number, number, number][];
  expectedGain: number;
  isOptimizing: boolean;
  setTerrainAmplitude: (v: number) => void;
  setParticleCount: (v: number) => void;
  setMaxTurbines: (v: number) => void;
  addTurbine: (pos: [number, number, number]) => void;
  updateTurbine: (id: string, pos: [number, number, number]) => void;
  removeTurbine: (id: string) => void;
  setSuggestions: (s: [number, number, number][], gain: number) => void;
  updateTurbinePower: (id: string, power: number, windSpeed: number) => void;
  setIsOptimizing: (v: boolean) => void;
  clearSuggestions: () => void;
}

export const useStore = create<Store>((set) => ({
  terrainAmplitude: 30,
  particleCount: 1000,
  maxTurbines: 10,
  turbines: [],
  suggestions: [],
  expectedGain: 0,
  isOptimizing: false,
  setTerrainAmplitude: (v) => set({ terrainAmplitude: v }),
  setParticleCount: (v) => set({ particleCount: v }),
  setMaxTurbines: (v) => set({ maxTurbines: v }),
  addTurbine: (pos) =>
    set((state) => {
      if (state.turbines.length >= state.maxTurbines) return state;
      return {
        turbines: [
          ...state.turbines,
          {
            id: uuidv4(),
            position: pos,
            power: 0,
            windSpeed: 0,
          },
        ],
      };
    }),
  updateTurbine: (id, pos) =>
    set((state) => ({
      turbines: state.turbines.map((t) =>
        t.id === id ? { ...t, position: pos } : t
      ),
    })),
  removeTurbine: (id) =>
    set((state) => ({
      turbines: state.turbines.filter((t) => t.id !== id),
    })),
  setSuggestions: (s, gain) => set({ suggestions: s, expectedGain: gain }),
  updateTurbinePower: (id, power, windSpeed) =>
    set((state) => ({
      turbines: state.turbines.map((t) =>
        t.id === id ? { ...t, power, windSpeed } : t
      ),
    })),
  setIsOptimizing: (v) => set({ isOptimizing: v }),
  clearSuggestions: () => set({ suggestions: [], expectedGain: 0 }),
}));
