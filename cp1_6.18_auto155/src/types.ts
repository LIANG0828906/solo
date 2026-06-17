export interface Vector2 {
  x: number;
  y: number;
}

export interface Boomerang {
  position: Vector2;
  velocity: Vector2;
  startPosition: Vector2;
  isFlying: boolean;
  isReturning: boolean;
  angle: number;
  trail: Vector2[];
  scale: number;
  scaleDirection: number;
}

export interface Star {
  x: number;
  y: number;
  radius: number;
  collected: boolean;
  pulsePhase: number;
}

export interface Meteor {
  x: number;
  y: number;
  radius: number;
  vertices: Vector2[];
  rotation: number;
  rotationSpeed: number;
}

export interface BackgroundStar {
  x: number;
  y: number;
  radius: number;
  color: string;
  twinklePhase: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface CatchRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  life: number;
}

export interface GameState {
  score: number;
  level: number;
  combo: number;
  maxCombo: number;
  comboBonusActive: boolean;
  comboBonusTimer: number;
  throwCount: number;
  maxThrows: number;
  throwRecoveryTimer: number;
  trackSpeed: number;
  trackOffset: number;
  trackCurvature: number;
  curvaturePhase: number;
  screenShake: number;
  screenShakeDuration: number;
  gameOver: boolean;
  gameTime: number;
}

export interface AimState {
  isAiming: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}
