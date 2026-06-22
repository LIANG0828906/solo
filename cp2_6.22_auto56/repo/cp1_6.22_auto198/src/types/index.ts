export interface EarthquakeEvent {
  id: string;
  magnitude: number;
  latitude: number;
  longitude: number;
  depth: number;
  time: number;
  nearestCity: string;
}

export interface FilterParams {
  timeRange: '7d' | '30d' | 'all';
  magnitudeMin: number;
  magnitudeMax: number;
  showPlateBoundaries: boolean;
}

export interface PlateBoundary {
  name: string;
  coordinates: [number, number][];
}

export interface StatsData {
  total: number;
  maxMagnitude: number;
  distribution: {
    '4-5': number;
    '5-6': number;
    '6-7': number;
    '7+': number;
  };
}
