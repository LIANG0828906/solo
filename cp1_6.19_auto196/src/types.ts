export type DebrisType = 'metal' | 'plastic' | 'electronic';

export interface Vertex {
  x: number;
  y: number;
}

export interface Debris {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseSize: number;
  rotation: number;
  rotationSpeed: number;
  type: DebrisType;
  vertices: Vertex[];
  isBeingCaptured: boolean;
  captureProgress: number;
}

export interface Ship {
  x: number;
  y: number;
  angle: number;
  beamLength: number;
  beamSpread: number;
}

export interface TaskGoal {
  type: DebrisType;
  count: number;
}

export interface OrbitZone {
  id: number;
  name: string;
  group: 'low' | 'medium' | 'high';
  debrisSizeMin: number;
  debrisSizeMax: number;
  debrisSpeedMin: number;
  debrisSpeedMax: number;
  timeLimit: number;
  tasks: TaskGoal[];
}

export interface CapturePopup {
  id: number;
  x: number;
  y: number;
  offsetY: number;
  opacity: number;
}

export interface GameState {
  score: number;
  timeRemaining: number;
  currentZoneIndex: number;
  debrisCounts: Record<DebrisType, number>;
  isTransitioning: boolean;
  isGameOver: boolean;
  isGameStarted: boolean;
  finalStats: {
    totalScore: number;
    totalDebris: Record<DebrisType, number>;
  } | null;
}

export const DEBRIS_COLORS: Record<DebrisType, string> = {
  metal: '#B0BEC5',
  plastic: '#FFAB91',
  electronic: '#80CBC4',
};

export const DEBRIS_NAMES: Record<DebrisType, string> = {
  metal: '金属',
  plastic: '塑料',
  electronic: '电子元件',
};

export const ORBIT_ZONES: OrbitZone[] = [
  {
    id: 0, name: '低轨道 Alpha', group: 'low',
    debrisSizeMin: 15, debrisSizeMax: 35,
    debrisSpeedMin: 0.3, debrisSpeedMax: 1.2,
    timeLimit: 60, tasks: [{ type: 'metal', count: 5 }, { type: 'plastic', count: 3 }, { type: 'electronic', count: 2 }],
  },
  {
    id: 1, name: '低轨道 Beta', group: 'low',
    debrisSizeMin: 17, debrisSizeMax: 37,
    debrisSpeedMin: 0.35, debrisSpeedMax: 1.25,
    timeLimit: 55, tasks: [{ type: 'metal', count: 6 }, { type: 'plastic', count: 4 }, { type: 'electronic', count: 3 }],
  },
  {
    id: 2, name: '低轨道 Gamma', group: 'low',
    debrisSizeMin: 19, debrisSizeMax: 39,
    debrisSpeedMin: 0.4, debrisSpeedMax: 1.3,
    timeLimit: 50, tasks: [{ type: 'metal', count: 7 }, { type: 'plastic', count: 4 }, { type: 'electronic', count: 4 }],
  },
  {
    id: 3, name: '中轨道 Alpha', group: 'medium',
    debrisSizeMin: 25, debrisSizeMax: 45,
    debrisSpeedMin: 0.5, debrisSpeedMax: 1.5,
    timeLimit: 55, tasks: [{ type: 'metal', count: 6 }, { type: 'plastic', count: 5 }, { type: 'electronic', count: 4 }],
  },
  {
    id: 4, name: '中轨道 Beta', group: 'medium',
    debrisSizeMin: 27, debrisSizeMax: 47,
    debrisSpeedMin: 0.55, debrisSpeedMax: 1.55,
    timeLimit: 50, tasks: [{ type: 'metal', count: 7 }, { type: 'plastic', count: 5 }, { type: 'electronic', count: 5 }],
  },
  {
    id: 5, name: '中轨道 Gamma', group: 'medium',
    debrisSizeMin: 29, debrisSizeMax: 49,
    debrisSpeedMin: 0.6, debrisSpeedMax: 1.6,
    timeLimit: 45, tasks: [{ type: 'metal', count: 8 }, { type: 'plastic', count: 6 }, { type: 'electronic', count: 5 }],
  },
  {
    id: 6, name: '高轨道 Alpha', group: 'high',
    debrisSizeMin: 30, debrisSizeMax: 50,
    debrisSpeedMin: 0.7, debrisSpeedMax: 1.7,
    timeLimit: 50, tasks: [{ type: 'metal', count: 8 }, { type: 'plastic', count: 6 }, { type: 'electronic', count: 6 }],
  },
  {
    id: 7, name: '高轨道 Beta', group: 'high',
    debrisSizeMin: 32, debrisSizeMax: 52,
    debrisSpeedMin: 0.75, debrisSpeedMax: 1.75,
    timeLimit: 45, tasks: [{ type: 'metal', count: 9 }, { type: 'plastic', count: 7 }, { type: 'electronic', count: 6 }],
  },
  {
    id: 8, name: '高轨道 Gamma', group: 'high',
    debrisSizeMin: 35, debrisSizeMax: 55,
    debrisSpeedMin: 0.8, debrisSpeedMax: 1.8,
    timeLimit: 40, tasks: [{ type: 'metal', count: 10 }, { type: 'plastic', count: 8 }, { type: 'electronic', count: 7 }],
  },
];

export const CANVAS_WIDTH = 700;
export const CANVAS_HEIGHT = 600;
export const MIN_DEBRIS_COUNT = 15;
export const MAX_DEBRIS_COUNT = 20;
export const BEAM_LENGTH = 140;
export const BEAM_SPREAD = Math.PI / 6;
export const CAPTURE_SPEED = 1.5;
export const SCORE_PER_DEBRIS = 10;
