export type TerrainType = 'ground' | 'slope' | 'step' | 'moving' | 'oneway';

export interface Vec2 {
  x: number;
  y: number;
}

export interface AABB {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TerrainBlock {
  id: string;
  type: TerrainType;
  x: number;
  y: number;
  width: number;
  height: number;
  friction: number;
  selected?: boolean;
  slopeDirection?: 'left' | 'right';
  stepHeight?: number;
  movingConfig?: MovingPlatformConfig;
}

export interface MovingPlatformConfig {
  axis: 'horizontal' | 'vertical';
  originX: number;
  originY: number;
  distance: number;
  speed: number;
  direction: number;
}

export interface CharacterState {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  onGround: boolean;
  onWall: 'left' | 'right' | null;
  climbing: boolean;
  facing: 'left' | 'right';
  runPhase: number;
  wasOnGround: boolean;
  oneWayPassThrough: boolean;
}

export interface CollisionInfo {
  hit: boolean;
  normal: Vec2;
  penetration: number;
  terrain: TerrainBlock | null;
  side: 'top' | 'bottom' | 'left' | 'right' | 'slope' | null;
}

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  jumpPressed: boolean;
}

export const TILE_SIZE = 32;
export const GRAVITY = 980;
export const JUMP_VELOCITY = 400;
export const MOVE_SPEED = 300;
export const SLOPE_SPEED_FACTOR = 0.5;
export const CLIMB_SPEED = 150;
