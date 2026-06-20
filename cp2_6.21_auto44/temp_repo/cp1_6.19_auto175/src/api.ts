
import type { Particle, CurrentParams, Vector3, HeatmapGrid } from './types';

export interface ICurrentField {
  getVelocity(x: number, y: number, z: number, t: number, params: CurrentParams): Vector3;
}

export interface IParticleSimulator {
  particles: Particle[];
  reset(params: CurrentParams): void;
  update(dt: number, t: number, params: CurrentParams): Particle[];
  getParticles(): Particle[];
}

export interface IHeatmapRenderer {
  computeHeatmap(particles: Particle[]): HeatmapGrid[];
}

export const BOUNDARY_SIZE = 50;
export const GRID_SIZE_X = 20;
export const GRID_SIZE_Y = 20;
export const GRID_SIZE_Z = 10;
export const CELL_SIZE = 2.5;
export const MAX_PARTICLES = 1000;
export const INITIAL_PARTICLES = 200;
export const HOTSPOT_THRESHOLD = 20;
