export interface ParticleConfig {
  emissionRate: number;
  speed: number;
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
  startColor: { r: number; g: number; b: number };
  endColor: { r: number; g: number; b: number };
  alpha: number;
  active: boolean;
}

export interface Preset {
  name: string;
  config: ParticleConfig;
}

export type AppMode = 'edit' | 'play';
