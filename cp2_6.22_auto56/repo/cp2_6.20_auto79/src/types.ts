export type BrushType = 'raise' | 'lower' | 'smooth';

export type BrushShape = 'circle' | 'square';

export type PresetType = 'plain' | 'mountain' | 'basin';

export interface TileHeightMap {
  size: number;
  heights: number[][];
}

export interface FlowParticle {
  id: number;
  position: { x: number; y: number; z: number };
  pathProgress: number;
  speed: number;
}

export interface BrushState {
  type: BrushType;
  shape: BrushShape;
  strength: number;
  intensity: number;
  radius: number;
}

export interface WaterState {
  startPoint: { x: number; z: number } | null;
  path: { x: number; z: number }[];
  particles: FlowParticle[];
  isRunning: boolean;
}

export interface HeightAnimation {
  targetHeights: number[][];
  startHeights: number[][];
  startTime: number;
  duration: number;
}

export interface MouseGridInfo {
  gridX: number;
  gridZ: number;
  height: number;
  slope: number;
}
