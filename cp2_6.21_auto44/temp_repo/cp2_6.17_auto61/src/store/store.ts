import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface Particle {
  id: string;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  temperature: number;
  size: number;
  color: string;
  toroidalAngle: number;
  radialOffset: number;
  poloidalAngle: number;
}

export interface SimulationParams {
  temperature: number;
  magneticField: number;
  particleCount: number;
  reactionProbability: number;
}

export interface CollisionEvent {
  id: string;
  position: { x: number; y: number; z: number };
  timestamp: number;
  flashOpacity: number;
  markerOpacity: number;
}

export interface DiagnosticsData {
  reactionRate: number;
  averageTemperature: number;
  temperatureHistory: number[];
  totalFusions: number;
}

export interface CameraState {
  distance: number;
  theta: number;
  phi: number;
  panX: number;
  panY: number;
}

interface FusionStore {
  particles: Particle[];
  params: SimulationParams;
  collisions: CollisionEvent[];
  diagnostics: DiagnosticsData;
  camera: CameraState;
  isPanelOpen: boolean;
  isFullscreen: boolean;
  setParams: (params: Partial<SimulationParams>) => void;
  updateParticles: (particles: Particle[]) => void;
  addCollision: (position: { x: number; y: number; z: number }) => void;
  updateCollisionOpacity: (id: string, flashOpacity: number, markerOpacity: number) => void;
  removeCollision: (id: string) => void;
  updateDiagnostics: (data: Partial<DiagnosticsData>) => void;
  updateCamera: (camera: Partial<CameraState>) => void;
  togglePanel: () => void;
  toggleFullscreen: () => void;
  resetSimulation: () => void;
}

const DEFAULT_PARAMS: SimulationParams = {
  temperature: 5e7,
  magneticField: 5,
  particleCount: 200,
  reactionProbability: 50,
};

const DEFAULT_CAMERA: CameraState = {
  distance: 15,
  theta: 0,
  phi: 0,
  panX: 0,
  panY: 0,
};

const DEFAULT_DIAGNOSTICS: DiagnosticsData = {
  reactionRate: 0,
  averageTemperature: 5e7,
  temperatureHistory: [],
  totalFusions: 0,
};

export const useFusionStore = create<FusionStore>((set) => ({
  particles: [],
  params: DEFAULT_PARAMS,
  collisions: [],
  diagnostics: DEFAULT_DIAGNOSTICS,
  camera: DEFAULT_CAMERA,
  isPanelOpen: true,
  isFullscreen: false,

  setParams: (params) =>
    set((state) => ({
      params: { ...state.params, ...params },
    })),

  updateParticles: (particles) => set({ particles }),

  addCollision: (position) =>
    set((state) => ({
      collisions: [
        ...state.collisions,
        {
          id: uuidv4(),
          position,
          timestamp: Date.now(),
          flashOpacity: 1.0,
          markerOpacity: 1.0,
        },
      ],
      diagnostics: {
        ...state.diagnostics,
        totalFusions: state.diagnostics.totalFusions + 1,
      },
    })),

  updateCollisionOpacity: (id, flashOpacity, markerOpacity) =>
    set((state) => ({
      collisions: state.collisions.map((c) =>
        c.id === id ? { ...c, flashOpacity, markerOpacity } : c
      ),
    })),

  removeCollision: (id) =>
    set((state) => ({
      collisions: state.collisions.filter((c) => c.id !== id),
    })),

  updateDiagnostics: (data) =>
    set((state) => ({
      diagnostics: { ...state.diagnostics, ...data },
    })),

  updateCamera: (camera) =>
    set((state) => ({
      camera: { ...state.camera, ...camera },
    })),

  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),

  toggleFullscreen: () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      set({ isFullscreen: true });
    } else {
      document.exitFullscreen().catch(() => {});
      set({ isFullscreen: false });
    }
  },

  resetSimulation: () =>
    set({
      particles: [],
      collisions: [],
      diagnostics: DEFAULT_DIAGNOSTICS,
      params: DEFAULT_PARAMS,
      camera: DEFAULT_CAMERA,
    }),
}));

export function tempToColor(temp: number, minTemp: number, maxTemp: number): string {
  const t = Math.max(0, Math.min(1, (temp - minTemp) / (maxTemp - minTemp)));
  const r = Math.round(30 + t * 225);
  const g = Math.round(144 + t * 111);
  const b = Math.round(255);
  return `rgb(${r}, ${g}, ${b})`;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}
