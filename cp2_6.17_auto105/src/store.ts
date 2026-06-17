import { create } from 'zustand';
import type { ControlParams, GestureForce, ParticleState } from './engine/types';

interface StoreState {
  particleState: ParticleState[];
  controlParams: ControlParams;
  gestureForce: GestureForce;
  isPaused: boolean;
  particlesEmittedThisSecond: number;
  fps: number;
}

interface StoreActions {
  updateParticles: (states: ParticleState[]) => void;
  setControlParam: <K extends keyof ControlParams>(key: K, value: ControlParams[K]) => void;
  setGestureForce: (force: Partial<GestureForce>) => void;
  reset: () => void;
  togglePause: () => void;
  emitParticles: (count: number, position?: [number, number, number]) => void;
  setFps: (fps: number) => void;
  incrementEmittedCount: (count: number) => void;
  resetEmittedCount: () => void;
}

export type Store = StoreState & StoreActions;

export const useStore = create<Store>((set) => ({
  particleState: [],
  controlParams: {
    particleCount: 3000,
    noiseStrength: 0.2,
    particleLife: 3,
    trailFrameCount: 30,
  },
  gestureForce: {
    x: 0,
    y: 0,
    z: 0,
    strength: 0,
  },
  isPaused: false,
  particlesEmittedThisSecond: 0,
  fps: 60,

  updateParticles: (states) => set({ particleState: states }),

  setControlParam: (key, value) =>
    set((state) => ({
      controlParams: {
        ...state.controlParams,
        [key]: value,
      },
    })),

  setGestureForce: (force) =>
    set((state) => ({
      gestureForce: {
        ...state.gestureForce,
        ...force,
      },
    })),

  reset: () => set({ particleState: [] }),

  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),

  emitParticles: () => set({}),

  setFps: (fps) => set({ fps }),

  incrementEmittedCount: (count) =>
    set((state) => ({
      particlesEmittedThisSecond: state.particlesEmittedThisSecond + count,
    })),

  resetEmittedCount: () => set({ particlesEmittedThisSecond: 0 }),
}));
