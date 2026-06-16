export interface YearlyAQI {
  year: number;
  aqi: number;
}

export interface CityAQI {
  id: string;
  city: string;
  lat: number;
  lng: number;
  yearlyData: YearlyAQI[];
}

export type ViewMode = 'bars' | 'heatmap';

export interface PerspectivePreset {
  name: string;
  position: [number, number, number];
  target: [number, number, number];
}
