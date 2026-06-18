export type StyleType = 'neon' | 'ink' | 'pixel';

export interface GestureState {
  leftHand: boolean;
  rightHand: boolean;
  bothHands: boolean;
}

export interface StyleConfig {
  bloom: boolean;
  bloomIntensity: number;
  saturation: number;
  opacity: number;
  jitter: number;
  fixedSize: number | null;
  pixelated: boolean;
}

export interface ParticleBehavior {
  spreadRadius: number;
  rotationSpeed: number;
  transitionProgress: number;
}

export interface ParticleData {
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  count: number;
}

export const STYLE_CONFIGS: Record<StyleType, StyleConfig> = {
  neon: {
    bloom: true,
    bloomIntensity: 0.8,
    saturation: 1.5,
    opacity: 1.0,
    jitter: 0,
    fixedSize: null,
    pixelated: false
  },
  ink: {
    bloom: false,
    bloomIntensity: 0,
    saturation: 0.3,
    opacity: 0.6,
    jitter: 0.1,
    fixedSize: null,
    pixelated: false
  },
  pixel: {
    bloom: false,
    bloomIntensity: 0,
    saturation: 1.0,
    opacity: 1.0,
    jitter: 0,
    fixedSize: 0.8,
    pixelated: true
  }
};

export const DEFAULT_BEHAVIOR: ParticleBehavior = {
  spreadRadius: 2,
  rotationSpeed: 0,
  transitionProgress: 1
};
