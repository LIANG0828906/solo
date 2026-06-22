export type CellType = 'wall' | 'path';

export interface Point {
  x: number;
  y: number;
}

export type MazeGrid = CellType[][];

export type TowerType = 'arrow' | 'cannon' | 'magic';

export interface Tower {
  id: string;
  type: TowerType;
  position: Point;
}

export interface TowerConfig {
  type: TowerType;
  name: string;
  color: string;
  range: number;
}

export interface CoverageArea {
  towerId: string;
  center: Point;
  radius: number;
  color: string;
}

export interface CoverageStats {
  totalPathLength: number;
  coveredPathLength: number;
  coveragePercent: number;
  coveredPoints: Point[];
}

export interface DragState {
  isDragging: boolean;
  towerType: TowerType | null;
  position: { x: number; y: number } | null;
}
