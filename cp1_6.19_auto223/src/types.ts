export enum AlienType {
  NORMAL = 'normal',
  ARMORED = 'armored',
  BOSS = 'boss',
}

export enum RuneType {
  CIRCLE = 'circle',
  TRIANGLE = 'triangle',
  LIGHTNING = 'lightning',
  SPIRAL = 'spiral',
  STAR = 'star',
}

export enum GameState {
  PLAYING = 'playing',
  GAME_OVER = 'game_over',
}

export interface BezierPoint {
  x: number;
  y: number;
}

export interface Alien {
  id: string;
  type: AlienType;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  baseSpeed: number;
  size: number;
  path: BezierPoint[];
  pathProgress: number;
  lastShootTime: number;
}

export interface TrajectoryPoint {
  x: number;
  y: number;
  timestamp: number;
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export interface MagicEffect {
  id: string;
  type: RuneType;
  x: number;
  y: number;
  startTime: number;
  duration: number;
  radius?: number;
  hitAlienIds?: string[];
}

export interface StarParticle {
  x: number;
  y: number;
  brightness: number;
}

export interface RuneTemplate {
  type: RuneType;
  name: string;
  description: string;
  color: string;
}

export const RUNE_TEMPLATES: RuneTemplate[] = [
  {
    type: RuneType.CIRCLE,
    name: '圆形',
    description: '防护罩',
    color: '#4A90D9',
  },
  {
    type: RuneType.TRIANGLE,
    name: '三角形',
    description: '爆炸',
    color: '#E74C3C',
  },
  {
    type: RuneType.LIGHTNING,
    name: '闪电',
    description: '闪电链',
    color: '#F1C40F',
  },
  {
    type: RuneType.SPIRAL,
    name: '螺旋',
    description: '吸引',
    color: '#9B59B6',
  },
  {
    type: RuneType.STAR,
    name: '星形',
    description: '散射',
    color: '#2ECC71',
  },
];

export const ALIEN_CONFIGS = {
  [AlienType.NORMAL]: {
    size: 40,
    hp: 1,
    speed: 1,
    color: '#2ECC71',
    borderColor: '#27AE60',
    borderWidth: 0,
  },
  [AlienType.ARMORED]: {
    size: 60,
    hp: 3,
    speed: 0.6,
    color: '#7F8C8D',
    borderColor: '#BDC3C7',
    borderWidth: 2,
  },
  [AlienType.BOSS]: {
    size: 80,
    hp: 8,
    speed: 0.4,
    color: '#E74C3C',
    borderColor: '#C0392B',
    borderWidth: 0,
  },
};

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const GAME_AREA_HEIGHT = CANVAS_HEIGHT * 0.6;
export const DRAW_AREA_WIDTH = 400;
export const DRAW_AREA_HEIGHT = 250;
export const DRAW_AREA_X = (CANVAS_WIDTH - DRAW_AREA_WIDTH) / 2;
export const DRAW_AREA_Y = CANVAS_HEIGHT - DRAW_AREA_HEIGHT - 60;
export const MAX_ENERGY = 100;
export const INITIAL_ENERGY = 30;
export const RUNE_ENERGY_COST = 5;
export const KILL_ENERGY_REWARD = 2;
export const ENERGY_REGEN_INTERVAL = 10000;
export const ENERGY_REGEN_AMOUNT = 1;
export const WAVE_SPAWN_INTERVAL = 5000;
export const WAVE_MIN_COUNT = 2;
export const WAVE_MAX_COUNT = 4;
export const TRAJECTORY_SAMPLE_INTERVAL = 15;
export const MAX_ESCAPED = 3;
export const BASE_SCORE = 10;
export const COMBO_BONUS = 5;
export const COMBO_THRESHOLD = 3;
export const PLAYER_X = CANVAS_WIDTH / 2;
export const PLAYER_Y = CANVAS_HEIGHT - 30;
