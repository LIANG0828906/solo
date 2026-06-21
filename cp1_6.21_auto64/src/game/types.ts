export interface Coordinate {
  x: number;
  y: number;
}

export interface Mineral {
  id: string;
  gridX: number;
  gridY: number;
  x: number;
  y: number;
  size: number;
  type: 'iron' | 'crystal' | 'gold';
  opacity: number;
  scale: number;
  collecting: boolean;
  collectProgress: number;
}

export const COLLECT_DURATION = 0.3;

export type MineralType = 'gold' | 'iron' | 'crystal';

export interface StarFieldConfig {
  width: number;
  height: number;
  gridSize: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}
