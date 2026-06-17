export type PoleType = 'N' | 'S';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface MagneticPole {
  id: string;
  type: PoleType;
  position: Vec3;
  strength: number;
  radius: number;
}

export interface FieldLineParams {
  totalLines: number;
  verticesPerLine: number;
  lineWidth: number;
  flowSpeed: number;
  colorN: string;
  colorS: string;
  glowIntensity: number;
}

export interface BarMagnetConfig {
  length: number;
  width: number;
  height: number;
  colorN: string;
  colorS: string;
  emissionIntensity: number;
}

export interface SceneConfig {
  backgroundColor: [string, string];
  starCount: number;
  minDistance: number;
  maxDistance: number;
  dampingFactor: number;
  targetFPS: number;
  maxVertices: number;
  poleThreshold: number;
}

export interface FieldLineData {
  points: Vec3[];
  startPoleId: string;
  endPoleId: string | null;
  speedFactors: number[];
  colors: string[];
  baseSpeedRandom: number;
}
