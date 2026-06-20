import { create } from 'zustand';
import * as THREE from 'three';
import type {
  ModelInstance,
  ComparisonMode,
  Annotation,
  MeasurementLine,
  ThemeType,
  ThemeConfig,
  CameraState,
  ViewSynchronization,
  MeasurementPoint,
} from '@/types';

export const THEMES: Record<ThemeType, ThemeConfig> = {
  dusk: {
    ambientColor: '#2C3E50',
    ambientIntensity: 0.6,
    directionalColor: '#F5B041',
    directionalIntensity: 1.2,
    backgroundColor: '#1a1a24',
  },
  daylight: {
    ambientColor: '#FFFDE7',
    ambientIntensity: 0.8,
    directionalColor: '#FFFFFF',
    directionalIntensity: 1.5,
    backgroundColor: '#87CEEB',
  },
  night: {
    ambientColor: '#1A237E',
    ambientIntensity: 0.4,
    directionalColor: '#3949AB',
    directionalIntensity: 0.6,
    backgroundColor: '#0d1033',
    hasPointLight: true,
    pointLightColor: '#FFD54F',
    pointLightPosition: [5, 8, 5],
    pointLightIntensity: 2.0,
  },
};

const defaultTransform = {
  position: [0, 0, 0] as [number, number, number],
  rotation: [0, 0, 0] as [number, number, number],
  scale: 1,
};

interface ComparisonState {
  modelA: ModelInstance;
  modelB: ModelInstance;
  mode: ComparisonMode;
  overlayOpacity: number;
  hueShiftA: number;
  annotations: Annotation[];
  activeAnnotation: Annotation | null;
  annotationCardPosition: { x: number; y: number } | null;
  measurements: MeasurementLine[];
  activeMeasurement: MeasurementLine | null;
  measurementMode: boolean;
  theme: ThemeType;
  themeConfig: ThemeConfig;
  viewSync: ViewSynchronization;
  cameraA: CameraState;
  cameraB: CameraState;
  currentYear: number;
  showFileUpload: boolean;
  splitRatio: number;

  setModelScene: (id: 'A' | 'B', scene: THREE.Group, fileName: string) => void;
  setModelLoadingProgress: (id: 'A' | 'B', progress: number) => void;
  setModelTransform: (id: 'A' | 'B', transform: Partial<ModelInstance['transform']>) => void;
  setMode: (mode: ComparisonMode) => void;
  setOverlayOpacity: (opacity: number) => void;
  setTheme: (theme: ThemeType) => void;
  setViewSync: (sync: Partial<ViewSynchronization>) => void;
  setCameraState: (id: 'A' | 'B', state: Partial<CameraState>) => void;
  setCurrentYear: (year: number) => void;
  setShowFileUpload: (show: boolean) => void;
  setSplitRatio: (ratio: number) => void;
  addAnnotation: (annotation: Annotation) => void;
  setActiveAnnotation: (annotation: Annotation | null, position?: { x: number; y: number } | null) => void;
  markAnnotationViewed: (id: string) => void;
  setMeasurementMode: (active: boolean) => void;
  startMeasurement: (point: MeasurementPoint) => void;
  updateMeasurement: (point: MeasurementPoint, distance: number) => void;
  completeMeasurement: (endPoint: MeasurementPoint, distance: number) => void;
  cancelMeasurement: () => void;
  removeMeasurement: (id: string) => void;
  clearAllMeasurements: () => void;
  resetAll: () => void;
}

export const useComparisonStore = create<ComparisonState>((set, get) => ({
  modelA: {
    id: 'A',
    scene: null,
    transform: { ...defaultTransform, position: [-3, 0, 0] },
    loaded: false,
    fileName: '',
    edgeColor: '#FFAB91',
    loadingProgress: 0,
  },
  modelB: {
    id: 'B',
    scene: null,
    transform: { ...defaultTransform, position: [3, 0, 0] },
    loaded: false,
    fileName: '',
    edgeColor: '#81D4FA',
    loadingProgress: 0,
  },
  mode: 'split',
  overlayOpacity: 0.5,
  hueShiftA: 0.1,
  annotations: [],
  activeAnnotation: null,
  annotationCardPosition: null,
  measurements: [],
  activeMeasurement: null,
  measurementMode: false,
  theme: 'dusk',
  themeConfig: THEMES.dusk,
  viewSync: {
    enabled: false,
    source: 'A',
  },
  cameraA: {
    position: [10, 8, 10],
    target: [0, 3, 0],
  },
  cameraB: {
    position: [10, 8, 10],
    target: [0, 3, 0],
  },
  currentYear: 100,
  showFileUpload: true,
  splitRatio: 0.5,

  setModelScene: (id, scene, fileName) =>
    set((state) => ({
      [id === 'A' ? 'modelA' : 'modelB']: {
        ...state[id === 'A' ? 'modelA' : 'modelB'],
        scene,
        fileName,
        loaded: true,
        loadingProgress: 100,
      },
    })),

  setModelLoadingProgress: (id, progress) =>
    set((state) => ({
      [id === 'A' ? 'modelA' : 'modelB']: {
        ...state[id === 'A' ? 'modelA' : 'modelB'],
        loadingProgress: progress,
      },
    })),

  setModelTransform: (id, transform) =>
    set((state) => ({
      [id === 'A' ? 'modelA' : 'modelB']: {
        ...state[id === 'A' ? 'modelA' : 'modelB'],
        transform: {
          ...state[id === 'A' ? 'modelA' : 'modelB'].transform,
          ...transform,
        },
      },
    })),

  setMode: (mode) => set({ mode }),

  setOverlayOpacity: (opacity) => set({ overlayOpacity: Math.max(0, Math.min(1, opacity)) }),

  setTheme: (theme) => set({ theme, themeConfig: THEMES[theme] }),

  setViewSync: (sync) =>
    set((state) => ({
      viewSync: { ...state.viewSync, ...sync },
    })),

  setCameraState: (id, cameraState) => {
    const key = id === 'A' ? 'cameraA' : 'cameraB';
    const otherKey = id === 'A' ? 'cameraB' : 'cameraA';
    const state = get();

    if (state.viewSync.enabled) {
      const newCam = { ...state[key], ...cameraState };
      set({
        [key]: newCam,
        [otherKey]: newCam,
      });
    } else {
      set((s) => ({
        [key]: { ...s[key], ...cameraState },
      }));
    }
  },

  setCurrentYear: (year) => set({ currentYear: year }),

  setShowFileUpload: (show) => set({ showFileUpload: show }),

  setSplitRatio: (ratio) => set({ splitRatio: Math.max(0.2, Math.min(0.8, ratio)) }),

  addAnnotation: (annotation) =>
    set((state) => ({
      annotations: [...state.annotations, annotation],
    })),

  setActiveAnnotation: (annotation, position = null) =>
    set({
      activeAnnotation: annotation,
      annotationCardPosition: position,
    }),

  markAnnotationViewed: (id) =>
    set((state) => ({
      annotations: state.annotations.map((a) =>
        a.id === id ? { ...a, viewed: true } : a
      ),
    })),

  setMeasurementMode: (active) =>
    set({
      measurementMode: active,
      activeMeasurement: null,
    }),

  startMeasurement: (point) => {
    const state = get();
    if (state.measurements.length >= 3) return;
    const newMeasurement: MeasurementLine = {
      id: `meas-${Date.now()}`,
      start: point,
      end: null,
      distance: 0,
      complete: false,
    };
    set({ activeMeasurement: newMeasurement });
  },

  updateMeasurement: (point, distance) => {
    const state = get();
    if (!state.activeMeasurement) return;
    set({
      activeMeasurement: {
        ...state.activeMeasurement,
        end: point,
        distance,
      },
    });
  },

  completeMeasurement: (endPoint, distance) => {
    const state = get();
    if (!state.activeMeasurement || state.measurements.length >= 3) return;
    const completed: MeasurementLine = {
      ...state.activeMeasurement,
      end: endPoint,
      distance,
      complete: true,
    };
    set({
      measurements: [...state.measurements, completed],
      activeMeasurement: null,
    });
  },

  cancelMeasurement: () => set({ activeMeasurement: null }),

  removeMeasurement: (id) =>
    set((state) => ({
      measurements: state.measurements.filter((m) => m.id !== id),
    })),

  clearAllMeasurements: () =>
    set({ measurements: [], activeMeasurement: null }),

  resetAll: () =>
    set({
      annotations: [],
      activeAnnotation: null,
      measurements: [],
      activeMeasurement: null,
      measurementMode: false,
      currentYear: 100,
    }),
}));
