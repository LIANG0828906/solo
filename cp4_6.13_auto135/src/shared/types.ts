export type BombType = 'basic' | 'delayed' | 'directed';

export interface Position {
  x: number;
  y: number;
}

export interface Obstacle {
  id: string;
  position: Position;
  width: number;
  height: number;
  destructible: boolean;
}

export interface Bomb {
  id: string;
  type: BombType;
  position: Position;
  direction?: number;
  timestamp: number;
  ownerId: string;
}

export interface Shockwave {
  position: Position;
  maxRadius: number;
  currentRadius: number;
  startTime: number;
  duration: number;
  bombType: BombType;
}

export interface Debris {
  id: string;
  position: Position;
  velocity: Position;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}
