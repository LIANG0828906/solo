export enum ViewMode {
  OVERVIEW = 'overview',
  FREE_ROAM = 'free_roam'
}

export interface TerrainParams {
  heightAmplitude: number;
  smoothness: number;
  textureTone: number;
  seed: number;
}

export interface TerrainStats {
  maxHeight: number;
  minHeight: number;
  avgHeight: number;
  vertexCount: number;
}

export interface ColorGradient {
  lowColor: [number, number, number];
  highColor: [number, number, number];
}

export const TERRAIN_SIZE = 60;
export const GRID_RESOLUTION = 128;
export const MAX_GRID_RESOLUTION = 256;

export const DEFAULT_PARAMS: TerrainParams = {
  heightAmplitude: 0.5,
  smoothness: 0.5,
  textureTone: 0,
  seed: Math.random() * 1000
};
