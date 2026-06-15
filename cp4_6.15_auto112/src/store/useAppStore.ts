import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  SceneConfig,
  BuildingModel,
  ShadowAnalysisResult,
  AppState,
  AppActions,
} from '../types';

const SHADOW_COLORS = ['#ff4444', '#4488ff', '#44ff44'];

const defaultConfig: SceneConfig = {
  date: 172,
  time: 12,
  location: {
    latitude: 39.9,
    longitude: 116.4,
    cityName: '北京',
  },
  isPlaying: false,
  playSpeed: 1,
  showHeatmap: false,
  isCloudy: false,
  gridSize: 50,
  sampleResolution: 20,
};

const initialState: AppState = {
  config: defaultConfig,
  buildings: [],
  analysisResult: null,
  selectedBuildingId: null,
  activePanelTab: 'control',
  isMobileDrawerOpen: false,
};

type Store = AppState & AppActions;

export const useAppStore = create<Store>((set, get) => ({
  ...initialState,

  setConfig: (partial: Partial<SceneConfig>) => {
    set((state) => ({
      config: { ...state.config, ...partial },
    }));
  },

  addBuilding: (building: Omit<BuildingModel, 'id' | 'isSelected'>) => {
    const { buildings } = get();
    if (buildings.length >= 3) return;

    const shadowColor = SHADOW_COLORS[buildings.length];
    const newBuilding: BuildingModel = {
      ...building,
      id: uuidv4(),
      isSelected: false,
      shadowColor,
    };

    set((state) => ({
      buildings: [...state.buildings, newBuilding],
    }));
  },

  removeBuilding: (id: string) => {
    set((state) => ({
      buildings: state.buildings.filter((b) => b.id !== id),
      selectedBuildingId: state.selectedBuildingId === id ? null : state.selectedBuildingId,
    }));
  },

  updateBuilding: (id: string, updates: Partial<BuildingModel>) => {
    set((state) => ({
      buildings: state.buildings.map((b) =>
        b.id === id ? { ...b, ...updates } : b
      ),
    }));
  },

  selectBuilding: (id: string | null) => {
    set((state) => ({
      selectedBuildingId: id,
      buildings: state.buildings.map((b) => ({
        ...b,
        isSelected: b.id === id,
      })),
    }));
  },

  setAnalysisResult: (result: ShadowAnalysisResult | null) => {
    set({ analysisResult: result });
  },

  setAnalysisProgress: (progress: number) => {
    set((state) => ({
      analysisResult: state.analysisResult
        ? { ...state.analysisResult, progress }
        : null,
    }));
  },

  setActivePanelTab: (tab: 'control' | 'analysis') => {
    set({ activePanelTab: tab });
  },

  toggleMobileDrawer: () => {
    set((state) => ({
      isMobileDrawerOpen: !state.isMobileDrawerOpen,
    }));
  },

  startPlayback: () => {
    set((state) => ({
      config: { ...state.config, isPlaying: true },
    }));
  },

  pausePlayback: () => {
    set((state) => ({
      config: { ...state.config, isPlaying: false },
    }));
  },

  resetPlayback: () => {
    set((state) => ({
      config: { ...state.config, time: 6, isPlaying: false },
    }));
  },

  runAnalysis: () => {
    // 预留方法，后面由 SceneViewer 实现
  },
}));
