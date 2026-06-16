export enum ElementType {
  BRICK = 'brick',
  SPIKE = 'spike',
  PLATFORM = 'platform',
  GOAL = 'goal',
}

export interface GridElement {
  type: ElementType;
  x: number;
  y: number;
  platformStartX?: number;
  platformEndX?: number;
  platformSpeed?: number;
  platformDirection?: number;
}

export interface LevelData {
  id: string;
  name: string;
  width: number;
  height: number;
  elements: GridElement[];
  spawnX: number;
  spawnY: number;
  createdAt: number;
  updatedAt: number;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  isGrounded: boolean;
  isAlive: boolean;
  isFlashing: boolean;
  flashTimer: number;
}

export interface LevelStats {
  width: number;
  height: number;
  brickCount: number;
  spikeCount: number;
  platformCount: number;
  goalCount: number;
  estimatedTime: number;
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

export interface EditorState {
  zoom: number;
  offsetX: number;
  offsetY: number;
  selectedElement: ElementType;
  isPlaying: boolean;
  hoverGridX: number;
  hoverGridY: number;
  isFading: boolean;
}

export const GRID_SIZE = 32;
export const PLAYER_WIDTH = 16;
export const PLAYER_HEIGHT = 16;
export const GRAVITY = 400;
export const MOVE_SPEED = 200;
export const JUMP_VELOCITY = 300;
export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 2;
export const FLASH_DURATION = 0.3;
export const MAX_DRAFTS = 5;

export const COLORS = {
  brick: '#7CB342',
  spike: '#E53935',
  platform: '#FB8C00',
  goal: '#FFD700',
  player: '#2196F3',
  bgTop: '#87CEEB',
  bgBottom: '#B0E0E6',
  gridLine: 'rgba(255, 255, 255, 0.08)',
};
