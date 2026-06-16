import { create } from 'zustand';

export type CoralSpeciesType = 'acropora' | 'pocillopora' | 'montipora';

export interface CoralData {
  id: string;
  species: CoralSpeciesType;
  position: { x: number; y: number; z: number };
  age: number;
  scale: number;
  health: number;
  branches: number;
  isSeedling: boolean;
}

export interface EnvironmentState {
  currentStrength: number;
  currentDirection: { x: number; z: number };
  waterTemperature: number;
  lightIntensity: number;
  lightDirection: { x: number; y: number; z: number };
}

export interface SimulationState {
  corals: CoralData[];
  environment: EnvironmentState;
  selectedSpecies: CoralSpeciesType;
  isPlacementMode: boolean;
  time: number;
  addCoral: (coral: CoralData) => void;
  removeCoral: (id: string) => void;
  updateCoral: (id: string, updates: Partial<CoralData>) => void;
  setEnvironment: (env: Partial<EnvironmentState>) => void;
  setSelectedSpecies: (species: CoralSpeciesType) => void;
  setPlacementMode: (mode: boolean) => void;
  updateTime: (delta: number) => void;
}

export const useStore = create<SimulationState>((set) => ({
  corals: [],
  environment: {
    currentStrength: 0.8,
    currentDirection: { x: 1, z: 0 },
    waterTemperature: 26,
    lightIntensity: 1.2,
    lightDirection: { x: 0.5, y: 1, z: 0.3 },
  },
  selectedSpecies: 'acropora',
  isPlacementMode: false,
  time: 0,

  addCoral: (coral) =>
    set((state) => ({
      corals: [...state.corals, coral],
    })),

  removeCoral: (id) =>
    set((state) => ({
      corals: state.corals.filter((c) => c.id !== id),
    })),

  updateCoral: (id, updates) =>
    set((state) => ({
      corals: state.corals.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  setEnvironment: (env) =>
    set((state) => ({
      environment: { ...state.environment, ...env },
    })),

  setSelectedSpecies: (species) => set({ selectedSpecies: species }),

  setPlacementMode: (mode) => set({ isPlacementMode: mode }),

  updateTime: (delta) =>
    set((state) => ({ time: state.time + delta })),
}));
