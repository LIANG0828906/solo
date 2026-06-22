export interface Particle {
  id: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  r: number;
  g: number;
  b: number;
  size: number;
  trail: TrailPoint[];
}

export interface TrailPoint {
  x: number;
  y: number;
  z: number;
}

export interface CollisionEvent {
  timestamp: number;
  idA: number;
  idB: number;
  colorA: { r: number; g: number; b: number };
  colorB: { r: number; g: number; b: number };
}

export interface SimParams {
  gravity: number;
  speedMultiplier: number;
  elasticity: number;
}

export type ParamChangeCallback = (params: SimParams) => void;
export type CollisionLogCallback = (events: CollisionEvent[]) => void;
