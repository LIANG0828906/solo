import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface Particle {
  id: string;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  temperature: number;
  size: number;
  angle: number;
  radius: number;
  height: number;
}

export interface CollisionEvent {
  id: string;
  position: { x: number; y: number; z: number };
  timestamp: number;
  type: 'flash' | 'marker';
}

export interface CollisionLogEntry {
  id: string;
  timestamp: number;
  position: { x: number; y: number; z: number };
}

export interface SimulationParams {
  temperature: number;
  magneticField: number;
  particleCount: number;
  fusionProbability: number;
}

export interface CameraState {
  distance: number;
  theta: number;
  phi: number;
  panX: number;
  panY: number;
}

export interface SimulationState {
  particles: Particle[];
  collisions: CollisionEvent[];
  collisionLogs: CollisionLogEntry[];
  params: SimulationParams;
  camera: CameraState;
  totalFusions: number;
  fusionRate: number;
  temperatureHistory: number[];
  isRunning: boolean;
  startTime: number;
  setParams: (params: Partial<SimulationParams>) => void;
  setCamera: (camera: Partial<CameraState>) => void;
  addCollision: (event: Omit<CollisionEvent, 'id' | 'timestamp'>) => void;
  addCollisionLog: (position: { x: number; y: number; z: number }) => void;
  incrementFusion: () => void;
  updateFusionRate: (rate: number) => void;
  addTemperatureSample: (temp: number) => void;
  resetSimulation: () => void;
  toggleRunning: () => void;
  setParticles: (particles: Particle[]) => void;
}

const defaultParams: SimulationParams = {
  temperature: 5e7,
  magneticField: 5,
  particleCount: 200,
  fusionProbability: 30,
};

const defaultCamera: CameraState = {
  distance: 15,
  theta: 0,
  phi: 0,
  panX: 0,
  panY: 0,
};

export const useSimulationStore = create<SimulationState>((set) => ({
  particles: [],
  collisions: [],
  collisionLogs: [],
  params: defaultParams,
  camera: defaultCamera,
  totalFusions: 0,
  fusionRate: 0,
  temperatureHistory: [],
  isRunning: true,
  startTime: Date.now(),

  setParams: (params) =>
    set((state) => ({
      params: { ...state.params, ...params },
    })),

  setCamera: (camera) =>
    set((state) => ({
      camera: { ...state.camera, ...camera },
    })),

  addCollision: (event) => {
    const now = Date.now();
    const newEvent: CollisionEvent = {
      ...event,
      id: uuidv4(),
      timestamp: now,
    };
    set((state) => ({
      collisions: [...state.collisions, newEvent].filter(
        (c) => now - c.timestamp < 1500
      ),
    }));
  },

  addCollisionLog: (position) => {
    const now = Date.now();
    const entry: CollisionLogEntry = {
      id: uuidv4(),
      timestamp: now,
      position,
    };
    set((state) => {
      const logs = [...state.collisionLogs, entry];
      if (logs.length > 20) {
        logs.shift();
      }
      return { collisionLogs: logs };
    });
  },

  incrementFusion: () =>
    set((state) => ({
      totalFusions: state.totalFusions + 1,
    })),

  updateFusionRate: (rate) =>
    set(() => ({
      fusionRate: rate,
    })),

  addTemperatureSample: (temp) =>
    set((state) => {
      const history = [...state.temperatureHistory, temp];
      if (history.length > 100) {
        history.shift();
      }
      return { temperatureHistory: history };
    }),

  resetSimulation: () =>
    set(() => ({
      particles: [],
      collisions: [],
      collisionLogs: [],
      totalFusions: 0,
      fusionRate: 0,
      temperatureHistory: [],
      startTime: Date.now(),
      isRunning: true,
    })),

  toggleRunning: () =>
    set((state) => ({
      isRunning: !state.isRunning,
    })),

  setParticles: (particles) =>
    set(() => ({
      particles,
    })),
}));
