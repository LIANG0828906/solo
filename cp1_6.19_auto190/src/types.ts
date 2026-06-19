export interface RootNode {
  id: string;
  position: [number, number, number];
  radius: number;
  depth: number;
  isTip: boolean;
  direction: [number, number, number];
  parentId: string | null;
  order: number;
  age: number;
}

export interface NutrientParticle {
  id: string;
  position: [number, number, number];
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  baseOpacity: number;
}

export type SoilType = 'sand' | 'loam' | 'clay';

export interface SimulationParams {
  lightIntensity: number;
  waterContent: number;
  soilType: SoilType;
}

export interface NutrientGrid {
  size: number;
  resolution: number;
  nitrogen: Float32Array;
  phosphorus: Float32Array;
  potassium: Float32Array;
}

export interface TipInfo {
  id: string;
  position: [number, number, number];
  growthSpeed: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  depth: number;
}
