import type { Point } from '../types/game';

export const MAP_WIDTH = 800;
export const MAP_HEIGHT = 800;
export const GRID_SIZE = 100;
export const CORE_X = 400;
export const CORE_Y = 400;
export const CORE_RADIUS = 30;
export const CORE_MIN_DIST = 50;
export const METEOR_BASE_COUNT = 5;
export const METEOR_COUNT_INCREMENT = 3;
export const METEOR_BASE_SPEED = 1.5;
export const METEOR_SPEED_INCREMENT = 0.3;
export const METEOR_RADIUS = 12;
export const METEOR_HP = 10;
export const METEOR_MIN_DIST_CORE = 350;
export const METEOR_SPAWN_INTERVAL = 500;
export const SIDE_SHIFT_START_WAVE = 5;
export const SIDE_SHIFT_PROB = 0.2;
export const SIDE_SHIFT_ANGLE = 0.087;
export const SIDE_SHIFT_DURATION = 2000;
export const TOWER_COST = 150;
export const TOWER_UPGRADE_COST = 100;
export const TOWER_RANGE = 100;
export const TOWER_FIRE_INTERVAL_L1 = 2000;
export const TOWER_FIRE_INTERVAL_L2 = 1500;
export const TOWER_DAMAGE_L1 = 10;
export const TOWER_DAMAGE_L2 = 15;
export const BULLET_RADIUS = 4;
export const BULLET_SPEED = 5;
export const WAVE_COMPLETE_CORE_RECOVERY = 0.1;
export const WAVE_COMPLETE_RESOURCE_BONUS = 100;
export const RESOURCE_TICK_INTERVAL = 10000;
export const RESOURCE_TICK_AMOUNT = 50;
export const SCREEN_SHAKE_DURATION = 100;
export const SCREEN_SHAKE_INTENSITY = 3;
export const VICTORY_ANIM_DURATION = 500;
export const INSUFFICIENT_MSG_DURATION = 1000;

export const distSq = (x1: number, y1: number, x2: number, y2: number): number => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
};

export const dist = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.sqrt(distSq(x1, y1, x2, y2));
};

export const angleTo = (fromX: number, fromY: number, toX: number, toY: number): number => {
  return Math.atan2(toY - fromY, toX - fromX);
};

export const gridToWorld = (gridX: number, gridY: number): Point => {
  return {
    x: gridX * GRID_SIZE + GRID_SIZE / 2,
    y: gridY * GRID_SIZE + GRID_SIZE / 2,
  };
};

export const worldToGrid = (worldX: number, worldY: number): Point => {
  return {
    x: Math.floor(worldX / GRID_SIZE),
    y: Math.floor(worldY / GRID_SIZE),
  };
};

export const getGridCount = (): { cols: number; rows: number } => {
  return {
    cols: Math.floor(MAP_WIDTH / GRID_SIZE),
    rows: Math.floor(MAP_HEIGHT / GRID_SIZE),
  };
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export const lerp = (a: number, b: number, t: number): number => {
  return a + (b - a) * t;
};

export const randomRange = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

export const getGridCenterPoints = (): Point[] => {
  const { cols, rows } = getGridCount();
  const points: Point[] = [];
  for (let gx = 0; gx < cols; gx++) {
    for (let gy = 0; gy < rows; gy++) {
      points.push(gridToWorld(gx, gy));
    }
  }
  return points;
};
