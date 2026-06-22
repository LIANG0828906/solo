export enum FacilityType {
  STAGE = 'stage',
  FOOD = 'food',
  RESTROOM = 'restroom',
  REST = 'rest',
  MEDICAL = 'medical',
}

export interface FacilityTypeConfig {
  type: FacilityType;
  name: string;
  color: string;
  icon: string;
}

export const FACILITY_CONFIGS: Record<FacilityType, FacilityTypeConfig> = {
  [FacilityType.STAGE]: {
    type: FacilityType.STAGE,
    name: '舞台',
    color: '#9C27B0',
    icon: '🎤',
  },
  [FacilityType.FOOD]: {
    type: FacilityType.FOOD,
    name: '餐饮区',
    color: '#FF9800',
    icon: '🍔',
  },
  [FacilityType.RESTROOM]: {
    type: FacilityType.RESTROOM,
    name: '卫生间',
    color: '#2196F3',
    icon: '🚻',
  },
  [FacilityType.REST]: {
    type: FacilityType.REST,
    name: '休息区',
    color: '#4CAF50',
    icon: '🛋️',
  },
  [FacilityType.MEDICAL]: {
    type: FacilityType.MEDICAL,
    name: '医疗站',
    color: '#F44336',
    icon: '⛑️',
  },
};

export interface Facility {
  id: string;
  type: FacilityType;
  name: string;
  lat: number;
  lng: number;
  color: string;
  icon: string;
}

export interface PersonPoint {
  id: string;
  lat: number;
  lng: number;
  originLat: number;
  originLng: number;
  weight: number;
  createdAt: number;
  lifespan: number;
  vx: number;
  vy: number;
}

export interface HeatGrid {
  width: number;
  height: number;
  data: Float32Array;
  bounds: [number, number, number, number];
  maxValue: number;
  avgValue: number;
  maxPoint: { lat: number; lng: number; value: number } | null;
}

export interface MapBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}
