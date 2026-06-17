export enum MicrobeType {
  COCCUS = 'coccus',
  BACILLUS = 'bacillus',
  SPIRILLUM = 'spirillum',
}

export interface Microbe {
  id: string;
  type: MicrobeType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  age: number;
  flashing: boolean;
  flashTimer: number;
  direction?: number;
  turnTimer?: number;
  turnInterval?: number;
  spiralPhase?: number;
  spiralRadius?: number;
  spiralAngle?: number;
}

export interface Ripple {
  id: string;
  x: number;
  y: number;
  type: MicrobeType;
  progress: number;
  startTime: number;
}

export interface StatsPoint {
  time: number;
  coccus: number;
  bacillus: number;
  spirillum: number;
}

export interface ViewTransform {
  offsetX: number;
  offsetY: number;
  scale: number;
}

export enum EventType {
  SPAWN_MICROBE = 'SPAWN_MICROBE',
  MICROBE_PHAGOCYTOSED = 'MICROBE_PHAGOCYTOSED',
  MICROBE_REPRODUCED = 'MICROBE_REPRODUCED',
  FRAME_POSITIONS = 'FRAME_POSITIONS',
  ECOSYSTEM_TICK = 'ECOSYSTEM_TICK',
  RESET_SIMULATION = 'RESET_SIMULATION',
  ADD_RIPPLE = 'ADD_RIPPLE',
}

export type EventCallback = (data: unknown) => void;

export const MICROBE_COLORS: Record<MicrobeType, string> = {
  [MicrobeType.COCCUS]: '#27AE60',
  [MicrobeType.BACILLUS]: '#E74C3C',
  [MicrobeType.SPIRILLUM]: '#9B59B6',
};

export const MICROBE_NAMES: Record<MicrobeType, string> = {
  [MicrobeType.COCCUS]: '球菌',
  [MicrobeType.BACILLUS]: '杆菌',
  [MicrobeType.SPIRILLUM]: '螺旋菌',
};

export const SIMULATION_SIZE = 100;
export const MAX_MICROBES = 200;
export const REPRODUCTION_INTERVAL_MS = 10000;
export const REPRODUCTION_PROBABILITY = 0.2;
export const PHAGOCYTOSIS_PROBABILITY = 0.7;
export const STATS_WINDOW_SECONDS = 30;
export const STATS_UPDATE_INTERVAL_MS = 2000;
export const DENSITY_THRESHOLD = 15;
export const DENSITY_AREA = 100;
