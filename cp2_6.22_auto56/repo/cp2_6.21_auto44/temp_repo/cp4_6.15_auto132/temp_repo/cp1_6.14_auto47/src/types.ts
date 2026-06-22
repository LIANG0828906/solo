export type BuildingShape = 'box' | 'cylinder' | 'pyramid';

export type ClimateMode = 'sunny' | 'cloudy' | 'dusk';

export interface Building {
  id: string;
  shape: BuildingShape;
  position: [number, number, number];
  height: number;
  width: number;
  depth: number;
  isAnimating?: boolean;
  isDragging?: boolean;
}

export interface ClimateParams {
  name: string;
  mode: ClimateMode;
  ambientIntensity: number;
  directionalIntensity: number;
  lightColor: string;
  ambientColor: string;
  sunPosition: [number, number, number];
  shadowBlur: number;
}

export interface PresetData {
  id: string;
  name: string;
  buildings: Omit<Building, 'id'>[];
  cameraPosition: [number, number, number];
  terrainHeight: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}
