import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  AnalysisPoint,
  BuildingModelType,
  LightConfig,
  LightMode,
  SavedScheme,
} from './types';

interface AppState {
  currentModelId: BuildingModelType;
  lightConfig: LightConfig;
  analysisPoints: AnalysisPoint[];
  schemes: SavedScheme[];
  isDraggingPoint: boolean;
  pendingPoint: { x: number; y: number; z: number } | null;
  setCurrentModel: (id: BuildingModelType) => void;
  setSunAzimuth: (v: number) => void;
  setSunElevation: (v: number) => void;
  setLightMode: (mode: LightMode) => void;
  addAnalysisPoint: (position: { x: number; y: number; z: number }) => void;
  removeAnalysisPoint: (id: string) => void;
  updatePointIlluminance: (id: string, value: number) => void;
  setDraggingPoint: (v: boolean) => void;
  setPendingPoint: (p: { x: number; y: number; z: number } | null) => void;
  saveScheme: (name: string, cameraPosition: [number, number, number]) => void;
  loadScheme: (id: string) => SavedScheme | null;
  deleteScheme: (id: string) => void;
}

const MAX_ANALYSIS_POINTS = 3;

export const useStore = create<AppState>((set, get) => ({
  currentModelId: 'villa',
  lightConfig: {
    sunAzimuth: 45,
    sunElevation: 50,
    mode: 'sunny',
  },
  analysisPoints: [],
  schemes: [],
  isDraggingPoint: false,
  pendingPoint: null,

  setCurrentModel: (id) => {
    set({ currentModelId: id, analysisPoints: [] });
  },

  setSunAzimuth: (v) => {
    set((s) => ({
      lightConfig: { ...s.lightConfig, sunAzimuth: Math.max(0, Math.min(360, v)) },
    }));
  },

  setSunElevation: (v) => {
    set((s) => ({
      lightConfig: { ...s.lightConfig, sunElevation: Math.max(0, Math.min(90, v)) },
    }));
  },

  setLightMode: (mode) => {
    set((s) => ({ lightConfig: { ...s.lightConfig, mode } }));
  },

  addAnalysisPoint: (position) => {
    const newPoint: AnalysisPoint = {
      id: uuidv4(),
      position,
      illuminance: 0,
    };
    set((s) => {
      const existing = [...s.analysisPoints];
      if (existing.length >= MAX_ANALYSIS_POINTS) {
        existing.shift();
      }
      existing.push(newPoint);
      return { analysisPoints: existing };
    });
  },

  removeAnalysisPoint: (id) => {
    set((s) => ({
      analysisPoints: s.analysisPoints.filter((p) => p.id !== id),
    }));
  },

  updatePointIlluminance: (id, value) => {
    set((s) => ({
      analysisPoints: s.analysisPoints.map((p) =>
        p.id === id ? { ...p, illuminance: value } : p,
      ),
    }));
  },

  setDraggingPoint: (v) => {
    set({ isDraggingPoint: v });
  },

  setPendingPoint: (p) => {
    set({ pendingPoint: p });
  },

  saveScheme: (name, cameraPosition) => {
    const { currentModelId, lightConfig, analysisPoints } = get();
    const scheme: SavedScheme = {
      id: uuidv4(),
      name: name || `方案 ${Date.now()}`,
      timestamp: Date.now(),
      modelId: currentModelId,
      cameraPosition,
      lightConfig: { ...lightConfig },
      analysisPoints: analysisPoints.map((p) => ({ ...p, position: { ...p.position } })),
    };
    set((s) => ({ schemes: [...s.schemes, scheme] }));
  },

  loadScheme: (id) => {
    const scheme = get().schemes.find((s) => s.id === id);
    if (!scheme) return null;
    set({
      currentModelId: scheme.modelId,
      lightConfig: { ...scheme.lightConfig },
      analysisPoints: scheme.analysisPoints.map((p) => ({
        ...p,
        position: { ...p.position },
      })),
    });
    return scheme;
  },

  deleteScheme: (id) => {
    set((s) => ({ schemes: s.schemes.filter((sc) => sc.id !== id) }));
  },
}));
