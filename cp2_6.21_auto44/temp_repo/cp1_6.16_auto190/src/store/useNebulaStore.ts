import { create } from 'zustand';

export type NebulaShape = 'sphere' | 'spiral';

export interface NebulaParams {
  particleCount: number;
  particleSize: number;
  shape: NebulaShape;
  rotationSpeed: number;
  turbulence: number;
  hue: number;
  autoRotate: boolean;
  autoRotateSpeed: number;
}

export interface ParticleData {
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
}

export interface NebulaState {
  params: NebulaParams;
  particleData: ParticleData | null;
  setParam: <K extends keyof NebulaParams>(key: K, value: NebulaParams[K]) => void;
  setParams: (params: Partial<NebulaParams>) => void;
  setParticleData: (data: ParticleData) => void;
  resetParams: () => void;
}

export const defaultParams: NebulaParams = {
  particleCount: 10000,
  particleSize: 0.3,
  shape: 'sphere',
  rotationSpeed: 0.3,
  turbulence: 0.15,
  hue: 0,
  autoRotate: true,
  autoRotateSpeed: 0.3
};

const createEmptyParticleData = (count: number): ParticleData => ({
  positions: new Float32Array(count * 3),
  colors: new Float32Array(count * 3),
  sizes: new Float32Array(count)
});

export const useNebulaStore = create<NebulaState>((set) => ({
  params: { ...defaultParams },
  particleData: null,

  setParam: (key, value) =>
    set((state) => ({
      params: { ...state.params, [key]: value }
    })),

  setParams: (newParams) =>
    set((state) => ({
      params: { ...state.params, ...newParams }
    })),

  setParticleData: (data) =>
    set(() => ({
      particleData: data
    })),

  resetParams: () =>
    set((state) => ({
      params: { ...defaultParams },
      particleData: createEmptyParticleData(defaultParams.particleCount)
    }))
}));
