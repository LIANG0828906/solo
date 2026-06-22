export interface ParticleConfig {
  emissionRate: number;
  initialSpeed: number;
  lifespan: number;
  particleSize: number;
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
  startColor: number;
  endColor: number;
  alpha: number;
  active: boolean;
}

export interface Preset {
  name: string;
  config: ParticleConfig;
}

export type Mode = 'edit' | 'play';

export interface ColorRGB {
  r: number;
  g: number;
  b: number;
}
