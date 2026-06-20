export interface OceanDataPoint {
  longitude: number;
  latitude: number;
  depth: number;
  temperature: number;
  salinity: number;
  velocity: number;
  velocityDir: number;
  timePoint?: string;
}

export interface GridCell {
  temperature: number;
  salinity: number;
  velocity: number;
  velocityDir: number;
}

export interface DepthLayer {
  depth: number;
  grid: GridCell[][];
}

export interface OceanDataset {
  layers: DepthLayer[];
  timePoints: string[];
  currentTimeIndex: number;
  longitudeRange: [number, number];
  latitudeRange: [number, number];
}

export type ColorScheme = 'thermal' | 'cool' | 'monochrome';

export interface VisualizerConfig {
  visibleLayers: boolean[];
  velocityScale: number;
  colorScheme: ColorScheme;
  autoRotate: boolean;
  showParticles: boolean;
}

export interface WorkerMessage {
  type: 'parse' | 'updateColorScheme' | 'ping';
  payload?: any;
}

export interface WorkerResult {
  type: 'parseComplete' | 'colorSchemeUpdate' | 'pong';
  payload?: any;
  error?: string;
}

export const DEPTH_LEVELS = [0, 200, 500, 1000, 2000, 4000];
export const DEPTH_Y_POSITIONS = [200, 150, 100, 50, 0, -50];
export const GRID_SIZE = 10;
export const PARTICLE_COUNT = 2000;
export const TEMP_MIN = -2;
export const TEMP_MAX = 30;
export const BAR_MAX_HEIGHT = 100;
