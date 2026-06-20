export enum GalaxyType {
  SPIRAL = 'spiral',
  BARRED = 'barred',
  ELLIPTICAL = 'elliptical'
}

export interface ParticlePosition {
  x: number;
  y: number;
  z: number;
  originalX: number;
  originalY: number;
  originalZ: number;
  angle: number;
  radius: number;
  color: [number, number, number];
  size: number;
}

export interface GalaxyParams {
  type: GalaxyType;
  rotationSpeed: number;
  gravityStrength: number;
  dispersionRange: number;
  particleCount: number;
}

export interface PresetTheme {
  id: string;
  name: string;
  params: GalaxyParams;
}

export const GALAXY_TYPE_NAMES: Record<GalaxyType, string> = {
  [GalaxyType.SPIRAL]: '螺旋星系',
  [GalaxyType.BARRED]: '棒旋星系',
  [GalaxyType.ELLIPTICAL]: '椭圆星系'
};

export const DEFAULT_PARAMS: GalaxyParams = {
  type: GalaxyType.SPIRAL,
  rotationSpeed: 45,
  gravityStrength: 60,
  dispersionRange: 25,
  particleCount: 3000
};
