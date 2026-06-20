import { create } from 'zustand';
import type { SimulationParams, RenderState } from '../types';

interface SimulationStore extends SimulationParams, RenderState {
  fps: number;
  setParticleCount: (count: number) => void;
  setTemperature: (temp: number) => void;
  setGravityCoeff: (coeff: number) => void;
  setRepulsionCoeff: (coeff: number) => void;
  toggleRunning: () => void;
  setRunning: (running: boolean) => void;
  setFps: (fps: number) => void;
  setRenderMode: (mode: 'sphere' | 'points') => void;
  setShowBonds: (show: boolean) => void;
  setShowTrails: (show: boolean) => void;
  reset: () => void;
}

const defaultParams: SimulationParams = {
  particleCount: 100,
  temperature: 1.0,
  gravityCoeff: 1.0,
  repulsionCoeff: 1.0,
  isRunning: true
};

const defaultRenderState: RenderState = {
  mode: 'sphere',
  showBonds: true,
  showTrails: true
};

export const useSimulationStore = create<SimulationStore>((set) => ({
  ...defaultParams,
  ...defaultRenderState,
  fps: 60,
  
  setParticleCount: (count) => set({ particleCount: count }),
  setTemperature: (temp) => set({ temperature: temp }),
  setGravityCoeff: (coeff) => set({ gravityCoeff: coeff }),
  setRepulsionCoeff: (coeff) => set({ repulsionCoeff: coeff }),
  toggleRunning: () => set((state) => ({ isRunning: !state.isRunning })),
  setRunning: (running) => set({ isRunning: running }),
  setFps: (fps) => set({ fps }),
  setRenderMode: (mode) => set({ mode }),
  setShowBonds: (show) => set({ showBonds: show }),
  setShowTrails: (show) => set({ showTrails: show }),
  
  reset: () => set({
    ...defaultParams,
    mode: 'sphere',
    showBonds: true,
    showTrails: true
  })
}));
