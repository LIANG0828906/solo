export interface CarState {
  x: number;
  y: number;
  angle: number;
  speed: number;
  maxSpeed: number;
  acceleration: number;
  deceleration: number;
  turnSpeed: number;
  isDrifting: boolean;
  driftAngle: number;
  boostTimer: number;
  boostMultiplier: number;
  controlLockTimer: number;
  carWidth: number;
  carHeight: number;
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  space: boolean;
}

export interface ArenaState {
  centerX: number;
  centerY: number;
  diameter: number;
  initialDiameter: number;
  minDiameter: number;
  shrinkInterval: number;
  shrinkRate: number;
  shrinkTimer: number;
  edgeFlashTimer: number;
  edgeFlashInterval: number;
  edgeFlashOn: boolean;
}

export interface Obstacle {
  id: number;
  x: number;
  y: number;
  radius: number;
  spawnTime: number;
  spawnDuration: number;
}

export interface TireMark {
  x: number;
  y: number;
  angle: number;
  alpha: number;
  createdAt: number;
  lifetime: number;
}

export type GameStatus = 'playing' | 'gameover';

export interface HudData {
  score: number;
  survivalTime: number;
  diameterPercent: number;
  fps: number;
  gameStatus: GameStatus;
}
