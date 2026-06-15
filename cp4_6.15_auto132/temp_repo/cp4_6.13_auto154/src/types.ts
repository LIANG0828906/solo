export type GemType = 'fire' | 'ice' | 'lightning' | null;

export interface Position {
  row: number;
  col: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface FallingGem {
  row: number;
  col: number;
  type: GemType;
  targetRow: number;
  startY: number;
  targetY: number;
  progress: number;
}

export interface SwapAnimation {
  pos1: Position;
  pos2: Position;
  progress: number;
  isReverting: boolean;
}
