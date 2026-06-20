export interface ColorStop {
  readonly id: string;
  readonly color: string;
  readonly position: number;
}

export interface CurvePoint {
  readonly id: string;
  readonly x: number;
  readonly y: number;
}

export type ScaleCurvePreset = 'linear' | 'easeOut' | 'sine' | 'custom';

export interface EffectParams {
  readonly particleCount: number;
  readonly lifetimeMin: number;
  readonly lifetimeMax: number;
  readonly velocityXMin: number;
  readonly velocityXMax: number;
  readonly velocityYMin: number;
  readonly velocityYMax: number;
  readonly emissionAngleStart: number;
  readonly emissionAngleEnd: number;
  readonly colorGradient: readonly ColorStop[];
  readonly scaleCurve: readonly CurvePoint[];
  readonly scaleCurvePreset: ScaleCurvePreset;
  readonly rotationSpeed: number;
  readonly randomOffset: number;
  readonly originOffsetX: number;
  readonly originOffsetY: number;
}

export interface ParticleHistoryPoint {
  readonly x: number;
  readonly y: number;
  readonly age: number;
}

export interface Particle {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly lifetime: number;
  readonly currentAge: number;
  readonly rotation: number;
  readonly rotationSpeed: number;
  readonly size: number;
  readonly colorStops: readonly ColorStop[];
  readonly history: readonly ParticleHistoryPoint[];
}
