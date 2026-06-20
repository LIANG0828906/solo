export type ColorMode = 'hueGroup' | 'brightnessMix';

export interface ParticleData {
  x: number;
  y: number;
  z: number;
  r: number;
  g: number;
  b: number;
  h: number;
  s: number;
  v: number;
  size: number;
  phase: number;
  period: number;
}

export interface SharedConfig {
  maxParticles: number;
  spreadRadius: number;
  pulseSpeed: number;
  particleSize: number;
  colorMode: ColorMode;
  transitionDuration: number;
  screenshotRequested: boolean;
  isScreenshotting: boolean;
}

export const createDefaultConfig = (): SharedConfig => ({
  maxParticles: 5000,
  spreadRadius: 1.5,
  pulseSpeed: 1.0,
  particleSize: 4.0,
  colorMode: 'brightnessMix',
  transitionDuration: 0.5,
  screenshotRequested: false,
  isScreenshotting: false
});

export const isValidColorMode = (mode: string): mode is ColorMode => {
  return mode === 'hueGroup' || mode === 'brightnessMix';
};
