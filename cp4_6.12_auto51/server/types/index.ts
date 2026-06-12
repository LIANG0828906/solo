export type LogType = 'water' | 'fertilize';

export interface PlantLog {
  id: string;
  type: LogType;
  amount: number;
  note?: string;
  createdAt: string;
}

export interface Plant {
  id: string;
  name: string;
  species: string;
  potDiameter: number;
  location: string;
  waterInterval: number;
  fertilizeInterval: number;
  photoUrl?: string;
  createdAt: string;
  lastWateredAt?: string;
  lastFertilizedAt?: string;
  nextWaterAt: string;
  logs: PlantLog[];
}

export interface SensorData {
  temperature: number;
  humidity: number;
  timestamp: string;
}

export interface SensorHistoryPoint {
  hour: number;
  temperature: number;
  humidity: number;
}

export interface CreatePlantRequest {
  name: string;
  species: string;
  potDiameter: number;
  location: string;
  waterInterval: number;
  fertilizeInterval: number;
  photoUrl?: string;
}

export interface WaterPlantRequest {
  amount: number;
  note?: string;
}

export interface FertilizePlantRequest {
  amount: number;
  note?: string;
}

export interface UpdateLogRequest {
  amount?: number;
  note?: string;
}
