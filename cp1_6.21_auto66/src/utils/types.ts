export type BrickType = '1x1' | '1x2' | '2x2' | '2x4' | '1x3' | '2x3';

export interface BrickSize {
  width: number;
  depth: number;
  height: number;
}

export interface GridPosition {
  x: number;
  y: number;
  z: number;
}

export interface Brick {
  id: string;
  type: BrickType;
  position: GridPosition;
  color: string;
  size: BrickSize;
  glowPhase?: number;
  glowPeriod?: number;
}

export type HistoryAction = 'ADD' | 'REMOVE';

export interface HistoryEntry {
  action: HistoryAction;
  brick: Brick;
}

export interface HistoryState {
  past: HistoryEntry[];
  future: HistoryEntry[];
  maxHistory: number;
}

export interface SceneState {
  cameraPosition: { x: number; y: number; z: number };
  cameraTarget: { x: number; y: number; z: number };
  gridSize: number;
  backgroundColor: string;
}

export interface PreviewState {
  isActive: boolean;
  rotationAngle: number;
  rotationSpeed: number;
  zoomLevel: number;
}

export interface PartsListItem {
  type: BrickType;
  color: string;
  colorName: string;
  count: number;
}

export interface ColorItem {
  value: string;
  name: string;
}

export interface DragState {
  isDragging: boolean;
  brickType: BrickType | null;
  color: string | null;
  position: { x: number; y: number; z: number } | null;
  gridPosition: GridPosition | null;
  isValidPosition: boolean;
  showReject: boolean;
}
