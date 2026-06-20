export interface Vertex {
  id: string;
  x: number;
  y: number;
  color: string;
  strokeColor: string;
  scale: number;
  isDeleting: boolean;
}

export interface PolygonStyles {
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  vertexRadius: number;
  vertexStrokeWidth: number;
}

export const CANVAS_WIDTH = 1000;
export const CANVAS_HEIGHT = 700;
export const GRID_SPACING = 20;
export const DEFAULT_VERTEX_COLOR = '#3498db';
export const DEFAULT_STROKE_COLOR = '#2980b9';
export const VERTEX_RADIUS = 5;
export const VERTEX_HOVER_RADIUS = 7;
export const APPEAR_ANIMATION_DURATION = 200;
export const DELETE_ANIMATION_DURATION = 150;
