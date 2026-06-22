export interface Vector2 {
  x: number;
  y: number;
}

export interface AABB {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type PlatformType = 'static' | 'moving-horizontal' | 'moving-vertical' | 'fragile';
export type PlatformMaterial = 'rock' | 'wood' | 'ice';
export type GameScene = 'menu' | 'playing' | 'victory';

export interface PlatformConfig {
  type: PlatformType;
  material: PlatformMaterial;
  x: number;
  y: number;
  width: number;
  height: number;
  moveRange?: number;
  moveSpeed?: number;
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

export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
}

export interface TouchButton {
  x: number;
  y: number;
  radius: number;
  active: boolean;
  label: string;
}

export interface Camera {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
}

export interface UIButton {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  hovered: boolean;
  onClick: () => void;
}
