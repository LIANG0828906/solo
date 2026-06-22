export type LayoutType = 'enclosed' | 'row' | 'cluster';

export interface Building {
  id: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
}

export interface SimulationParams {
  layout: LayoutType;
  windAngle: number;
  windSpeed: number;
  solarIntensity: number;
}

export interface WindPoint {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  speed: number;
}

export interface WindField {
  gridSize: number;
  bounds: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number };
  points: WindPoint[];
  streamlines: Streamline[];
}

export interface Streamline {
  id: string;
  points: { x: number; y: number; z: number }[];
  startSpeed: number;
}

export interface TemperatureField {
  gridSize: number;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  temperatures: number[][];
  minTemp: number;
  maxTemp: number;
}

export interface EnvironmentResult {
  windField: WindField;
  temperatureField: TemperatureField;
}

export interface BuildingInfo {
  buildingId: string;
  shadowArea: { x: number; z: number; width: number; depth: number }[];
  avgWindSpeed: number;
  avgSurfaceTemp: number;
}
