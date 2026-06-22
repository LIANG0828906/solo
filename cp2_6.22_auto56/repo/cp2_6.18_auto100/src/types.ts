export interface Vec2 {
  x: number;
  y: number;
}

export interface CarState {
  position: Vec2;
  velocity: Vec2;
  angle: number;
  angularVelocity: number;
  speed: number;
  isDrifting: boolean;
  boostTime: number;
  boostTimer: number;
  lossOfControl: number;
  lapCount: number;
  score: number;
}

export interface SkidMark {
  x: number;
  y: number;
  angle: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface ArenaState {
  center: Vec2;
  currentRadius: number;
  initialRadius: number;
  minRadius: number;
  edgeFlashTimer: number;
  shrinkInterval: number;
  nextShrinkTime: number;
  nextObstacleTime: number;
}

export interface Obstacle {
  id: number;
  x: number;
  y: number;
  radius: number;
}

export interface GameState {
  running: boolean;
  gameOver: boolean;
  survivalTime: number;
  currentFps: number;
  lowFpsMode: boolean;
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  drift: boolean;
}
