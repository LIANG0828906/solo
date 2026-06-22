export interface PathPoint {
  x: number;
  y: number;
  pressure?: number;
  timestamp: number;
}

export interface DrawPath {
  id: string;
  points: PathPoint[];
  color: string;
  strokeWidth: number;
  smoothPath: string;
}

export interface BrushSettings {
  color: string;
  strokeWidth: 2 | 6 | 12;
}

export interface CanvasTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface InkRegion {
  x: number;
  y: number;
  completed: boolean;
  animated: boolean;
  animating?: boolean;
}

export interface Pigment {
  name: string;
  color: string;
}

export type StrokeWidth = 2 | 6 | 12;

export const PIGMENTS: Pigment[] = [
  { name: '石绿', color: '#4db56a' },
  { name: '朱砂', color: '#c0392b' },
  { name: '石青', color: '#2980b9' },
  { name: '土黄', color: '#d4ac0d' },
  { name: '白色', color: '#ffffff' },
  { name: '黑色', color: '#2c3e50' },
];

export const STROKE_WIDTHS: { label: string; value: StrokeWidth }[] = [
  { label: '细', value: 2 },
  { label: '中', value: 6 },
  { label: '粗', value: 12 },
];

export const CANVAS_WIDTH = 400;
export const CANVAS_HEIGHT = 600;
export const GRID_SIZE = 80;
export const STAMP_SIZE = 150;
export const MIN_SCALE = 0.5;
export const MAX_SCALE = 2.0;
