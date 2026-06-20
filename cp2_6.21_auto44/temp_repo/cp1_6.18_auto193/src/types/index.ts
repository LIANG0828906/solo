export interface Vector2D {
  x: number;
  y: number;
}

export interface Spaceship {
  position: Vector2D;
  velocity: Vector2D;
  angle: number;
  thrust: number;
  isInGravityWell: boolean;
  trail: Vector2D[];
}

export interface Planet {
  id: number;
  position: Vector2D;
  radius: number;
  color: string;
  orbit: {
    centerX: number;
    centerY: number;
    semiMajor: number;
    semiMinor: number;
    angle: number;
    speed: number;
  };
  gravityWell: {
    radius: number;
    strength: number;
  };
  rotation: number;
}

export interface Asteroid {
  id: number;
  position: Vector2D;
  velocity: Vector2D;
  radius: number;
  vertices: Vector2D[];
  color: string;
}

export interface Particle {
  id: number;
  position: Vector2D;
  velocity: Vector2D;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  type: 'thruster' | 'explosion' | 'victory';
}

export interface SlingshotEvent {
  planetId: number;
  enterTime: number;
  enterVelocity: Vector2D;
  exitTime?: number;
  velocityBoost: Vector2D;
}

export type GameStatus = 'playing' | 'failed' | 'victory';

export interface GameState {
  status: GameStatus;
  score: number;
  spaceship: Spaceship;
  planets: Planet[];
  asteroids: Asteroid[];
  particles: Particle[];
  finishLineX: number;
  slingshotEvents: SlingshotEvent[];
}

export interface ControlState {
  accelerate: boolean;
  decelerate: boolean;
  turnLeft: boolean;
  turnRight: boolean;
  activateGravityWell: boolean;
}

export interface RenderData {
  gameState: GameState;
  time: number;
  fps: number;
}
