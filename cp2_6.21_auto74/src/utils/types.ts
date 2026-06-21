export interface IStellarBody {
  id: string;
  name: string;
  mass: number;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  color: string;
  radius: number;
  trajectory: { x: number; y: number; z: number }[];
}

export interface SimulationParams {
  G: number;
  speed: number;
  dt: number;
  paused: boolean;
}

export interface ISnapshot {
  timestamp: number;
  bodies: IStellarBody[];
  params: SimulationParams;
}

export type PresetType = 'binary' | 'three-body' | 'solar-system' | 'random-cluster';

export interface Particle {
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  life: number;
  maxLife: number;
}
