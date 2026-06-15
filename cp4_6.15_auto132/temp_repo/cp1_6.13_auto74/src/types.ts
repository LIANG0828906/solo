export enum AppState {
  IDLE = 'idle',
  FLYING_IN = 'flying_in',
  STABLE = 'stable',
  DISPERSING = 'dispersing'
}

export interface HSLA {
  h: number;
  s: number;
  l: number;
  a: number;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface BezierControlPoints {
  cp1x: number;
  cp1y: number;
  cp2x: number;
  cp2y: number;
}

export interface SpiralParams {
  startAngle: number;
  initialRadius: number;
  growthRate: number;
  rotations: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  startX: number;
  startY: number;
  cp1x: number;
  cp1y: number;
  cp2x: number;
  cp2y: number;
  currentColor: HSLA;
  startColor: HSLA;
  targetColor: HSLA;
  opacity: number;
  delay: number;
  startTime: number;
  duration: number;
  spiralStartAngle: number;
  initialDistance: number;
  size: number;
  tremorPhase: number;
}

export interface Word {
  char: string;
  particles: Particle[];
  centerX: number;
  centerY: number;
  strokeComplexity: number;
}

export interface CanvasDimensions {
  width: number;
  height: number;
  dpr: number;
}

export interface ParticleFrameState {
  readonly x: number;
  readonly y: number;
  readonly color: HSLA;
  readonly size: number;
  readonly opacity: number;
}

export interface EngineFrameOutput {
  readonly particles: ParticleFrameState[];
  readonly state: AppState;
  readonly particleCount: number;
}
