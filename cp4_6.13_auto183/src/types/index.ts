export type GestureType = 'open_palm' | 'fist' | 'pointing' | 'ok' | 'none';
export type SculptureMode = 'deform' | 'rotate' | 'color';
export type ColorTheme = 'aurora' | 'lava' | 'neon';

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface GestureData {
  landmarks: Landmark[];
  gesture: GestureType;
  palmDistance: number;
  handVelocity: { x: number; y: number };
  indexDirection: { x: number; y: number };
  detected: boolean;
}

export interface ParticleData {
  basePosition: Float32Array;
  currentPosition: Float32Array;
  baseColor: Float32Array;
  currentColor: Float32Array;
  size: Float32Array;
  trailHistory: Float32Array[][];
  flickerState: boolean[];
  flickerTween: any[];
}
