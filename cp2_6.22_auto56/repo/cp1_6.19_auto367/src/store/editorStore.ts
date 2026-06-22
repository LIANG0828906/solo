import { create } from 'zustand';
import { colorThemes, ColorTheme } from '../modules/bulletPatterns';

export type PatternType = 'fan' | 'spiral' | 'wave' | 'random';

export interface PerformanceStats {
  currentFps: number;
  averageFps: number;
  minFps: number;
  droppedFrames: number;
  fpsHistory: number[];
  isTesting: boolean;
  testStartTime: number;
}

interface EditorState {
  patternType: PatternType;
  secondaryPatternType: PatternType;
  overlayMode: boolean;
  bulletSpeed: number;
  theme: ColorTheme;
  performanceMonitoring: boolean;

  fanParams: {
    bulletCount: number;
    angleRange: number;
  };
  spiralParams: {
    rotations: number;
    bulletsPerRotation: number;
  };
  waveParams: {
    bulletCount: number;
    amplitude: number;
    frequency: number;
  };
  randomParams: {
    bulletCount: number;
    minSpeed: number;
    maxSpeed: number;
  };

  stats: PerformanceStats;

  setPatternType: (type: PatternType) => void;
  setSecondaryPatternType: (type: PatternType) => void;
  setOverlayMode: (value: boolean) => void;
  setBulletSpeed: (speed: number) => void;
  setTheme: (theme: ColorTheme) => void;
  setPerformanceMonitoring: (value: boolean) => void;

  setFanParams: (params: Partial<EditorState['fanParams']>) => void;
  setSpiralParams: (params: Partial<EditorState['spiralParams']>) => void;
  setWaveParams: (params: Partial<EditorState['waveParams']>) => void;
  setRandomParams: (params: Partial<EditorState['randomParams']>) => void;

  updateStats: (stats: Partial<PerformanceStats>) => void;
  resetStats: () => void;
  startPerformanceTest: () => void;
  stopPerformanceTest: () => void;
}

const initialStats: PerformanceStats = {
  currentFps: 60,
  averageFps: 60,
  minFps: 60,
  droppedFrames: 0,
  fpsHistory: [],
  isTesting: false,
  testStartTime: 0,
};

export const useEditorStore = create<EditorState>((set) => ({
  patternType: 'fan',
  secondaryPatternType: 'spiral',
  overlayMode: false,
  bulletSpeed: 4,
  theme: colorThemes[0],
  performanceMonitoring: true,

  fanParams: {
    bulletCount: 50,
    angleRange: 120,
  },
  spiralParams: {
    rotations: 5,
    bulletsPerRotation: 10,
  },
  waveParams: {
    bulletCount: 100,
    amplitude: 60,
    frequency: 4,
  },
  randomParams: {
    bulletCount: 200,
    minSpeed: 2,
    maxSpeed: 6,
  },

  stats: initialStats,

  setPatternType: (type) => set({ patternType: type }),
  setSecondaryPatternType: (type) => set({ secondaryPatternType: type }),
  setOverlayMode: (value) => set({ overlayMode: value }),
  setBulletSpeed: (speed) => set({ bulletSpeed: speed }),
  setTheme: (theme) => set({ theme }),
  setPerformanceMonitoring: (value) => set({ performanceMonitoring: value }),

  setFanParams: (params) =>
    set((state) => ({ fanParams: { ...state.fanParams, ...params } })),
  setSpiralParams: (params) =>
    set((state) => ({ spiralParams: { ...state.spiralParams, ...params } })),
  setWaveParams: (params) =>
    set((state) => ({ waveParams: { ...state.waveParams, ...params } })),
  setRandomParams: (params) =>
    set((state) => ({ randomParams: { ...state.randomParams, ...params } })),

  updateStats: (newStats) =>
    set((state) => ({ stats: { ...state.stats, ...newStats } })),
  resetStats: () => set({ stats: { ...initialStats } }),
  startPerformanceTest: () =>
    set({
      stats: {
        ...initialStats,
        isTesting: true,
        testStartTime: performance.now(),
      },
    }),
  stopPerformanceTest: () =>
    set((state) => ({ stats: { ...state.stats, isTesting: false } })),
}));
