import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type DisplayMode = 'damaged' | 'repaired';

export interface DamageInfo {
  type: string;
  description: string;
  size: string;
}

export interface RepairInfo {
  material: string;
  description: string;
}

export interface ArtifactInfo {
  name: string;
  dynasty: string;
  year: string;
  dimensions: {
    height: string;
    diameter: string;
    footDiameter: string;
  };
  damages: DamageInfo[];
  repair: RepairInfo;
}

interface AppState {
  mode: DisplayMode;
  repairProgress: number;
  isRepairAnimating: boolean;

  isCutaway: boolean;
  cutawayProgress: number;
  isCutawayAnimating: boolean;

  cameraDistance: number;
  cameraRotationX: number;
  cameraRotationY: number;
  minDistance: number;
  maxDistance: number;

  platformRotation: number;
  isUserInteracting: boolean;

  isPanelCollapsed: boolean;
  isMobileView: boolean;

  artifactInfo: ArtifactInfo;

  toggleRepairMode: () => void;
  setRepairProgress: (progress: number) => void;
  setRepairAnimating: (animating: boolean) => void;

  toggleCutaway: () => void;
  setCutawayProgress: (progress: number) => void;
  setCutawayAnimating: (animating: boolean) => void;

  setCameraDistance: (distance: number) => void;
  setCameraRotation: (x: number, y: number) => void;

  setPlatformRotation: (rotation: number) => void;
  setUserInteracting: (interacting: boolean) => void;

  togglePanel: () => void;
  setIsMobileView: (isMobile: boolean) => void;

  exportReport: () => void;
}

const defaultArtifactInfo: ArtifactInfo = {
  name: '青花缠枝莲纹碗',
  dynasty: '清康熙',
  year: '1680年',
  dimensions: {
    height: '8.5cm',
    diameter: '16.2cm',
    footDiameter: '6.8cm',
  },
  damages: [
    { type: '缺口', description: '碗沿东侧缺损', size: '约2.3cm × 1.5cm' },
    { type: '冲线', description: '碗身纵向裂纹一条', size: '长约6.8cm' },
    { type: '剥釉', description: '外壁局部釉面剥落', size: '约1.2cm × 0.8cm' },
  ],
  repair: {
    material: '环氧树脂补缺 + 仿釉涂料修复冲线 + 局部做旧',
    description: '采用可逆性修复材料，最小介入原则，保持文物历史信息',
  },
};

export const useStore = create<AppState>()(
  immer((set) => ({
    mode: 'damaged',
    repairProgress: 0,
    isRepairAnimating: false,

    isCutaway: false,
    cutawayProgress: 0,
    isCutawayAnimating: false,

    cameraDistance: 30,
    cameraRotationX: 0.3,
    cameraRotationY: 0,
    minDistance: 10,
    maxDistance: 100,

    platformRotation: 0,
    isUserInteracting: false,

    isPanelCollapsed: false,
    isMobileView: false,

    artifactInfo: defaultArtifactInfo,

    toggleRepairMode: () =>
      set((state) => {
        state.mode = state.mode === 'damaged' ? 'repaired' : 'damaged';
      }),

    setRepairProgress: (progress: number) =>
      set((state) => {
        state.repairProgress = progress;
      }),

    setRepairAnimating: (animating: boolean) =>
      set((state) => {
        state.isRepairAnimating = animating;
      }),

    toggleCutaway: () =>
      set((state) => {
        state.isCutaway = !state.isCutaway;
      }),

    setCutawayProgress: (progress: number) =>
      set((state) => {
        state.cutawayProgress = progress;
      }),

    setCutawayAnimating: (animating: boolean) =>
      set((state) => {
        state.isCutawayAnimating = animating;
      }),

    setCameraDistance: (distance: number) =>
      set((state) => {
        state.cameraDistance = Math.max(state.minDistance, Math.min(state.maxDistance, distance));
      }),

    setCameraRotation: (x: number, y: number) =>
      set((state) => {
        state.cameraRotationX = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, x));
        state.cameraRotationY = y;
      }),

    setPlatformRotation: (rotation: number) =>
      set((state) => {
        state.platformRotation = rotation;
      }),

    setUserInteracting: (interacting: boolean) =>
      set((state) => {
        state.isUserInteracting = interacting;
      }),

    togglePanel: () =>
      set((state) => {
        state.isPanelCollapsed = !state.isPanelCollapsed;
      }),

    setIsMobileView: (isMobile: boolean) =>
      set((state) => {
        state.isMobileView = isMobile;
      }),

    exportReport: () => {
      console.log('Exporting report...');
    },
  }))
);
