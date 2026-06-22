export interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  stripe: boolean;
  number: number;
  pocketed: boolean;
  trajectory: TrajectoryPoint[];
}

export interface Pocket {
  x: number;
  y: number;
  radius: number;
}

export interface TableDimensions {
  x: number;
  y: number;
  width: number;
  height: number;
  cushionWidth: number;
  pockets: Pocket[];
}

export type GameMode = 'free' | 'sequential';
export type GamePhase = 'idle' | 'aiming' | 'power' | 'moving' | 'replay';

export interface TrajectoryPoint {
  x: number;
  y: number;
}

export interface BallTrajectory {
  ballId: number;
  points: TrajectoryPoint[];
}

export interface SnapshotBall {
  id: number;
  x: number;
  y: number;
}

export interface HistoryFrame {
  balls: SnapshotBall[];
}

export interface ShotRecord {
  frames: HistoryFrame[];
  trajectories: BallTrajectory[];
}

export interface CushionFlash {
  side: 'top' | 'bottom' | 'left' | 'right';
  time: number;
}

export const BALL_COLORS: Record<number, string> = {
  0: '#FFFFFF',
  1: '#FFD700',
  2: '#0000FF',
  3: '#FF0000',
  4: '#800080',
  5: '#FF8C00',
  6: '#008000',
  7: '#800000',
  8: '#000000',
  9: '#FFD700',
  10: '#0000FF',
  11: '#FF0000',
  12: '#800080',
  13: '#FF8C00',
  14: '#008000',
  15: '#800000',
};

export const TABLE_WIDTH = 540;
export const TABLE_HEIGHT = 270;
export const BALL_RADIUS = 6;
export const POCKET_RADIUS = 10;
export const CUSHION_WIDTH = 18;
export const FRICTION = 0.98;
export const AIM_LINE_LENGTH = 80;
export const AIM_BLINK_INTERVAL = 500;
export const MIN_SPEED = 0.1;
export const MAX_SHOT_SPEED = 15;
export const FOUL_FLASH_DURATION = 2000;
export const CUSHION_FLASH_DURATION = 20;
