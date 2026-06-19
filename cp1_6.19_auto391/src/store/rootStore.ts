import { create } from 'zustand';
import {
  RootNode,
  GrowthParams,
  createInitialRoots,
  updateRootGrowth,
  getTotalRootLength,
  getBranchCount,
  getMaxDepth,
  getWaterAbsorptionRate,
} from '../engine/rootGrowthEngine';
import {
  HumidityField,
  createHumidityField,
  updateHumidityField,
  getAverageHumidity,
} from '../engine/waterSimulator';

interface RootState {
  humidity: number;
  nutrition: number;
  branchProbability: number;
  growthSpeed: number;

  isPlaying: boolean;
  rootNodes: RootNode[];
  totalLength: number;
  branchCount: number;
  maxDepth: number;
  waterAbsorptionRate: number;
  waterHistory: number[];
  hasReachedBottom: boolean;
  humidityField: HumidityField | null;

  setHumidity: (v: number) => void;
  setNutrition: (v: number) => void;
  setBranchProbability: (v: number) => void;
  setGrowthSpeed: (v: number) => void;

  togglePlay: () => void;
  reset: () => void;
  exportData: () => void;
  updateGrowth: (delta: number) => void;
}

const initialNodes = createInitialRoots();
const initialLength = getTotalRootLength(initialNodes);
const initialBranches = getBranchCount(initialNodes);
const initialDepth = getMaxDepth(initialNodes);

export const useRootStore = create<RootState>((set, get) => ({
  humidity: 60,
  nutrition: 1.0,
  branchProbability: 0.6,
  growthSpeed: 1.0,

  isPlaying: true,
  rootNodes: initialNodes,
  totalLength: initialLength,
  branchCount: initialBranches,
  maxDepth: initialDepth,
  waterAbsorptionRate: 0.5,
  waterHistory: Array(30).fill(0.5),
  hasReachedBottom: false,
  humidityField: null,

  setHumidity: (v) => set({ humidity: v }),
  setNutrition: (v) => set({ nutrition: v }),
  setBranchProbability: (v) => set({ branchProbability: v }),
  setGrowthSpeed: (v) => set({ growthSpeed: v }),

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  reset: () => {
    const nodes = createInitialRoots();
    set({
      rootNodes: nodes,
      totalLength: getTotalRootLength(nodes),
      branchCount: getBranchCount(nodes),
      maxDepth: getMaxDepth(nodes),
      waterAbsorptionRate: 0.5,
      waterHistory: Array(30).fill(0.5),
      hasReachedBottom: false,
      humidityField: null,
      isPlaying: true,
    });
  },

  exportData: () => {
    const state = get();
    const data = {
      parameters: {
        humidity: state.humidity,
        nutrition: state.nutrition,
        branchProbability: state.branchProbability,
        growthSpeed: state.growthSpeed,
      },
      statistics: {
        totalLength: state.totalLength,
        branchCount: state.branchCount,
        maxDepth: state.maxDepth,
        waterAbsorptionRate: state.waterAbsorptionRate,
        nodeCount: state.rootNodes.length,
      },
      nodes: state.rootNodes,
      waterHistory: state.waterHistory,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `root-growth-data-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  updateGrowth: (delta) => {
    const state = get();
    if (!state.isPlaying) return;

    const params: GrowthParams = {
      humidity: state.humidity,
      nutrition: state.nutrition,
      branchProbability: state.branchProbability,
      growthSpeed: state.growthSpeed,
    };

    let humidityField = state.humidityField;
    if (!humidityField) {
      humidityField = createHumidityField(state.humidity);
    }

    const rootPositions = state.rootNodes.map((n) => n.position);
    humidityField = updateHumidityField(humidityField, rootPositions, delta, state.humidity);

    const avgHumidity = getAverageHumidity(humidityField);
    const result = updateRootGrowth(state.rootNodes, params, delta, avgHumidity);

    const absorption = getWaterAbsorptionRate(result.nodes, params);

    const newHistory = [...state.waterHistory.slice(1), absorption];

    const newReachedBottom = state.hasReachedBottom || result.reachedBottom;

    set({
      rootNodes: result.nodes,
      totalLength: getTotalRootLength(result.nodes),
      branchCount: getBranchCount(result.nodes),
      maxDepth: getMaxDepth(result.nodes),
      waterAbsorptionRate: absorption,
      waterHistory: newHistory,
      hasReachedBottom: newReachedBottom,
      humidityField,
    });
  },
}));
