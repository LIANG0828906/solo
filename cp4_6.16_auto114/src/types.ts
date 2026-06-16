export interface BuildingData {
  id: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  color: string;
}

export interface SunPosition {
  dayOfYear: number;
  hour: number;
  azimuth: number;
  altitude: number;
}

export interface ShadowAnalysis {
  buildingId: string;
  timeOfDay: 'morning' | 'noon' | 'afternoon';
  shadowCoverage: number;
}

export interface SolarGrid {
  gridX: number;
  gridZ: number;
  totalSunlightHours: number;
  score: number;
  color: string;
}

export interface BuildingShadowInfo {
  buildingId: string;
  shadowMesh: any;
  coverage: number;
}

export interface AppState {
  buildings: BuildingData[];
  selectedBuildingId: string | null;
  sunPosition: SunPosition;
  isLoading: boolean;
  loadingProgress: number;
  showHeatmap: boolean;
  showSolarAnalysis: boolean;
  solarGridData: SolarGrid[];
  shadowAnalyses: ShadowAnalysis[];
  totalSolarArea: number;
  estimatedEnergy: number;
}

export interface AppActions {
  setBuildings: (buildings: BuildingData[]) => void;
  selectBuilding: (id: string | null) => void;
  setSunPosition: (position: SunPosition) => void;
  setLoading: (loading: boolean, progress?: number) => void;
  setShowHeatmap: (show: boolean) => void;
  setShowSolarAnalysis: (show: boolean) => void;
  setSolarGridData: (data: SolarGrid[]) => void;
  setShadowAnalyses: (analyses: ShadowAnalysis[]) => void;
  setSolarStats: (area: number, energy: number) => void;
  loadBuildingsFromJSON: (file: File) => Promise<void>;
}
