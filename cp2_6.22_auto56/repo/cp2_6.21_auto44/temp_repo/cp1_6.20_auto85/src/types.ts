export type Morphology = 'spiral' | 'elliptical' | 'irregular';

export interface NebulaParams {
  particleCount: number;
  gravity: number;
  turbulence: number;
  dissipation: number;
  colorShift: number;
  morphology: Morphology;
}

export interface NebulaPreset {
  id: string;
  name: string;
  isBuiltIn: boolean;
  params: NebulaParams;
  createdAt?: number;
}

export const DEFAULT_PARAMS: NebulaParams = {
  particleCount: 8000,
  gravity: 1.5,
  turbulence: 0.8,
  dissipation: 0.01,
  colorShift: 0.3,
  morphology: 'spiral',
};
