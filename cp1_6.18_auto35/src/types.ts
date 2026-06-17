export type WeatherType = 'sunny' | 'cloudy' | 'overcast' | 'rainy' | 'snowy';

export type PlantSpecies = 'sunflower' | 'cactus' | 'mushroom';

export type GrowthStage = 'seedling' | 'growing' | 'flowering';

export interface Plant {
  id: string;
  species: PlantSpecies;
  stage: GrowthStage;
  growth: number;
  health: number;
  humidity: number;
  nutrients: number;
  position: number;
  plantedAt: number;
  lastWatered: number;
  lastFertilized: number;
}

export interface WeatherData {
  type: WeatherType;
  temperature: number;
  humidity: number;
  forecast: WeatherType[];
  updatedAt: number;
}

export type UserAction = 'water' | 'fertilize' | 'plant' | 'harvest';

export interface PlantSpeciesInfo {
  id: PlantSpecies;
  name: string;
  description: string;
  baseGrowthRate: number;
  waterNeed: number;
  nutrientNeed: number;
  weatherPreference: WeatherType[];
  color: string;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
  color: string;
  life: number;
}

export interface Ripple {
  id: string;
  x: number;
  y: number;
  plantId: string;
  type: 'water' | 'fertilize';
}
