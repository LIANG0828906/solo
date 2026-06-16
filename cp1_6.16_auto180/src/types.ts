export type BuildingModelType = 'villa' | 'office' | 'museum';

export type LightMode = 'sunny' | 'cloudy' | 'dusk' | 'indoor';

export interface BuildingModel {
  id: BuildingModelType;
  name: string;
  wallsColor: string;
  windowsColor: string;
  roofColor: string;
}

export interface LightConfig {
  sunAzimuth: number;
  sunElevation: number;
  mode: LightMode;
}

export interface AnalysisPoint {
  id: string;
  position: { x: number; y: number; z: number };
  illuminance: number;
}

export interface SavedScheme {
  id: string;
  name: string;
  timestamp: number;
  modelId: BuildingModelType;
  cameraPosition: [number, number, number];
  lightConfig: LightConfig;
  analysisPoints: AnalysisPoint[];
}

export interface LightModePreset {
  ambientColor: string;
  ambientIntensity: number;
  directionalColor: string;
  directionalIntensity: number;
  background: string;
  fillColor: string;
  fillIntensity: number;
}

export const BUILDING_MODELS: BuildingModel[] = [
  {
    id: 'villa',
    name: '现代别墅',
    wallsColor: '#E8E0D8',
    windowsColor: '#87CEEB',
    roofColor: '#555555',
  },
  {
    id: 'office',
    name: '高层办公楼',
    wallsColor: '#E8E0D8',
    windowsColor: '#87CEEB',
    roofColor: '#555555',
  },
  {
    id: 'museum',
    name: '博物馆展厅',
    wallsColor: '#E8E0D8',
    windowsColor: '#87CEEB',
    roofColor: '#555555',
  },
];

export const LIGHT_MODE_PRESETS: Record<LightMode, LightModePreset> = {
  sunny: {
    ambientColor: '#E3F2FD',
    ambientIntensity: 0.35,
    directionalColor: '#FFF8E1',
    directionalIntensity: 1.4,
    background: '#1A1A2E',
    fillColor: '#E3F2FD',
    fillIntensity: 0.4,
  },
  cloudy: {
    ambientColor: '#E0E0E0',
    ambientIntensity: 0.75,
    directionalColor: '#E0E0E0',
    directionalIntensity: 0.55,
    background: '#1A1A2E',
    fillColor: '#E0E0E0',
    fillIntensity: 0.4,
  },
  dusk: {
    ambientColor: '#CE93D8',
    ambientIntensity: 0.45,
    directionalColor: '#FFCC80',
    directionalIntensity: 1.1,
    background: '#2D1B3D',
    fillColor: '#CE93D8',
    fillIntensity: 0.35,
  },
  indoor: {
    ambientColor: '#FFF9C4',
    ambientIntensity: 0.85,
    directionalColor: '#FFF9C4',
    directionalIntensity: 0.3,
    background: '#1A1A2E',
    fillColor: '#FFF9C4',
    fillIntensity: 0.5,
  },
};
