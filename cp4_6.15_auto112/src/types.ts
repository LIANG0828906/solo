export interface GeoLocation {
  latitude: number;
  longitude: number;
  cityName?: string;
}

export interface BuildingModel {
  id: string;
  name: string;
  modelType: 'skyscraper' | 'villa' | 'complex' | 'custom';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  shadowColor: string;
  isSelected: boolean;
}

export interface SunPosition {
  azimuth: number;
  altitude: number;
  directionVector: [number, number, number];
}

export interface HeatmapSample {
  x: number;
  z: number;
  sunlightHours: number;
  shadowCount: number;
  isShadowedBy: string[];
}

export interface ShadowAnalysisResult {
  samples: HeatmapSample[][];
  totalSamplePoints: number;
  avgSunlightHours: number;
  shadowCoveragePercent: number;
  overlapPercent?: number;
  maxSunlightHours: number;
  minSunlightHours: number;
  isComputing: boolean;
  progress: number;
}

export interface SceneConfig {
  date: number;
  time: number;
  location: GeoLocation;
  isPlaying: boolean;
  playSpeed: 1 | 2 | 4;
  showHeatmap: boolean;
  isCloudy: boolean;
  gridSize: number;
  sampleResolution: number;
}

export interface AppState {
  config: SceneConfig;
  buildings: BuildingModel[];
  analysisResult: ShadowAnalysisResult | null;
  selectedBuildingId: string | null;
  activePanelTab: 'control' | 'analysis';
  isMobileDrawerOpen: boolean;
}

export interface AppActions {
  setConfig: (config: Partial<SceneConfig>) => void;
  addBuilding: (building: BuildingModel) => void;
  removeBuilding: (id: string) => void;
  updateBuilding: (id: string, updates: Partial<BuildingModel>) => void;
  selectBuilding: (id: string | null) => void;
  setAnalysisResult: (result: ShadowAnalysisResult | null) => void;
  setAnalysisProgress: (progress: number) => void;
  setActivePanelTab: (tab: 'control' | 'analysis') => void;
  toggleMobileDrawer: () => void;
  startPlayback: () => void;
  pausePlayback: () => void;
  resetPlayback: () => void;
  runAnalysis: () => void;
}
