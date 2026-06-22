export enum GrowthStage {
  SEEDLING = 'seedling',
  GROWING = 'growing',
  MATURE = 'mature'
}

export enum ActionType {
  WATER = 'water',
  FERTILIZE = 'fertilize',
  PLANT = 'plant'
}

export type PlantType = 
  | 'rose' 
  | 'sunflower' 
  | 'lavender' 
  | 'mint' 
  | 'tomato' 
  | 'strawberry' 
  | 'cactus' 
  | 'bamboo';

export interface PlantStageIcons {
  seedling: string;
  growing: string;
  mature: string;
}

export interface PlantConfig {
  type: PlantType;
  name: string;
  color: string;
  seedlingIcon: string;
  growingIcon: string;
  matureIcon: string;
  waterBoost: number;
  fertilizerBoost: number;
}

export interface PlantConfigCustomizer {
  (defaultConfig: PlantConfig): Partial<PlantConfig>;
}

export interface GrowthLogDetails {
  oldProgress?: number;
  newProgress?: number;
  boostValue?: number;
  stageChanged?: boolean;
  oldStage?: GrowthStage;
  newStage?: GrowthStage;
}

export interface GrowthLogEntry {
  id: string;
  timestamp: number;
  action: ActionType;
  description: string;
  details: GrowthLogDetails;
}

export interface Plant {
  id: string;
  type: PlantType;
  stage: GrowthStage;
  progress: number;
  plantedAt: number;
  lastWateredAt: number | null;
  lastFertilizedAt: number | null;
  isWatering: boolean;
  isFertilizing: boolean;
  logs: GrowthLogEntry[];
}

export interface GridCell {
  row: number;
  col: number;
  plant: Plant | null;
}

const DEFAULT_PLANT_CONFIGS: Record<PlantType, PlantConfig> = {
  rose: {
    type: 'rose',
    name: '玫瑰',
    color: '#e74c3c',
    seedlingIcon: '🌱',
    growingIcon: '🌿',
    matureIcon: '🌹',
    waterBoost: 8,
    fertilizerBoost: 20
  },
  sunflower: {
    type: 'sunflower',
    name: '向日葵',
    color: '#f1c40f',
    seedlingIcon: '🌱',
    growingIcon: '🌿',
    matureIcon: '🌻',
    waterBoost: 7,
    fertilizerBoost: 18
  },
  lavender: {
    type: 'lavender',
    name: '薰衣草',
    color: '#9b59b6',
    seedlingIcon: '🌱',
    growingIcon: '🌿',
    matureIcon: '💜',
    waterBoost: 6,
    fertilizerBoost: 15
  },
  mint: {
    type: 'mint',
    name: '薄荷',
    color: '#2ecc71',
    seedlingIcon: '🌱',
    growingIcon: '🌿',
    matureIcon: '🍃',
    waterBoost: 9,
    fertilizerBoost: 16
  },
  tomato: {
    type: 'tomato',
    name: '番茄',
    color: '#e67e22',
    seedlingIcon: '🌱',
    growingIcon: '🪴',
    matureIcon: '🍅',
    waterBoost: 7,
    fertilizerBoost: 19
  },
  strawberry: {
    type: 'strawberry',
    name: '草莓',
    color: '#e91e63',
    seedlingIcon: '🌱',
    growingIcon: '🌿',
    matureIcon: '🍓',
    waterBoost: 8,
    fertilizerBoost: 17
  },
  cactus: {
    type: 'cactus',
    name: '仙人掌',
    color: '#27ae60',
    seedlingIcon: '🌱',
    growingIcon: '🌿',
    matureIcon: '🌵',
    waterBoost: 5,
    fertilizerBoost: 12
  },
  bamboo: {
    type: 'bamboo',
    name: '竹子',
    color: '#689f38',
    seedlingIcon: '🌱',
    growingIcon: '🌿',
    matureIcon: '🎋',
    waterBoost: 10,
    fertilizerBoost: 22
  }
};

let customConfigOverrides: Partial<Record<PlantType, Partial<PlantConfig>>> = {};

export function setPlantConfig(type: PlantType, overrides: Partial<PlantConfig>): void {
  customConfigOverrides[type] = {
    ...customConfigOverrides[type],
    ...overrides
  };
}

export function setPlantIcon(type: PlantType, stage: GrowthStage, icon: string): void {
  const key = `${stage}Icon` as keyof PlantConfig;
  setPlantConfig(type, { [key]: icon } as Partial<PlantConfig>);
}

export function setPlantIcons(type: PlantType, icons: Partial<PlantStageIcons>): void {
  const overrides: Partial<PlantConfig> = {};
  if (icons.seedling) overrides.seedlingIcon = icons.seedling;
  if (icons.growing) overrides.growingIcon = icons.growing;
  if (icons.mature) overrides.matureIcon = icons.mature;
  setPlantConfig(type, overrides);
}

export function resetPlantConfig(type: PlantType): void {
  delete customConfigOverrides[type];
}

export function resetAllPlantConfigs(): void {
  customConfigOverrides = {};
}

function buildPlantConfigs(): Record<PlantType, PlantConfig> {
  const configs: Record<string, PlantConfig> = {};
  for (const [type, defaultConfig] of Object.entries(DEFAULT_PLANT_CONFIGS)) {
    const overrides = customConfigOverrides[type as PlantType];
    configs[type] = overrides
      ? { ...defaultConfig, ...overrides }
      : { ...defaultConfig };
  }
  return configs as Record<PlantType, PlantConfig>;
}

export const PLANT_CONFIGS = buildPlantConfigs();

export const GROWTH_THRESHOLDS = {
  [GrowthStage.SEEDLING]: 0,
  [GrowthStage.GROWING]: 33,
  [GrowthStage.MATURE]: 100
};

export const FERTILIZE_COOLDOWN = 10000;
export const GRID_SIZE = 6;

export const STAGE_LABELS: Record<GrowthStage, string> = {
  [GrowthStage.SEEDLING]: '幼苗期',
  [GrowthStage.GROWING]: '生长期',
  [GrowthStage.MATURE]: '成熟期'
};

export const STAGE_ICONS: Record<GrowthStage, string> = {
  [GrowthStage.SEEDLING]: '🌱',
  [GrowthStage.GROWING]: '🌿',
  [GrowthStage.MATURE]: '🌸'
};
