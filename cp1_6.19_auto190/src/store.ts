import { create } from 'zustand';
import { RootNode, NutrientParticle, SimulationParams, SoilType, TipInfo } from './types';

interface SimulationState {
  rootNodes: RootNode[];
  nutrientParticles: NutrientParticle[];
  params: SimulationParams;
  timeStep: number;
  isRunning: boolean;
  selectedTip: TipInfo | null;
  maxRootNodes: number;
  maxParticles: number;

  setParameter: (key: keyof SimulationParams, value: number | SoilType) => void;
  addRootNode: (node: RootNode) => void;
  addRootNodes: (nodes: RootNode[]) => void;
  updateRootNode: (id: string, updates: Partial<RootNode>) => void;
  removeOldestTips: (count: number) => void;
  updateNutrientDistribution: (particles: NutrientParticle[]) => void;
  resetSimulation: () => void;
  incrementTimeStep: () => void;
  setRunning: (running: boolean) => void;
  setSelectedTip: (tip: TipInfo | null) => void;
}

const initialParams: SimulationParams = {
  lightIntensity: 50,
  waterContent: 50,
  soilType: 'loam',
};

const generateId = () => Math.random().toString(36).substring(2, 11);

const createInitialRoot = (): RootNode[] => {
  return [
    {
      id: generateId(),
      position: [0, 3.9, 0],
      radius: 0.3,
      depth: 0,
      isTip: true,
      direction: [0, -1, 0],
      parentId: null,
      order: 0,
      age: 0,
    },
  ];
};

export const useSimulationStore = create<SimulationState>((set, get) => ({
  rootNodes: createInitialRoot(),
  nutrientParticles: [],
  params: initialParams,
  timeStep: 0,
  isRunning: true,
  selectedTip: null,
  maxRootNodes: 2000,
  maxParticles: 3000,

  setParameter: (key, value) => {
    set((state) => ({
      params: { ...state.params, [key]: value },
    }));
    get().resetSimulation();
  },

  addRootNode: (node) => {
    set((state) => {
      if (state.rootNodes.length >= state.maxRootNodes) {
        return state;
      }
      return { rootNodes: [...state.rootNodes, node] };
    });
  },

  addRootNodes: (nodes) => {
    set((state) => {
      const newNodes = [...state.rootNodes, ...nodes];
      if (newNodes.length > state.maxRootNodes) {
        const excess = newNodes.length - state.maxRootNodes;
        const tipNodes = newNodes.filter((n) => n.isTip && n.order > 0);
        const toRemove = tipNodes
          .sort((a, b) => a.age - b.age)
          .slice(0, Math.min(excess, tipNodes.length))
          .map((n) => n.id);
        return {
          rootNodes: newNodes.filter((n) => !toRemove.includes(n.id)),
        };
      }
      return { rootNodes: newNodes };
    });
  },

  updateRootNode: (id, updates) => {
    set((state) => ({
      rootNodes: state.rootNodes.map((node) =>
        node.id === id ? { ...node, ...updates } : node
      ),
    }));
  },

  removeOldestTips: (count) => {
    set((state) => {
      const tipNodes = state.rootNodes.filter((n) => n.isTip && n.order > 0);
      const toRemove = tipNodes
        .sort((a, b) => a.age - b.age)
        .slice(0, count)
        .map((n) => n.id);
      return {
        rootNodes: state.rootNodes.filter((n) => !toRemove.includes(n.id)),
      };
    });
  },

  updateNutrientDistribution: (particles) => {
    set({ nutrientParticles: particles });
  },

  resetSimulation: () => {
    set({
      rootNodes: createInitialRoot(),
      timeStep: 0,
      selectedTip: null,
    });
  },

  incrementTimeStep: () => {
    set((state) => ({ timeStep: state.timeStep + 1 }));
  },

  setRunning: (running) => {
    set({ isRunning: running });
  },

  setSelectedTip: (tip) => {
    set({ selectedTip: tip });
  },
}));
