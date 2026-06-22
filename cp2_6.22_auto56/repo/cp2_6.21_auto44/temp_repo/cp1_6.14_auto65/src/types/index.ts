export type BodyType = 'box' | 'sphere' | 'cylinder';

export interface HSLColor {
  h: number;
  s: number;
  l: number;
}

export interface PhysicsBodyConfig {
  id: string;
  type: BodyType;
  position: [number, number, number];
  initialPosition: [number, number, number];
  mass: number;
  restitution: number;
  color: HSLColor;
}

export interface BodyPhysicsData {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  momentum: number;
  speed: number;
}

export interface EffectState {
  collision: boolean;
  explosion: boolean;
  fluid: boolean;
  explosionCenter?: [number, number, number];
  explosionForce?: number;
}

export interface RecordingFrame {
  timestamp: number;
  bodies: {
    id: string;
    position: [number, number, number];
  }[];
}

export interface ParticleData {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

export type HSLToString = (hsl: HSLColor) => string;
