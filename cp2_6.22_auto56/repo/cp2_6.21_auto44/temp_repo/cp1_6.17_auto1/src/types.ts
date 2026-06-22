export interface WrinkleStats {
  averageIntensity: number;
  maxIntensity: number;
  maxLocation: { x: number; y: number };
}

export interface GridPoint {
  x: number;
  y: number;
  intensity: number;
  grayscale: number;
  angle: number;
}

export interface TextureResult {
  points: GridPoint[];
  stats: WrinkleStats;
}
