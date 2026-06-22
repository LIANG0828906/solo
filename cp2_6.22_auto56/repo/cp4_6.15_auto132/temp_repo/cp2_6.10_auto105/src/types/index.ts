export type CargoType = 'silk' | 'tea' | 'porcelain' | 'spice' | 'gem';

export type CamelType = 'bactrian' | 'dromedary';

export interface Camel {
  id: string;
  type: CamelType;
  cargo: { type: CargoType; weight: number }[];
  maxLoad: number;
}

export interface Caravan {
  id: string;
  name: string;
  camels: Camel[];
  origin: string;
  currentStation: string;
  isMoving?: boolean;
  currentPathIndex?: number;
}

export interface Station {
  id: string;
  name: string;
  x: number;
  y: number;
  distanceFromPrev: number;
  inventory: Record<CargoType, number>;
  supplies: { water: number; forage: number; horseshoes: number };
}

export interface TripLog {
  id: string;
  caravanId: string;
  caravanName: string;
  origin: string;
  destination: string;
  departTime: number;
  arriveTime: number;
  duration: number;
  totalWeight: number;
  suppliesConsumed: { water: number; forage: number; horseshoes: number };
  remainingCargo: Record<CargoType, number>;
}

export interface Route {
  stations: string[];
  totalDistance: number;
}

export interface Supplies {
  water: number;
  forage: number;
  horseshoes: number;
}

export interface MovingCaravan {
  caravanId: string;
  path: string[];
  currentIndex: number;
  progress: number;
}

export const CARGO_COLORS: Record<CargoType, string> = {
  silk: '#ff6b6b',
  tea: '#2ecc71',
  porcelain: '#3498db',
  spice: '#f39c12',
  gem: '#9b59b6',
};

export const CARGO_NAMES: Record<CargoType, string> = {
  silk: '丝绸',
  tea: '茶叶',
  porcelain: '瓷器',
  spice: '香料',
  gem: '宝石',
};

export const CAMEL_COLORS: Record<CamelType, string> = {
  bactrian: '#b68a5c',
  dromedary: '#d2b48c',
};

export const CAMEL_NAMES: Record<CamelType, string> = {
  bactrian: '双峰驼',
  dromedary: '单峰驼',
};
