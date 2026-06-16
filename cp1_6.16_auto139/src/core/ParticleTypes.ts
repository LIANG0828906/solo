export enum ParticleType {
  A = 'A',
  B = 'B',
  C = 'C'
}

export const PARTICLE_COLORS: Record<ParticleType, string> = {
  [ParticleType.A]: '#00FFFF',
  [ParticleType.B]: '#FF00FF',
  [ParticleType.C]: '#FFBF00'
};

export const PARTICLE_NAMES: Record<ParticleType, string> = {
  [ParticleType.A]: '吸引型',
  [ParticleType.B]: '排斥型',
  [ParticleType.C]: '结合型'
};

export const SIMULATION_CONFIG = {
  INITIAL_PARTICLE_COUNT: 500,
  SPAWN_COUNT_PER_CLICK: 10,
  MAX_PARTICLE_LIFE: 100,
  NEIGHBOR_DISTANCE: 80,
  MAX_ACCELERATION: 0.5,
  MIN_PARTICLE_SIZE: 3,
  MAX_PARTICLE_SIZE: 6,
  INITIAL_VELOCITY_RANGE: 2,
  FRICTION: 0.99,
  SPATIAL_HASH_THRESHOLD: 2000,
  GRID_CELL_SIZE: 40,
  MAX_BIND_COUNT: 3,
  BIND_LIFE_THRESHOLD: 50,
  GRAVITY_STRENGTH_DEFAULT: 1.0,
  REPULSION_STRENGTH_DEFAULT: 1.0,
  LIFE_DECAY_DEFAULT: 0.1
};

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: ParticleType;
  life: number;
  size: number;
  bindCount: number;
}

export interface SimulationConfig {
  gravityStrength: number;
  repulsionStrength: number;
  lifeDecayRate: number;
}

export interface SimulationStats {
  particleCount: number;
  fps: number;
  totalBindings: number;
}
