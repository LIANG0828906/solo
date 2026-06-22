export interface DataPoint {
  x: number;
  y: number;
  value: number;
}

export interface TerrainVertex {
  position: [number, number, number];
  color: [number, number, number];
  height: number;
}

export interface TerrainData {
  vertices: TerrainVertex[];
  indices: number[];
  markers: MarkerData[];
  gridSize: { width: number; height: number };
  bounds: { minValue: number; maxValue: number };
}

export interface MarkerData {
  x: number;
  y: number;
  height: number;
  color: [number, number, number];
  value: number;
}

export interface ColorTheme {
  id: string;
  name: string;
  lowColor: string;
  highColor: string;
}

export type PresetType = 'hills' | 'mountains' | 'craters';
