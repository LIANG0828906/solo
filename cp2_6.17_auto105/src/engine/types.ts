export interface Particle {
  id: string;
  position: Float32Array;
  velocity: Float32Array;
  age: number;
  life: number;
  active: boolean;
}

export interface ControlParams {
  particleCount: number;
  noiseStrength: number;
  particleLife: number;
}

export interface GestureForce {
  x: number;
  y: number;
  z: number;
  strength: number;
}

export interface ParticleState {
  id: string;
  x: number;
  y: number;
  z: number;
  age: number;
  life: number;
}
