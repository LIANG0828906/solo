import type * as THREE from 'three';

export type ColorPalette = 'rainbow' | 'aurora' | 'lava';

export interface NebulaParams {
  density: number;
  colorPalette: ColorPalette;
  turbulence: number;
  particleCount: number;
}

export interface ParticleState {
  position: [number, number, number];
  initialPosition: [number, number, number];
  targetPosition: [number, number, number];
  color: [number, number, number];
  initialColor: [number, number, number];
  targetColor: [number, number, number];
  size: number;
  driftOffset: [number, number, number];
  driftFrequency: [number, number, number];
  baseOpacity: number;
  breathPhase: number;
  breathSpeed: number;
}

export interface NebulaAPI {
  points: THREE.Points;
  updateParams: (params: Partial<NebulaParams>) => void;
  animate: (delta: number, elapsed: number) => void;
  getCurrentParticleCount: () => number;
  reduceParticles: (factor: number) => void;
}
