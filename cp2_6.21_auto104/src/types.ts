export type LandformType = 'mountain' | 'basin' | 'plain' | 'volcano';

export interface ErosionParams {
  windStrength: number;
  waterStrength: number;
  glacierStrength: number;
}

export interface TerrainState {
  heightMap: number[][];
  landform: LandformType;
  iteration: number;
  initialTotalHeight: number;
  currentTotalHeight: number;
}

export interface TerrainContextType {
  terrainState: TerrainState;
  erosionParams: ErosionParams;
  isPlaying: boolean;
  setErosionParams: (params: ErosionParams) => void;
  setLandform: (landform: LandformType) => void;
  togglePlay: () => void;
  resetTerrain: () => void;
}

export const GRID_SIZE = 200;
export const TERRAIN_SIZE = 20;
export const COLOR_MAPS: Record<LandformType, { low: string; mid: string; high: string; peak?: string }> = {
  mountain: { low: '#4a6741', mid: '#8b9a6b', high: '#d2b48c' },
  basin: { low: '#2c5f4f', mid: '#5a8a7a', high: '#a8c4b8' },
  plain: { low: '#5d6b3a', mid: '#8fa055', high: '#c9d896' },
  volcano: { low: '#3d3d3d', mid: '#5a4a4a', high: '#a0522d', peak: '#8b0000' },
};
