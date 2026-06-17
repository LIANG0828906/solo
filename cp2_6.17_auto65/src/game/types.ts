export interface Ball {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  number: number;
  color: string;
  pocketed: boolean;
}

export interface Player {
  id: number;
  name: string;
  score: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface Ripple {
  id: string;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  life: number;
  maxLife: number;
}

export interface TrailPoint {
  x: number;
  y: number;
  opacity: number;
}

export interface Pocket {
  x: number;
  y: number;
  radius: number;
}

export type GamePhase = 'idle' | 'aiming' | 'shooting' | 'moving' | 'gameOver';

export interface TableConfig {
  width: number;
  height: number;
  borderWidth: number;
  borderColor: string;
  feltColor: string;
  pocketRadius: number;
  pocketColor: string;
}

export const TABLE_CONFIG: TableConfig = {
  width: 900,
  height: 450,
  borderWidth: 30,
  borderColor: '#8B4513',
  feltColor: '#228B22',
  pocketRadius: 22,
  pocketColor: '#2C1810',
};

export const BALL_RADIUS = 10;
export const FRICTION = 0.98;
export const RESTITUTION = 0.85;
export const MIN_VELOCITY_THRESHOLD = 0.1;
export const MAX_POWER = 800;
export const BALL_COLORS: Record<number, string> = {
  0: '#FFFFFF',
  1: '#FFFF00',
  2: '#0000FF',
  3: '#FF0000',
  4: '#800080',
  5: '#FF8C00',
  6: '#006400',
  7: '#8B0000',
  8: '#000000',
  9: '#FFFF00',
  10: '#0000FF',
  11: '#FF0000',
  12: '#800080',
  13: '#FF8C00',
  14: '#006400',
  15: '#8B0000',
};

export function getPockets(): Pocket[] {
  const { width, height, borderWidth, pocketRadius } = TABLE_CONFIG;
  return [
    { x: borderWidth, y: borderWidth, radius: pocketRadius },
    { x: width / 2, y: borderWidth, radius: pocketRadius },
    { x: width - borderWidth, y: borderWidth, radius: pocketRadius },
    { x: borderWidth, y: height - borderWidth, radius: pocketRadius },
    { x: width / 2, y: height - borderWidth, radius: pocketRadius },
    { x: width - borderWidth, y: height - borderWidth, radius: pocketRadius },
  ];
}

export const POCKETS = getPockets();
