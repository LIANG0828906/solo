export type NoiseType = 'white' | 'pink' | 'brown';

export interface BuildingData {
  id: number;
  gridX: number;
  gridZ: number;
  position: [number, number, number];
  size: [number, number, number];
  baseHeight: number;
  targetHeight: number;
  color: string;
  baseColor: string;
  selected: boolean;
  hovered: boolean;
}

export interface CityConfig {
  gridSize: number;
  density: number;
  heightScale: number;
  colorContrast: number;
  noiseType: NoiseType;
}

export interface SliderConfig {
  key: keyof Pick<CityConfig, 'density' | 'heightScale' | 'colorContrast'>;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
  unit: string;
  format: (v: number) => string;
}

export interface NoiseButtonConfig {
  key: NoiseType;
  label: string;
  description: string;
}

export interface UIConfig {
  panelWidth: { desktop: number; mobile: number };
  breakpoint: number;
  sliders: SliderConfig[];
  noiseButtons: NoiseButtonConfig[];
  colorPalette: {
    background: string;
    panelBg: string;
    accent: string;
    selected: string;
    highlight: string;
    textPrimary: string;
    textSecondary: string;
    sliderTrack: string;
    buttonBg: string;
    buttonHover: string;
    buttonActive: string;
    buildingColors: string[];
  };
  animation: {
    transitionDuration: number;
    easeOutCubic: (t: number) => number;
  };
  camera: {
    initialPosition: [number, number, number];
    rotateSpeed: number;
    minDistance: number;
    maxDistance: number;
    panSpeed: number;
  };
}

export interface TooltipData {
  id: number;
  height: number;
  color: string;
  x: number;
  y: number;
}
