export type BuildingType = 'empty' | 'residential' | 'commercial' | 'industrial' | 'road';

export interface Resources {
  population: number;
  money: number;
  happiness: number;
  environment: number;
}

export interface GridCell {
  x: number;
  y: number;
  building: BuildingType;
  isHighlighted?: boolean;
  animationTimer?: number;
}

export type EventType = 'earthquake' | 'prosperity' | 'pollution';

export interface GameEvent {
  id: string;
  type: EventType;
  name: string;
  description: string;
  isPositive: boolean;
  duration?: number;
  timestamp: number;
}

export interface BuildingConfig {
  type: BuildingType;
  name: string;
  cost: number;
  color: string;
  icon: string;
  production: Partial<Resources>;
  consumption: Partial<Resources>;
}

export type CityLevel = 'village' | 'town' | 'city' | 'metropolis';

export interface BuildMenuState {
  visible: boolean;
  x: number;
  y: number;
  cellX: number;
  cellY: number;
}

export interface GameState {
  grid: GridCell[][];
  resources: Resources;
  resourceHistory: Resources[];
  events: GameEvent[];
  activeNotifications: GameEvent[];
  cityName: string;
  selectedBuilding: BuildingType | null;
  isShiftPressed: boolean;
  environmentalCrisis: boolean;
  prosperityBoost: boolean;
  crisisTimer: number;
  prosperityTimer: number;
  buildMenu: BuildMenuState | null;
  hoveredCell: { x: number; y: number } | null;
  lastCityLevel: CityLevel;
  showLevelUpAnimation: boolean;
  affectedCells: Set<string>;
}

export interface GameActions {
  buildBuilding: (x: number, y: number, type: BuildingType) => boolean;
  removeBuilding: (x: number, y: number) => void;
  updateResources: (delta: Partial<Resources>) => void;
  settleResources: () => void;
  triggerEvent: (event: GameEvent) => void;
  clearEvent: (eventId: string) => void;
  setShiftPressed: (pressed: boolean) => void;
  setSelectedBuilding: (type: BuildingType | null) => void;
  setBuildMenu: (menu: BuildMenuState | null) => void;
  setHoveredCell: (cell: { x: number; y: number } | null) => void;
  checkEnvironmentalCrisis: () => void;
  checkProsperity: () => void;
  addResourceHistory: (resources: Resources) => void;
  getCityLevel: () => CityLevel;
  updateTimers: (deltaTime: number) => void;
  setEnvironmentalCrisis: (active: boolean) => void;
  setProsperityBoost: (active: boolean) => void;
  setShowLevelUpAnimation: (show: boolean) => void;
  addAffectedCell: (key: string) => void;
  removeAffectedCell: (key: string) => void;
  clearAffectedCells: () => void;
}

export const GRID_SIZE = 20;
export const SETTLE_INTERVAL = 5000;
export const EVENT_INTERVAL = 30000;
export const CRISIS_DURATION = 30000;
export const PROSPERITY_DURATION = 20000;
export const HISTORY_LENGTH = 5;
export const TARGET_FPS = 30;
export const FRAME_TIME = 1000 / TARGET_FPS;

export const BUILDING_CONFIGS: Record<BuildingType, BuildingConfig> = {
  residential: {
    type: 'residential',
    name: '住宅',
    cost: 100,
    color: '#6a994e',
    icon: '🏠',
    production: { population: 10, money: 5 },
    consumption: {}
  },
  commercial: {
    type: 'commercial',
    name: '商业',
    cost: 200,
    color: '#bc4749',
    icon: '🏪',
    production: { money: 20, happiness: 2 },
    consumption: {}
  },
  industrial: {
    type: 'industrial',
    name: '工业',
    cost: 300,
    color: '#457b9d',
    icon: '🏭',
    production: { money: 30 },
    consumption: { environment: -5, happiness: -1 }
  },
  empty: {
    type: 'empty',
    name: '空地',
    cost: 0,
    color: 'transparent',
    icon: '➕',
    production: {},
    consumption: {}
  },
  road: {
    type: 'road',
    name: '道路',
    cost: 0,
    color: '#2a2a3a',
    icon: '🛤️',
    production: {},
    consumption: {}
  }
};

export const RESOURCE_COLORS: Record<keyof Resources, string> = {
  population: '#6a994e',
  money: '#f4a261',
  happiness: '#e9c46a',
  environment: '#2a9d8f'
};

export const RESOURCE_NAMES: Record<keyof Resources, string> = {
  population: '人口',
  money: '金钱',
  happiness: '幸福度',
  environment: '环境'
};

export const CITY_LEVEL_NAMES: Record<CityLevel, string> = {
  village: '村庄',
  town: '城镇',
  city: '城市',
  metropolis: '都市'
};
