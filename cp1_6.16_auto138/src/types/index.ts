export interface Point2D {
  x: number;
  y: number;
}

export interface HallConfig {
  width: number;
  height: number;
  gridSize: number;
  backgroundColor: string;
}

export interface Showcase {
  id: string;
  position: Point2D;
  width: number;
  depth: number;
  rotation: number;
  color: string;
}

export type ExhibitType = 'sculpture' | 'painting' | 'jewelry';

export interface ExhibitLighting {
  type: ExhibitType;
  minLux: number;
  maxLux: number;
  recommended: number;
}

export interface Exhibit {
  id: string;
  showcaseId: string;
  type: ExhibitType;
  position: Point2D;
  height: number;
  facing: Point2D;
  icon: string;
  color: string;
}

export interface VisitorStart {
  id: string;
  position: Point2D;
  radius: number;
}

export interface PathPoint {
  position: Point2D;
  timestamp: number;
  gazeDirection: Point2D;
  dwellTime: number;
}

export interface VisitorPath {
  id: string;
  points: PathPoint[];
  targetShowcaseId: string;
  duration: number;
}

export interface HeatmapPoint {
  position: Point2D;
  intensity: number;
  dwellTime: number;
}

export interface ExhibitStats {
  exhibitId: string;
  totalGazes: number;
  avgGazeDuration: number;
  occlusionRate: number;
}

export interface Scene {
  id: string;
  name: string;
  hall: HallConfig;
  showcases: Showcase[];
  exhibits: Exhibit[];
  visitorStarts: VisitorStart[];
  paths: VisitorPath[];
  heatmapData: HeatmapPoint[];
  createdAt: string;
  updatedAt: string;
}

export interface GridNode {
  x: number;
  y: number;
  walkable: boolean;
  g: number;
  h: number;
  f: number;
  parent: GridNode | null;
}

export interface ImportResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

export type ToolMode = 'select' | 'addShowcase' | 'addStart' | 'addExhibit' | 'simulate';
