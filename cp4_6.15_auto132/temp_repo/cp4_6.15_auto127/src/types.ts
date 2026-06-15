export enum ArtifactCategory {
  BRONZE = 'bronze',
  POTTERY = 'pottery',
  JADE = 'jade',
}

export enum LightingMode {
  DAYLIGHT = 'daylight',
  MUSEUM = 'museum',
  MOONLIGHT = 'moonlight',
}

export enum DisplayMode {
  SINGLE = 'single',
  ROAMING = 'roaming',
}

export type AnnotationType = 'inscription' | 'crack' | 'repair' | 'texture';

export interface AnnotationPoint {
  id: string;
  position: [number, number, number];
  title: string;
  description: string;
  type: AnnotationType;
}

export interface Artifact {
  id: string;
  name: string;
  category: ArtifactCategory;
  era: string;
  year: number;
  material: string;
  description: string;
  modelUrl: string;
  scale: number;
  position: [number, number, number];
  pedestalIndex: number;
  annotations: AnnotationPoint[];
  geometryType: 'ding' | 'zun' | 'jue' | 'hu' | 'amphora' | 'kylix' | 'hydria' | 'mask' | 'pendant' | 'figure';
  baseColor: string;
}

export interface LightingPreset {
  mode: LightingMode;
  name: string;
  icon: string;
  ambientIntensity: number;
  directionalIntensity: number;
  directionalPosition: [number, number, number];
  directionalColor: string;
  ambientColor: string;
  fogColor: string;
  fogDensity: number;
  spotIntensity: number;
  background: string;
}

export interface Pedestal {
  id: number;
  position: [number, number, number];
  artifactIds: string[];
}

export interface AppState {
  selectedArtifactId: string | null;
  selectedForCompare: string[];
  isCompareMode: boolean;
  lightingMode: LightingMode;
  displayMode: DisplayMode;
  isRoamingPaused: boolean;
  weatheringSlider: number;
  hoveredArtifactId: string | null;
  activeAnnotationId: string | null;
}
