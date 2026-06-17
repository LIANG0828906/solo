export interface Vector2D {
  x: number;
  y: number;
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  shadowColor: string;
}

export type BaffleOrientation = 'horizontal' | 'vertical';

export interface Baffle {
  id: string;
  x: number;
  y: number;
  length: number;
  width: number;
  orientation: BaffleOrientation;
  color: string;
  isWall?: boolean;
}

export interface Hole {
  x: number;
  y: number;
  radius: number;
}

export interface Level {
  id: string;
  name: string;
  ballStart: Vector2D;
  hole: Hole;
  walls: Baffle[];
  baffles: Baffle[];
  bestTime?: number;
  bestBounces?: number;
}

export interface GameState {
  isPlaying: boolean;
  isPaused: boolean;
  isComplete: boolean;
  isEditMode: boolean;
  elapsedTime: number;
  bounceCount: number;
  currentLevelIndex: number;
}

export interface TrailPoint {
  x: number;
  y: number;
  alpha: number;
}

export interface EditorState {
  selectedBaffleId: string | null;
  isDragging: boolean;
  dragOffset: Vector2D;
  contextMenu: {
    visible: boolean;
    x: number;
    y: number;
    baffleId: string | null;
  };
}

export const GAME_CONFIG = {
  CANVAS_WIDTH: 900,
  CANVAS_HEIGHT: 600,
  GRID_SIZE: 40,
  BALL_RADIUS: 12,
  BAFFLE_LENGTH: 80,
  BAFFLE_WIDTH: 8,
  BAFFLE_CORNER_RADIUS: 2,
  HOLE_RADIUS: 16,
  GRAVITY: 0.25,
  RESTITUTION: 0.7,
  FRICTION: 0.995,
  PHYSICS_STEPS_PER_FRAME: 2,
  MAX_BAFFLES: 50,
  TRAIL_LENGTH: 10,
  TRAIL_MAX_ALPHA: 0.5,
  TRAIL_MIN_ALPHA: 0.05,
} as const;

export const COLORS = {
  BACKGROUND: '#1A1A2E',
  BORDER: '#3D3D5C',
  GRID: '#E0E0E0',
  WALL_FILL: '#2B2B44',
  WALL_STROKE: '#4A4A6A',
  BALL_FILL: '#FF6B6B',
  BALL_SHADOW: '#CC5555',
  BAFFLE_HORIZONTAL: '#3D5A80',
  BAFFLE_VERTICAL: '#EE6C4D',
  BAFFLE_HIGHLIGHT: '#FFD700',
  HOLE_BORDER: '#FFFFFF',
  HOLE_FILL_START: 'rgba(255, 215, 0, 0.6)',
  HOLE_FILL_END: 'rgba(255, 215, 0, 0.1)',
  LEVEL_BAR_BG: '#2D2D44',
  LEVEL_BAR_SELECTED: '#6C63FF',
  SAVE_BUTTON: '#4CAF50',
  TEXT_WHITE: '#FFFFFF',
  ARROW_TIP: '#66FF99',
} as const;
