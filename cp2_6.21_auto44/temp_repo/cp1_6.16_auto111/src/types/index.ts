export interface ColorItem {
  id: string;
  color: string;
}

export type ShapeType = 'circle' | 'triangle' | 'diamond';

export interface Shape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  size: number;
  colorIndex: number;
  isDragging?: boolean;
}

export interface CanvasSize {
  width: number;
  height: number;
}

export const SHAPE_STROKE_COLORS = ['#0A8754', '#6C3483', '#E67E22'];

export const DEFAULT_COLORS = [
  '#FF6B6B',
  '#FF8E72',
  '#FFB07C',
  '#FFD93D',
  '#95E1D3',
  '#6BCB77',
  '#4D96FF',
  '#4ECDC4',
];

export const MIN_COLORS = 4;
export const MAX_COLORS = 12;

export const MIN_CANVAS_WIDTH = 400;
export const MAX_CANVAS_WIDTH = 1920;
export const MIN_CANVAS_HEIGHT = 300;
export const MAX_CANVAS_HEIGHT = 1080;

export const MIN_SHAPE_SIZE = 40;
export const MAX_SHAPE_SIZE = 120;

export const MIN_SHAPES = 8;
export const MAX_SHAPES = 15;

export const SHAPE_GAP = 10;
export const SHAPE_OPACITY = 0.85;
export const STROKE_WIDTH = 1.5;
