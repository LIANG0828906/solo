export const OceanConfig = {
  GRID_SIZE: 200,
  SEGMENTS: 128,
  NOISE_SEED: 42,
  PARTICLE_COUNT: 5000,
  PARTICLE_SIZE: 3,
  TIME_SCALE_MIN: 0.1,
  TIME_SCALE_MAX: 10,
  TIME_SCALE_DEFAULT: 1.0,
  CAMERA_ANIM_DURATION: 1.0,
} as const;

export type ViewMode = 'top' | 'side' | 'free';

export const COLORS = {
  DEEP_OCEAN: { r: 0.043, g: 0.239, b: 0.420 },
  SHALLOW_OCEAN: { r: 0.118, g: 0.565, b: 1.000 },
  CONTINENTAL_SLOPE: { r: 0.235, g: 0.702, b: 0.443 },
  SEAMOUNT_TOP: { r: 0.961, g: 0.871, b: 0.702 },
  PARTICLE_SLOW: { r: 0.118, g: 0.565, b: 1.000 },
  PARTICLE_MEDIUM: { r: 0.000, g: 0.749, b: 1.000 },
  PARTICLE_FAST: { r: 0.000, g: 1.000, b: 1.000 },
} as const;
