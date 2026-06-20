export type ZoneId = 'balcony' | 'windowsill' | 'terrace';

export type LightLevel = 'low' | 'medium' | 'high';

export type SoilMoisture = 'dry' | 'moist' | 'waterlogged';

export type PlantType = 'pothos' | 'succulent' | 'rose' | 'mint';

export interface EnvironmentData {
  id: string;
  timestamp: number;
  temperature: number;
  humidity: number;
  light: LightLevel;
  soilMoisture: SoilMoisture;
}

export interface Zone {
  id: ZoneId;
  name: string;
  data: EnvironmentData[];
  plant: PlantType;
}

export interface PredictionDay {
  day: string;
  temp: number;
  humidity: number;
  advice: string;
}

export interface Trend {
  temperature: 'up' | 'down' | 'stable';
  humidity: 'up' | 'down' | 'stable';
}
