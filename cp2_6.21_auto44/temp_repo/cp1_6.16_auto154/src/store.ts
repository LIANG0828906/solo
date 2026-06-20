import { create } from 'zustand';
import { BuildingBlock, WindParams, SimulationResult, SceneSnapshot } from './types';

const DEFAULT_WIND: WindParams = { direction: 315, speed: 5 };

interface AppState {
  buildings: BuildingBlock[];
  windParams: WindParams;
  simulationResult: SimulationResult | null;
  selectedBuildingId: string | null;
  isSimulating: boolean;
  visualizationMode: 'streamline' | 'contour';
  resultPanelOpen: boolean;
  mouseCoord: { x: number; z: number };
  fps: number;
}

interface AppActions {
  addBuilding: (building: BuildingBlock) => void;
  updateBuilding: (id: string, updates: Partial<BuildingBlock>) => void;
  removeBuilding: (id: string) => void;
  selectBuilding: (id: string | null) => void;
  setWindParams: (params: Partial<WindParams>) => void;
  setSimulationResult: (result: SimulationResult | null) => void;
  setIsSimulating: (v: boolean) => void;
  setVisualizationMode: (mode: 'streamline' | 'contour') => void;
  setResultPanelOpen: (v: boolean) => void;
  setMouseCoord: (x: number, z: number) => void;
  setFps: (fps: number) => void;
  clearScene: () => void;
  loadSnapshot: (snapshot: SceneSnapshot) => void;
  exportSnapshot: () => SceneSnapshot;
}

const generateId = () => Math.random().toString(36).slice(2, 10);

export const useAppStore = create<AppState & AppActions>((set, get) => ({
  buildings: [],
  windParams: { ...DEFAULT_WIND },
  simulationResult: null,
  selectedBuildingId: null,
  isSimulating: false,
  visualizationMode: 'streamline',
  resultPanelOpen: false,
  mouseCoord: { x: 0, z: 0 },
  fps: 60,

  addBuilding: (building) => set((state) => ({
    buildings: [...state.buildings, building],
    selectedBuildingId: building.id,
  })),

  updateBuilding: (id, updates) => set((state) => ({
    buildings: state.buildings.map((b) =>
      b.id === id ? { ...b, ...updates } : b
    ),
  })),

  removeBuilding: (id) => set((state) => ({
    buildings: state.buildings.filter((b) => b.id !== id),
    selectedBuildingId: state.selectedBuildingId === id ? null : state.selectedBuildingId,
  })),

  selectBuilding: (id) => set({ selectedBuildingId: id }),

  setWindParams: (params) => set((state) => ({
    windParams: { ...state.windParams, ...params },
  })),

  setSimulationResult: (result) => set({ simulationResult: result }),

  setIsSimulating: (v) => set({ isSimulating: v }),

  setVisualizationMode: (mode) => set({ visualizationMode: mode }),

  setResultPanelOpen: (v) => set({ resultPanelOpen: v }),

  setMouseCoord: (x, z) => set({ mouseCoord: { x, z } }),

  setFps: (fps) => set({ fps }),

  clearScene: () => set({
    buildings: [],
    simulationResult: null,
    selectedBuildingId: null,
    resultPanelOpen: false,
  }),

  loadSnapshot: (snapshot) => set({
    buildings: snapshot.buildings,
    windParams: snapshot.windParams,
    simulationResult: snapshot.simulationResult || null,
    resultPanelOpen: !!snapshot.simulationResult,
    selectedBuildingId: null,
  }),

  exportSnapshot: () => {
    const state = get();
    return {
      version: '1.0.0',
      timestamp: Date.now(),
      buildings: state.buildings,
      windParams: state.windParams,
      simulationResult: state.simulationResult || undefined,
    };
  },
}));

export { generateId };
