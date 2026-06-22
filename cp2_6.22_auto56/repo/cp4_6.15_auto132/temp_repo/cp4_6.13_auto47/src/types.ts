export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Particle {
  id: number;
  position: Vector3;
  velocity: Vector3;
  color: { h: number; s: number; l: number };
  initialDist: number;
}

export interface Attractor {
  id: number;
  position: Vector3;
  strength: number;
}

export interface Repulsor {
  id: number;
  position: Vector3;
  radius: number;
}

export interface FieldConfig {
  vortexStrength: number;
  attractors: Attractor[];
  repulsors: Repulsor[];
}

export interface TrailData {
  particleId: number;
  positions: Vector3[];
  color: { h: number; s: number; l: number };
}

export interface SimulationState {
  isRunning: boolean;
  particleCount: number;
  fieldConfig: FieldConfig;
}
