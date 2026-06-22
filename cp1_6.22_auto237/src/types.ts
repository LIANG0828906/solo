export interface City {
  id: string;
  name: string;
  lat: number;
  lng: number;
  position: { x: number; z: number };
}

export type DataCategory = 'temperature' | 'precipitation' | 'windSpeed';

export interface MonthData {
  month: number;
  year: number;
  temperature: number;
  precipitation: number;
  windSpeed: number;
}

export interface CityYearData {
  cityId: string;
  year: number;
  months: MonthData[];
}

export interface VisualConfig {
  category: DataCategory;
  selectedCities: string[];
  yearRange: [number, number];
  isPlaying: boolean;
  autoRotate: boolean;
  selectedCityId: string | null;
  animationMonth: number;
}

export interface ValueMapping {
  min: number;
  max: number;
  heightMin: number;
  heightMax: number;
  colorStart: string;
  colorEnd: string;
  unit: string;
}

export interface Stats {
  mean: number;
  max: number;
  min: number;
  maxMonth: number;
  minMonth: number;
}

export interface BarInstanceData {
  cityId: string;
  month: number;
  value: number;
  baseHeight: number;
  targetHeight: number;
  currentHeight: number;
  color: string;
  targetColor: string;
  x: number;
  z: number;
}

export type CameraPreset = 'front' | 'top45' | 'side' | 'birdseye';

export interface CameraPosition {
  x: number;
  y: number;
  z: number;
}
