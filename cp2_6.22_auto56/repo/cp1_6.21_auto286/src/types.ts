export enum CreatureType {
  PRODUCER = 'producer',
  PRIMARY_CONSUMER = 'primary',
  SECONDARY_CONSUMER = 'secondary',
  DECOMPOSER = 'decomposer',
}

export interface Creature {
  id: string;
  type: CreatureType;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  health: number;
  maxHealth: number;
  age: number;
  lifespan: number;
  speed: number;
  reproductionRate: number;
  predationRange: number;
  spawnScale: number;
  spawnTimer: number;
}

export interface Resources {
  sunlight: number;
  water: number;
  nutrients: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
  active: boolean;
}

export interface TankConfig {
  width: number;
  height: number;
  frameInterval: number;
  speedMultiplier: number;
  resourceUpdateInterval: number;
}

export interface EcoState {
  creatures: Creature[];
  resources: Resources;
  frameCount: number;
  isRunning: boolean;
  population: Record<CreatureType, number>;
  avgLifespan: Record<CreatureType, number>;
  particles: Particle[];
}

export interface HistoryPoint {
  frame: number;
  population: Record<CreatureType, number>;
}

export const CREATURE_COLORS: Record<CreatureType, string> = {
  [CreatureType.PRODUCER]: '#22C55E',
  [CreatureType.PRIMARY_CONSUMER]: '#EAB308',
  [CreatureType.SECONDARY_CONSUMER]: '#EF4444',
  [CreatureType.DECOMPOSER]: '#9CA3AF',
};

export const CREATURE_NAMES: Record<CreatureType, string> = {
  [CreatureType.PRODUCER]: '生产者',
  [CreatureType.PRIMARY_CONSUMER]: '初级消费者',
  [CreatureType.SECONDARY_CONSUMER]: '次级消费者',
  [CreatureType.DECOMPOSER]: '分解者',
};

export const FOOD_CHAIN: Record<CreatureType, CreatureType | null> = {
  [CreatureType.PRODUCER]: null,
  [CreatureType.PRIMARY_CONSUMER]: CreatureType.PRODUCER,
  [CreatureType.SECONDARY_CONSUMER]: CreatureType.PRIMARY_CONSUMER,
  [CreatureType.DECOMPOSER]: CreatureType.SECONDARY_CONSUMER,
};

export const CREATURE_BASE_CONFIG: Record<CreatureType, Omit<Creature, 'id' | 'x' | 'y' | 'prevX' | 'prevY' | 'vx' | 'vy' | 'spawnScale' | 'spawnTimer' | 'age'>> = {
  [CreatureType.PRODUCER]: {
    type: CreatureType.PRODUCER,
    health: 100,
    maxHealth: 100,
    lifespan: 200,
    speed: 0.3,
    reproductionRate: 0.02,
    predationRange: 0,
  },
  [CreatureType.PRIMARY_CONSUMER]: {
    type: CreatureType.PRIMARY_CONSUMER,
    health: 80,
    maxHealth: 80,
    lifespan: 150,
    speed: 1.2,
    reproductionRate: 0.015,
    predationRange: 15,
  },
  [CreatureType.SECONDARY_CONSUMER]: {
    type: CreatureType.SECONDARY_CONSUMER,
    health: 120,
    maxHealth: 120,
    lifespan: 180,
    speed: 1.5,
    reproductionRate: 0.01,
    predationRange: 20,
  },
  [CreatureType.DECOMPOSER]: {
    type: CreatureType.DECOMPOSER,
    health: 60,
    maxHealth: 60,
    lifespan: 120,
    speed: 0.8,
    reproductionRate: 0.018,
    predationRange: 18,
  },
};
