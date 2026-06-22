export type ParticleType = 'producer' | 'consumer' | 'hunter';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: ParticleType;
  size: number;
  health: number;
  radius: number;
  trail: { x: number; y: number }[];
}

export interface ForceParams {
  gravityStrength: number;
  repulsionRadius: number;
  turbulenceAmplitude: number;
}

export interface SimulationStats {
  splitsThisSecond: number;
  eatsThisSecond: number;
}
