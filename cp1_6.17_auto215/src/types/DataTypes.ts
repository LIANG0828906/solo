export interface ClimateRecord {
  aqi: number;
  pm25: number;
  temperature: number;
  humidity: number;
}

export interface CityData {
  id: string;
  name: string;
  country: string;
  continent: string;
  latitude: number;
  longitude: number;
  monthlyData: ClimateRecord[];
}

export interface ViewConfig {
  cameraPosition: { x: number; y: number; z: number };
  targetPosition: { x: number; y: number; z: number };
}

export type Continent = 'all' | 'asia' | 'europe' | 'northAmerica' | 'southAmerica' | 'africa' | 'oceania';

export interface FilterConfig {
  continent: Continent;
  compareCities: string[];
}

export interface TimeConfig {
  year: number;
  month: number;
  isPlaying: boolean;
  playSpeed: 1 | 2 | 4;
}

export interface LayerConfig {
  heatmap: boolean;
  windParticles: boolean;
}

export enum EventType {
  DATA_UPDATED = 'DATA_UPDATED',
  SCENE_READY = 'SCENE_READY',
  TIME_CHANGE = 'TIME_CHANGE',
  FILTER_CHANGE = 'FILTER_CHANGE',
  VIEW_CHANGE = 'VIEW_CHANGE',
  COMPARE_SELECT = 'COMPARE_SELECT',
  LAYER_CHANGE = 'LAYER_CHANGE',
  CITY_CLICK = 'CITY_CLICK',
  ANIMATION_FRAME = 'ANIMATION_FRAME',
  RESET_VIEW = 'RESET_VIEW'
}

export interface HeatmapPoint {
  latitude: number;
  longitude: number;
  intensity: number;
}
