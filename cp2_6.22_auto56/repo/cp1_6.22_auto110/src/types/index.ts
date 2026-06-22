export type BuildingType = 'cube' | 'cylinder' | 'L-shape';

export interface Building {
  id: string;
  type: BuildingType;
  position: { x: number; z: number };
  dimensions: { width: number; depth: number; height: number };
  color: string;
  shadowAreaPercent?: number;
  footprintArea?: number;
}

export interface SunPosition {
  azimuth: number;
  altitude: number;
  color: string;
  lightIntensity: number;
}

export interface ShadowCell {
  x: number;
  z: number;
  shadowValue: number;
}

export interface ShadowGridData {
  resolution: number;
  gridSize: number;
  cells: ShadowCell[];
}

export interface HeatmapStats {
  noShadowPercent: number;
  partialShadowPercent: number;
  fullShadowPercent: number;
}

export interface HeatmapResult {
  svgString: string;
  pieSvgString: string;
  stats: HeatmapStats;
  gridData: ShadowGridData;
}

export type ViewMode = 'perspective' | 'topdown';

export interface AppState {
  currentDate: Date;
  currentTime: { hours: number; minutes: number };
  selectedBuilding: Building | null;
  heatmapVisible: boolean;
  viewMode: ViewMode;
  seasonLabel: string;
}
