export interface PointData {
  id: string;
  x: number;
  y: number;
  z: number;
  value: number;
  altitude: number;
}

export interface Marker {
  id: string;
  position: [number, number, number];
  value: number;
  altitude: number;
  coordinates: { lon: number; lat: number };
}

export interface ProfileData {
  id: string;
  startPoint: [number, number, number];
  endPoint: [number, number, number];
  samples: { distance: number; value: number; position: [number, number, number] }[];
}

export type DatasetType = 'temperature' | 'pressure' | 'wind';

export interface Dataset {
  id: string;
  name: string;
  type: DatasetType;
  description: string;
  points: PointData[];
  valueRange: [number, number];
}

export interface ColorMap {
  type: 'gradient' | 'contour';
  stops: { position: number; color: string }[];
}

export const TEMPERATURE_COLOR_MAP: ColorMap = {
  type: 'gradient',
  stops: [
    { position: 0, color: '#0000FF' },
    { position: 0.25, color: '#00BFFF' },
    { position: 0.5, color: '#00FF7F' },
    { position: 0.75, color: '#FFD700' },
    { position: 1, color: '#FF0000' },
  ],
};

export const PRESSURE_COLOR_MAP: ColorMap = {
  type: 'contour',
  stops: [
    { position: 0, color: '#FDE68A' },
    { position: 0.25, color: '#FCD34D' },
    { position: 0.5, color: '#F97316' },
    { position: 0.75, color: '#EA580C' },
    { position: 1, color: '#DC2626' },
  ],
};

export const WIND_COLOR_MAP: ColorMap = {
  type: 'gradient',
  stops: [
    { position: 0, color: '#06B6D4' },
    { position: 0.25, color: '#22D3EE' },
    { position: 0.5, color: '#A78BFA' },
    { position: 0.75, color: '#8B5CF6' },
    { position: 1, color: '#7C3AED' },
  ],
};
