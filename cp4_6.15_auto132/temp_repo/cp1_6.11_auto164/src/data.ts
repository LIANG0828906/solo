export enum TerrainType {
  SAND = 'sand',
  GRASS = 'grass',
  JUNGLE = 'jungle',
  ROCK = 'rock',
  OCEAN = 'ocean'
}

export enum ResourceType {
  COCONUT = 'coconut',
  WOOD = 'wood',
  STONE = 'stone',
  BERRY = 'berry'
}

export enum WeatherType {
  SUNNY = 'sunny',
  RAIN = 'rain',
  HEAT = 'heat'
}

export enum ItemCategory {
  FOOD = 'food',
  MATERIAL = 'material'
}

export interface ResourceInfo {
  name: string;
  description: string;
  category: ItemCategory;
  color: string;
  shape: 'ellipse' | 'rect' | 'circle';
  hungerRestore: number;
  thirstRestore: number;
}

export interface WeatherInfo {
  name: string;
  message: string;
  duration: number;
  hungerMultiplier: number;
  thirstMultiplier: number;
  moveSpeedMultiplier: number;
}

export interface TerrainInfo {
  color: string;
  walkable: boolean;
  resources: ResourceType[];
  label: string;
}

export const HEX_SIZE = 25;
export const HEX_GAP = 2;
export const HEX_WIDTH = Math.sqrt(3) * (HEX_SIZE + HEX_GAP);
export const HEX_HEIGHT = 2 * (HEX_SIZE + HEX_GAP);

export const ISLAND_MIN_RADIUS = 10;
export const ISLAND_MAX_RADIUS = 14;
export const INVENTORY_MAX_SLOTS = 20;
export const MOVE_DURATION = 0.15;
export const COLLECT_DURATION = 0.3;
export const USE_DURATION = 0.5;
export const WAVE_PERIOD = 1.2;
export const MAX_RAINDROPS = 50;

export const PLAYER_COLOR = '#FF6B35';
export const PLAYER_GLOW_COLOR = '#FFA07A';
export const PLAYER_GLOW_ALPHA = 0.4;
export const PLAYER_RADIUS = 8;

export const BG_COLOR = '#F4E4C1';
export const STAT_BG_COLOR = '#1D3557';
export const UI_PANEL_BG = '#000000CC';
export const UI_HINT_BG = '#00000066';

export const PRIMARY_COLOR = '#F4A261';
export const SECONDARY_COLOR = '#E76F51';
export const TERTIARY_COLOR = '#264653';
export const HP_COLOR = '#E63946';
export const HUNGER_COLOR = '#F4A261';
export const THIRST_COLOR = '#457B9D';
export const FOOD_BG_COLOR = '#F4A261';
export const MATERIAL_BG_COLOR = '#8D99AE';

export const TERRAIN_INFO: Record<TerrainType, TerrainInfo> = {
  [TerrainType.SAND]: {
    color: '#E8D5A3',
    walkable: true,
    resources: [ResourceType.COCONUT],
    label: '沙滩'
  },
  [TerrainType.GRASS]: {
    color: '#8FBC8F',
    walkable: true,
    resources: [ResourceType.WOOD, ResourceType.BERRY],
    label: '草地'
  },
  [TerrainType.JUNGLE]: {
    color: '#4A7C59',
    walkable: true,
    resources: [ResourceType.WOOD, ResourceType.BERRY, ResourceType.COCONUT],
    label: '丛林'
  },
  [TerrainType.ROCK]: {
    color: '#9E8C6C',
    walkable: true,
    resources: [ResourceType.STONE],
    label: '岩石'
  },
  [TerrainType.OCEAN]: {
    color: '#2E5B8A',
    walkable: false,
    resources: [],
    label: '海洋'
  }
};

export const RESOURCE_INFO: Record<ResourceType, ResourceInfo> = {
  [ResourceType.COCONUT]: {
    name: '椰子',
    description: '恢复30%水分和5%饱食度',
    category: ItemCategory.FOOD,
    color: '#8B5E3C',
    shape: 'ellipse',
    hungerRestore: 5,
    thirstRestore: 30
  },
  [ResourceType.WOOD]: {
    name: '木材',
    description: '建造材料，用于搭建庇护所',
    category: ItemCategory.MATERIAL,
    color: '#5C3A21',
    shape: 'rect',
    hungerRestore: 0,
    thirstRestore: 0
  },
  [ResourceType.STONE]: {
    name: '石头',
    description: '建造材料，用于制作工具',
    category: ItemCategory.MATERIAL,
    color: '#808080',
    shape: 'ellipse',
    hungerRestore: 0,
    thirstRestore: 0
  },
  [ResourceType.BERRY]: {
    name: '浆果',
    description: '恢复20%饱食度和5%水分',
    category: ItemCategory.FOOD,
    color: '#E63946',
    shape: 'circle',
    hungerRestore: 20,
    thirstRestore: 5
  }
};

export const WEATHER_INFO: Record<WeatherType, WeatherInfo> = {
  [WeatherType.SUNNY]: {
    name: '晴天',
    message: '阳光明媚',
    duration: 0,
    hungerMultiplier: 1,
    thirstMultiplier: 1,
    moveSpeedMultiplier: 1
  },
  [WeatherType.RAIN]: {
    name: '暴雨',
    message: '暴雨来袭！',
    duration: 15,
    hungerMultiplier: 1,
    thirstMultiplier: 0.5,
    moveSpeedMultiplier: 0.8
  },
  [WeatherType.HEAT]: {
    name: '高温',
    message: '高温来袭！',
    duration: 10,
    hungerMultiplier: 1,
    thirstMultiplier: 2,
    moveSpeedMultiplier: 1
  }
};

export const HUNGER_DECAY_PER_SEC = 0.02;
export const THIRST_DECAY_PER_SEC = 0.05;
export const HP_DECAY_PER_SEC = 0.1;
export const LOW_STAT_THRESHOLD = 20;
export const MOVE_HUNGER_COST = 0.2;
export const MOVE_THIRST_COST = 0.1;

export const WEATHER_INTERVAL_MIN = 30;
export const WEATHER_INTERVAL_MAX = 60;
