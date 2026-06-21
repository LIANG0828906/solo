export interface ParticleConfig {
  emissionRate: number;
  initialSpeed: number;
  lifetime: number;
  size: number;
  spreadAngle: number;
  startColor: string;
  endColor: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  alpha: number;
  startColor: { r: number; g: number; b: number };
  endColor: { r: number; g: number; b: number };
  active: boolean;
}

export interface PresetData {
  name: string;
  config: ParticleConfig;
}
