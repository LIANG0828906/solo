export type BuildingType = 'cube' | 'L-shape' | 'U-shape';

export type FacadeDirection = 'south' | 'north' | 'east' | 'west';

export interface OpeningRates {
  south: number;
  north: number;
  east: number;
  west: number;
}

export interface VentilationMetrics {
  avgWindSpeed: number;
  maxWindSpeed: number;
  turbulenceIntensity: number;
  deadZoneRatio: number;
  airChangeRate: number;
}

export interface Particle {
  id: number;
  position: [number, number, number];
  velocity: [number, number, number];
  speed: number;
  trail: [number, number, number][];
  life: number;
}

export interface SavedScheme {
  id: number;
  name: string;
  buildingType: BuildingType;
  openingRates: OpeningRates;
  createdAt: number;
}

export interface BuildingState {
  buildingType: BuildingType;
  openingRates: OpeningRates;
  savedSchemes: SavedScheme[];
  setBuildingType: (type: BuildingType) => void;
  setOpeningRate: (direction: FacadeDirection, value: number) => void;
  saveScheme: (name?: string) => void;
  loadScheme: (index: number) => void;
  deleteScheme: (index: number) => void;
}

export interface BuildingDimensions {
  width: number;
  height: number;
  depth: number;
  segments: { x: number; y: number; z: number };
}

export const BASELINE_SCHEME: SavedScheme = {
  id: -1,
  name: '基准方案',
  buildingType: 'cube',
  openingRates: {
    south: 20,
    north: 20,
    east: 20,
    west: 20
  },
  createdAt: 0
};

export const BUILDING_DIMENSIONS: Record<BuildingType, BuildingDimensions> = {
  'cube': {
    width: 6,
    height: 4,
    depth: 6,
    segments: { x: 30, y: 20, z: 30 }
  },
  'L-shape': {
    width: 8,
    height: 4,
    depth: 8,
    segments: { x: 40, y: 20, z: 40 }
  },
  'U-shape': {
    width: 9,
    height: 4,
    depth: 9,
    segments: { x: 45, y: 20, z: 45 }
  }
};

export const FACADE_LABELS: Record<FacadeDirection, string> = {
  south: '南立面',
  north: '北立面',
  east: '东立面',
  west: '西立面'
};

export const METRIC_LABELS: Record<keyof VentilationMetrics, string> = {
  avgWindSpeed: '风速均值',
  maxWindSpeed: '最大风速',
  turbulenceIntensity: '湍流强度',
  deadZoneRatio: '死角占比',
  airChangeRate: '换气次数'
};

export const METRIC_UNITS: Record<keyof VentilationMetrics, string> = {
  avgWindSpeed: 'm/s',
  maxWindSpeed: 'm/s',
  turbulenceIntensity: '',
  deadZoneRatio: '',
  airChangeRate: '次/h'
};
