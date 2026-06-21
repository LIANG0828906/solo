export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface ParticleParams {
  count: number;
  velocity: Vec3;
  emissionAngle: number;
  lifetime: number;
  size: number;
}

export interface GravityField {
  axis: 'x' | 'y' | 'z';
  strength: number;
}

export interface VortexField {
  strength: number;
  radius: number;
  position: Vec3;
}

export interface WindField {
  angle: number;
  strength: number;
}

export interface ForceFieldParams {
  gravity: GravityField;
  vortex: VortexField;
  wind: WindField;
}

export interface RenderParams {
  colors: string[];
  trailLength: number;
}

export interface ParticleData {
  positions: Float32Array;
  colors: Float32Array;
  trailPositions: Float32Array;
  trailColors: Float32Array;
}

export const DEFAULT_PARTICLE_PARAMS: ParticleParams = {
  count: 200,
  velocity: { x: 0, y: 2, z: 0 },
  emissionAngle: 45,
  lifetime: 4,
  size: 3,
};

export const DEFAULT_FORCE_FIELD_PARAMS: ForceFieldParams = {
  gravity: { axis: 'y', strength: -2 },
  vortex: { strength: 10, radius: 100, position: { x: 0, y: 3, z: 0 } },
  wind: { angle: 0, strength: 0 },
};

export const DEFAULT_RENDER_PARAMS: RenderParams = {
  colors: ['#FF6B35', '#F7931E', '#FFD700', '#FF4500'],
  trailLength: 10,
};
