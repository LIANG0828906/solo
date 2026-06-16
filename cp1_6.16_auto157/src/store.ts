import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type ElementType = 'source' | 'obstacle' | 'absorber';

export interface SoundSource {
  id: string;
  type: 'source';
  x: number;
  z: number;
  frequency: number;
  amplitude: number;
}

export interface Obstacle {
  id: string;
  type: 'obstacle';
  x: number;
  z: number;
  width: number;
  depth: number;
  rotation: number;
}

export interface Absorber {
  id: string;
  type: 'absorber';
  x: number;
  z: number;
  width: number;
  depth: number;
  absorptionCoeff: number;
}

export type SceneElement = SoundSource | Obstacle | Absorber;

export interface SimulationResult {
  pressureField: number[][];
  maxSPL: number;
  minSPL: number;
  avgSPL: number;
}

interface AppState {
  elements: SceneElement[];
  isSimulating: boolean;
  simulationResult: SimulationResult | null;
  selectedElementId: string | null;
  addElement: (element: Omit<SceneElement, 'id'>) => string;
  removeElement: (id: string) => void;
  updateElement: (id: string, updates: Partial<SceneElement>) => void;
  setSimulating: (value: boolean) => void;
  setSimulationResult: (result: SimulationResult | null) => void;
  setSelectedElement: (id: string | null) => void;
  clearAll: () => void;
}

export const useStore = create<AppState>((set) => ({
  elements: [],
  isSimulating: false,
  simulationResult: null,
  selectedElementId: null,

  addElement: (element) => {
    const id = uuidv4();
    set((state) => ({
      elements: [...state.elements, { ...element, id } as SceneElement],
    }));
    return id;
  },

  removeElement: (id) =>
    set((state) => ({
      elements: state.elements.filter((e) => e.id !== id),
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
    })),

  updateElement: (id, updates) =>
    set((state) => ({
      elements: state.elements.map((e) =>
        e.id === id ? ({ ...e, ...updates } as SceneElement) : e
      ),
    })),

  setSimulating: (value) => set({ isSimulating: value }),

  setSimulationResult: (result) => set({ simulationResult: result }),

  setSelectedElement: (id) => set({ selectedElementId: id }),

  clearAll: () => set({ elements: [], isSimulating: false, simulationResult: null, selectedElementId: null }),
}));
