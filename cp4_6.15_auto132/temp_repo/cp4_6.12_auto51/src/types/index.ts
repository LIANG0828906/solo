export type PlantSpecies =
  | '绿萝'
  | '虎皮兰'
  | '多肉'
  | '龟背竹'
  | '仙人掌'
  | '吊兰'
  | '发财树'
  | '其他';

export type PlantLocation =
  | '客厅'
  | '卧室'
  | '书房'
  | '阳台'
  | '厨房'
  | '卫生间';

export interface Plant {
  id: string;
  name: string;
  species: PlantSpecies;
  location: PlantLocation;
  acquiredAt: string;
  lastWateredAt?: string;
  lastFertilizedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CareLogType = 'water' | 'fertilize' | 'prune' | 'repot' | 'other';

export interface CareLog {
  id: string;
  plantId: string;
  type: CareLogType;
  amount?: number;
  note?: string;
  createdAt: string;
}

export interface SensorData {
  id?: string;
  temperature: number;
  humidity: number;
  soilMoisture: number;
  lightLevel: number;
  timestamp: string;
}

export interface SpeciesInfo {
  color: string;
  emoji: string;
  defaultWater: number;
}

export const SPECIES_LIST: PlantSpecies[] = [
  '绿萝',
  '虎皮兰',
  '多肉',
  '龟背竹',
  '仙人掌',
  '吊兰',
  '发财树',
  '其他',
];

export const LOCATION_LIST: PlantLocation[] = [
  '客厅',
  '卧室',
  '书房',
  '阳台',
  '厨房',
  '卫生间',
];

export const SPECIES_INFO: Record<PlantSpecies, SpeciesInfo> = {
  '绿萝': {
    color: '#22c55e',
    emoji: '🌿',
    defaultWater: 200,
  },
  '虎皮兰': {
    color: '#14b8a6',
    emoji: '🪴',
    defaultWater: 150,
  },
  '多肉': {
    color: '#a855f7',
    emoji: '🌵',
    defaultWater: 50,
  },
  '龟背竹': {
    color: '#10b981',
    emoji: '🍃',
    defaultWater: 300,
  },
  '仙人掌': {
    color: '#84cc16',
    emoji: '🌵',
    defaultWater: 30,
  },
  '吊兰': {
    color: '#65a30d',
    emoji: '🌱',
    defaultWater: 180,
  },
  '发财树': {
    color: '#16a34a',
    emoji: '🌳',
    defaultWater: 250,
  },
  '其他': {
    color: '#6b7280',
    emoji: '🌱',
    defaultWater: 150,
  },
};

export interface AddPlantPayload {
  name: string;
  species: PlantSpecies;
  location: PlantLocation;
  acquiredAt: string;
  notes?: string;
}

export interface RecordWaterPayload {
  amount: number;
  note?: string;
}

export interface RecordFertilizePayload {
  amount: number;
  note?: string;
}

export interface UpdateLogPayload {
  type?: CareLogType;
  amount?: number;
  note?: string;
}
