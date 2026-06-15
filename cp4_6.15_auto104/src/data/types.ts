export interface StormPathPoint {
  lat: number;
  lon: number;
  windSpeed: number;
  pressure: number;
  timestamp: string;
}

export interface StormRecord {
  id: string;
  name: string;
  year: number;
  basin: string;
  category: number;
  maxWind: number;
  minPressure: number;
  landfall: string;
  path: StormPathPoint[];
}

export interface FilterState {
  yearRange: [number, number];
  category: number | null;
  basin: string | null;
}
