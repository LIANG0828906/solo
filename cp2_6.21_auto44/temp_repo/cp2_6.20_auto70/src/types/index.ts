export type PieceShape = 'rectangle' | 'circle' | 'triangle' | 'hexagon' | 'pentagon' | 'irregular';

export interface CuttingPieceData {
  id: string;
  shape: PieceShape;
  position: { x: number; y: number };
  rotation: number;
  scale: number;
  width: number;
  height: number;
  color: string;
  isColliding: boolean;
  isDragging: boolean;
}

export interface LeatherDefect {
  id: string;
  type: 'scar' | 'porosity' | 'wrinkle';
  position: { x: number; y: number };
  radius: number;
  severity: number;
}

export interface LayoutScheme {
  id: string;
  name: string;
  pieces: CuttingPieceData[];
  utilization: number;
  thumbnail: string;
  createdAt: number;
}

export interface LeatherMaterialConfig {
  baseColor: string;
  secondaryColor: string;
  roughness: number;
  metalness: number;
  normalScale: number;
}

export interface OptimizationProgress {
  currentIteration: number;
  totalIterations: number;
  currentUtilization: number;
  isRunning: boolean;
}

export interface LayoutParams {
  scaleRatio: number;
  rotationAngle: number;
  layoutDensity: number;
}

export interface LayoutState {
  pieces: CuttingPieceData[];
  selectedPieceId: string | null;
  leatherMaterial: LeatherMaterialConfig;
  defects: LeatherDefect[];
  schemes: LayoutScheme[];
  currentSchemeId: string | null;
  showCuttingPath: boolean;
  optimizationProgress: OptimizationProgress;
  utilization: number;
  params: LayoutParams;
  pendingParams: LayoutParams;
  paramsDirty: boolean;
  sceneFadeKey: number;
}

export interface LayoutActions {
  addPiece: (shape: PieceShape) => void;
  removePiece: (id: string) => void;
  updatePiece: (id: string, updates: Partial<CuttingPieceData>) => void;
  selectPiece: (id: string | null) => void;
  setParams: (params: Partial<LayoutParams>) => void;
  applyParams: () => void;
  toggleCuttingPath: () => void;
  runOptimization: () => Promise<void>;
  saveScheme: () => void;
  loadScheme: (id: string) => void;
  deleteScheme: (id: string) => void;
  clearAll: () => void;
  calculateUtilization: () => number;
  setSceneFadeKey: (key: number) => void;
}

export const PIECE_COLORS: Record<PieceShape, string> = {
  rectangle: '#4a9eff',
  circle: '#ff6b9d',
  triangle: '#ffd93d',
  hexagon: '#6bcb77',
  pentagon: '#c084fc',
  irregular: '#fb923c',
};

export const LEATHER_BOUNDS = { width: 4, height: 3 };
export const MAX_PIECES = 30;
export const MAX_SCHEMES = 5;
export const OPTIMIZATION_ITERATIONS = 50;

export const SHAPE_DEFAULTS: Record<PieceShape, { width: number; height: number }> = {
  rectangle: { width: 0.6, height: 0.4 },
  circle: { width: 0.4, height: 0.4 },
  triangle: { width: 0.5, height: 0.45 },
  hexagon: { width: 0.45, height: 0.45 },
  pentagon: { width: 0.45, height: 0.45 },
  irregular: { width: 0.55, height: 0.4 },
};
