export type ShapeType = 'rect' | 'circle' | 'triangle' | 'star';

export interface LayerTransform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  blur: number;
}

export interface Layer {
  id: string;
  name: string;
  shapeType: ShapeType;
  color: string;
  transform: LayerTransform;
  pathData: string;
  isDeleting?: boolean;
}

export interface DragState {
  isDragging: boolean;
  mode: 'create' | 'move' | 'resize' | null;
  startX: number;
  startY: number;
  targetLayerId: string | null;
  originalTransform: LayerTransform | null;
}

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const MAX_LAYERS = 8;
export const MAX_HISTORY = 10;
