export interface CellCoord {
  x: number;
  z: number;
}

export interface WallState {
  coord: CellCoord;
  active: boolean;
  transition: 'idle' | 'appearing' | 'disappearing';
  transitionProgress: number;
}

export interface BallPosition {
  x: number;
  y: number;
  z: number;
}

export interface FragmentData {
  id: number;
  coord: CellCoord;
  collected: boolean;
}

export interface ParticleData {
  id: number;
  position: [number, number, number];
  velocity: [number, number, number];
  life: number;
  maxLife: number;
}

export type GameState = 'playing' | 'won';
