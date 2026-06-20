import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { SceneState, CellType, Organelle, Vec3, PathData } from '@/types';
import { organellePresets } from '@/constants/presets';
import { generateControlPoints } from '@/utils/pathUtils';
import { buildExportConfig, downloadJSON } from '@/utils/exportUtils';

const defaultParams = {
  ambientLightIntensity: 0.4,
  membraneOpacity: 0.25,
  vesicleSize: 0.2,
  trailLength: 20,
};

export const useSceneStore = create<SceneState>((set, get) => ({
  cellType: 'default',
  organelles: organellePresets.default.map((o) => ({ ...o })),
  paths: [],
  activePathId: null,
  pendingStartPoint: null,
  isPlaying: false,
  progress: 0,
  params: defaultParams,

  updateOrganelle: (id: string, data: Partial<Organelle>) =>
    set((state) => ({
      organelles: state.organelles.map((o) =>
        o.id === id ? { ...o, ...data } : o
      ),
    })),

  addPath: (start: Vec3, end: Vec3) => {
    const newPath: PathData = {
      id: uuidv4(),
      startPoint: start,
      endPoint: end,
      controlPoints: generateControlPoints(start, end, 5),
      speed: 1.5,
    };
    set((state) => ({
      paths: [...state.paths, newPath],
      activePathId: newPath.id,
      pendingStartPoint: null,
    }));
  },

  removePath: (id: string) =>
    set((state) => ({
      paths: state.paths.filter((p) => p.id !== id),
      activePathId: state.activePathId === id ? null : state.activePathId,
      progress: 0,
      isPlaying: false,
    })),

  updatePathControlPoint: (pathId: string, index: number, position: Vec3) =>
    set((state) => ({
      paths: state.paths.map((p) => {
        if (p.id !== pathId) return p;
        const newControlPoints = [...p.controlPoints];
        newControlPoints[index] = position;
        return { ...p, controlPoints: newControlPoints };
      }),
    })),

  updatePathSpeed: (pathId: string, speed: number) =>
    set((state) => ({
      paths: state.paths.map((p) =>
        p.id === pathId ? { ...p, speed: Math.max(0.5, Math.min(3, speed)) } : p
      ),
    })),

  setCellType: (type: CellType) =>
    set(() => ({
      cellType: type,
      organelles: organellePresets[type].map((o) => ({ ...o, id: uuidv4() })),
      paths: [],
      activePathId: null,
      pendingStartPoint: null,
      isPlaying: false,
      progress: 0,
    })),

  updateParams: (params) =>
    set((state) => ({
      params: { ...state.params, ...params },
    })),

  setPlaying: (playing) =>
    set(() => ({
      isPlaying: playing,
    })),

  setProgress: (progress) =>
    set(() => ({
      progress: Math.max(0, Math.min(1, progress)),
    })),

  setPendingStartPoint: (point) =>
    set(() => ({
      pendingStartPoint: point,
    })),

  resetScene: () =>
    set(() => ({
      cellType: 'default',
      organelles: organellePresets.default.map((o) => ({ ...o, id: uuidv4() })),
      paths: [],
      activePathId: null,
      pendingStartPoint: null,
      isPlaying: false,
      progress: 0,
      params: defaultParams,
    })),

  exportConfig: () => {
    const state = get();
    const config = buildExportConfig(state);
    downloadJSON(config);
    return config;
  },
}));
