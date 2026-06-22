export type TrashType = 'plastic' | 'rubber' | 'metal' | 'fabric';

export interface TrashItem {
  id: string;
  type: TrashType;
  x: number;
  y: number;
  rotation: number;
  rotationSpeed: number;
  collected: boolean;
  collecting: boolean;
  collectTimer: number;
  scale: number;
}

export interface RecyclingStation {
  type: TrashType;
  x: number;
  y: number;
  width: number;
  height: number;
  recycled: number;
}

export type ObstacleType = 'reef' | 'jellyfish' | 'oil';

export interface Obstacle {
  id: string;
  type: ObstacleType;
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
  timer: number;
  jellyfishes?: { x: number; y: number; phase: number; speed: number }[];
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  alpha: number;
  type: 'bubble' | 'microbe';
}

export interface GameEvent {
  name: string;
  timer: number;
  maxTimer: number;
}

export interface ScreenShake {
  offsetX: number;
  offsetY: number;
  timer: number;
}

export const TRASH_SCORES: Record<TrashType, number> = {
  plastic: 5,
  rubber: 10,
  metal: 15,
  fabric: 20,
};

export const TRASH_COLORS: Record<TrashType, string> = {
  plastic: '#90EE90',
  rubber: '#333333',
  metal: '#C0C0C0',
  fabric: '#D2B48C',
};

export const STATION_COLORS: Record<TrashType, string> = {
  plastic: '#00CC00',
  rubber: '#333333',
  metal: '#A0A0C0',
  fabric: '#8B7355',
};

export const STATION_LABELS: Record<TrashType, string> = {
  plastic: '塑料',
  rubber: '橡胶',
  metal: '金属',
  fabric: '织物',
};
