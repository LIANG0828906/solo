export type PlantType = 'sunflower' | 'tomato' | 'rose' | 'cactus' | 'oak';

export type GrowthStage = 'seed' | 'sprout' | 'young' | 'adult' | 'flowering' | 'fruiting';

export type WaterNeed = 'low' | 'medium' | 'high';

export type SoilType = 'sand' | 'loam' | 'clay' | 'humus';

export interface PlantParams {
  name: string;
  requiredLightHours: number;
  waterNeed: WaterNeed;
  growthCycleTurns: number;
  finalStage: GrowthStage;
  petalColor: string;
}

export interface Plant {
  id: string;
  type: PlantType;
  stage: GrowthStage;
  growthProgress: number;
  health: number;
  position: { x: number; y: number };
  hasTriggeredFlowerParticles: boolean;
}

export interface Seed {
  type: PlantType;
  name: string;
  params: PlantParams;
}

export interface GardenGrid {
  width: number;
  height: number;
  cells: (Plant | null)[][];
}

export interface EnvironmentParams {
  lightIntensity: number;
  waterAmount: number;
  soilType: SoilType;
}

export interface GardenState {
  grid: GardenGrid;
  environment: EnvironmentParams;
  turnCount: number;
  isTransitioning: boolean;
  selectedPlantId: string | null;
  flowerParticles: FlowerParticle[];
}

export interface FlowerParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
}

export const SOIL_WATER_RETENTION: Record<SoilType, number> = {
  sand: 0.2,
  loam: 0.5,
  clay: 0.8,
  humus: 0.6,
};

export const SOIL_NUTRIENT_RELEASE: Record<SoilType, number> = {
  sand: 0.3,
  loam: 0.6,
  clay: 0.4,
  humus: 0.9,
};

export const WATER_NEED_MULTIPLIER: Record<WaterNeed, number> = {
  low: 0.5,
  medium: 1.0,
  high: 1.5,
};

export const PLANT_PARAMS: Record<PlantType, PlantParams> = {
  sunflower: {
    name: '向日葵',
    requiredLightHours: 10,
    waterNeed: 'medium',
    growthCycleTurns: 8,
    finalStage: 'fruiting',
    petalColor: '#FFD700',
  },
  tomato: {
    name: '番茄',
    requiredLightHours: 8,
    waterNeed: 'high',
    growthCycleTurns: 12,
    finalStage: 'fruiting',
    petalColor: '#FF6347',
  },
  rose: {
    name: '玫瑰',
    requiredLightHours: 6,
    waterNeed: 'medium',
    growthCycleTurns: 10,
    finalStage: 'flowering',
    petalColor: '#FF1493',
  },
  cactus: {
    name: '仙人掌',
    requiredLightHours: 12,
    waterNeed: 'low',
    growthCycleTurns: 15,
    finalStage: 'flowering',
    petalColor: '#FF69B4',
  },
  oak: {
    name: '橡树',
    requiredLightHours: 8,
    waterNeed: 'medium',
    growthCycleTurns: 14,
    finalStage: 'fruiting',
    petalColor: '#90EE90',
  },
};

export const GROWTH_STAGE_ORDER: GrowthStage[] = [
  'seed',
  'sprout',
  'young',
  'adult',
  'flowering',
  'fruiting',
];

export const STAGE_PROGRESS_THRESHOLDS: Record<GrowthStage, number> = {
  seed: 0,
  sprout: 0.1,
  young: 0.3,
  adult: 0.6,
  flowering: 0.8,
  fruiting: 1.0,
};
