export interface Hypocenter {
  x: number;
  y: number;
  z: number;
}

export interface GeologicLayerConfig {
  name: string;
  thickness: number;
  baseColor: string;
  opacity: number;
  baseDensity: number;
}

export interface GeologicLayersState {
  layers: GeologicLayerConfig[];
  showGrid: boolean;
  gridOpacity: number;
}

export interface SceneState {
  hypocenter: Hypocenter;
  magnitude: number;
  density: number;
  elasticity: number;
  isPlaying: boolean;
  currentTime: number;
  geologicLayers: GeologicLayersState;
}

export interface SceneActions {
  setHypocenter: (hypo: Partial<Hypocenter>) => void;
  setMagnitude: (magnitude: number) => void;
  setDensity: (density: number) => void;
  setElasticity: (elasticity: number) => void;
  setPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  resetSimulation: () => void;
  setStateFromUrl: (state: Partial<SceneState>) => void;
  setGeologicLayer: (index: number, config: Partial<GeologicLayerConfig>) => void;
  setShowGrid: (show: boolean) => void;
  setGridOpacity: (opacity: number) => void;
  resetGeologicLayers: () => void;
}

export interface Reflection {
  position: [number, number, number];
  normal: [number, number, number];
  time: number;
}

export interface Refraction {
  position: [number, number, number];
  direction: [number, number, number];
  angle: number;
  time: number;
}

export interface WaveData {
  pWaveRadius: number;
  sWaveRadius: number;
  surfaceWaveRadius: number;
  pWaveSpeed: number;
  sWaveSpeed: number;
  surfaceWaveSpeed: number;
  reflections: Reflection[];
  refractions: Refraction[];
}

export interface GeologicLayer {
  name: string;
  yMin: number;
  yMax: number;
  baseColor: string;
  baseDensity: number;
}

export const GEOLOGIC_LAYERS: GeologicLayer[] = [
  { name: '地壳', yMin: -5, yMax: -1.67, baseColor: '#8B7355', baseDensity: 2700 },
  { name: '地幔', yMin: -1.67, yMax: 1.66, baseColor: '#D2B48C', baseDensity: 4500 },
  { name: '地核', yMin: 1.66, yMax: 5, baseColor: '#FFD700', baseDensity: 13000 },
];

export const DEFAULT_GEOLOGIC_LAYERS: GeologicLayersState = {
  layers: [
    { name: '表土层', thickness: 1.5, baseColor: '#8B7355', opacity: 0.75, baseDensity: 2000 },
    { name: '沉积岩层', thickness: 3.0, baseColor: '#A0522D', opacity: 0.65, baseDensity: 2500 },
    { name: '基岩层', thickness: 5.5, baseColor: '#696969', opacity: 0.55, baseDensity: 3000 },
  ],
  showGrid: true,
  gridOpacity: 0.3,
};

export const ANIMATION_DURATION = 5;

export const DEFAULT_STATE: SceneState = {
  hypocenter: { x: 0, y: 0, z: 0 },
  magnitude: 5,
  density: 2700,
  elasticity: 10,
  isPlaying: false,
  currentTime: 0,
  geologicLayers: DEFAULT_GEOLOGIC_LAYERS,
};

export interface SliderConfig {
  min: number;
  max: number;
  step: number;
  label: string;
  unit: string;
}

export const SLIDER_CONFIGS: Record<string, SliderConfig> = {
  hypocenterX: { min: -5, max: 5, step: 0.1, label: '震源 X', unit: '' },
  hypocenterY: { min: -5, max: 5, step: 0.1, label: '震源 Y', unit: '' },
  hypocenterZ: { min: -5, max: 5, step: 0.1, label: '震源 Z', unit: '' },
  magnitude: { min: 1, max: 9, step: 0.1, label: '震级', unit: '' },
  density: { min: 1000, max: 5000, step: 10, label: '介质密度', unit: 'kg/m³' },
  elasticity: { min: 1, max: 20, step: 0.1, label: '弹性模量', unit: 'GPa' },
};
