export type MicrobeType = 'cyanobacteria' | 'mold' | 'ciliate';

export interface Cell {
  id: string;
  x: number;
  y: number;
  nutrient: number;
  ph: number;
  isDesert: boolean;
  microbes: {
    cyanobacteria: number;
    mold: number;
    ciliate: number;
  };
}

export interface GameState {
  grid: Cell[][];
  turn: number;
  score: number;
  victoryProgress: number;
  isVictory: boolean;
  isGameOver: boolean;
  energy: number;
  inventory: {
    cyanobacteria: number;
    mold: number;
    ciliate: number;
  };
  skillCooldown: number;
}

export interface MicrobeConfig {
  color: string;
  size: number;
  nutrientProduction: number;
  nutrientConsumption: number;
  reproductionRate: number;
  name: string;
}

export const MICROBE_CONFIGS: Record<MicrobeType, MicrobeConfig> = {
  cyanobacteria: {
    color: '#1E90FF',
    size: 12,
    nutrientProduction: 5,
    nutrientConsumption: 1,
    reproductionRate: 0.3,
    name: '蓝绿藻',
  },
  mold: {
    color: '#228B22',
    size: 10,
    nutrientProduction: 3,
    nutrientConsumption: 2,
    reproductionRate: 0.5,
    name: '霉菌',
  },
  ciliate: {
    color: '#FFD700',
    size: 8,
    nutrientProduction: 1,
    nutrientConsumption: 3,
    reproductionRate: 0.7,
    name: '纤毛虫',
  },
};

export const GRID_SIZE = 8;
export const BASE_NUTRIENT_CONSUMPTION = 3;
export const INITIAL_NUTRIENT = 80;
export const INITIAL_PH = 7.0;
export const PH_MIN = 5.0;
export const PH_MAX = 9.0;
export const PH_HEALTHY_MIN = 6.0;
export const PH_HEALTHY_MAX = 8.0;
export const MAX_MICROBES_PER_CELL = 10;
export const MAX_MICROBES_PER_TYPE_PLACED = 3;
export const VICTORY_THRESHOLD = 60;
export const VICTORY_INCREMENT = 10;
export const INITIAL_ENERGY = 100;
export const ENERGY_PER_MICROBE = 2;
export const MOVE_ENERGY_COST = 5;
export const CLEAR_SKILL_COST = 20;
export const SKILL_COOLDOWN = 3;
export const TURN_INTERVAL = 2000;
export const POLLUTION_SPREAD_CHANCE = 0.2;
export const REPRODUCTION_THRESHOLD = 4;
