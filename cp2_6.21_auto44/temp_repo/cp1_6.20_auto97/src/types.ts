export type ToolType = 'select' | 'pen' | 'rectangle' | 'diamond' | 'arrow' | 'text' | 'eraser';

export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

export interface BaseShape {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  rotation: number;
  points?: Point[];
  text?: string;
  fontSize?: number;
  opacity: number;
  roughSeed: number;
}

export interface PenShape extends BaseShape {
  type: 'pen';
  points: Point[];
}

export interface RectangleShape extends BaseShape {
  type: 'rectangle';
}

export interface DiamondShape extends BaseShape {
  type: 'diamond';
}

export interface ArrowShape extends BaseShape {
  type: 'arrow';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface TextShape extends BaseShape {
  type: 'text';
  text: string;
  fontSize: number;
}

export type Shape = PenShape | RectangleShape | DiamondShape | ArrowShape | TextShape;

export interface CanvasState {
  shapes: Shape[];
  selectedIds: string[];
  currentTool: ToolType;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  fontSize: number;
  zoom: number;
  offsetX: number;
  offsetY: number;
  isDrawing: boolean;
  isPanning: boolean;
  isDragging: boolean;
  isResizing: boolean;
  dragStart: Point | null;
  currentShape: Shape | null;
  resizeHandle: string | null;
  isSpacePressed: boolean;
}

export type CanvasAction =
  | { type: 'SET_TOOL'; payload: ToolType }
  | { type: 'SET_STROKE_COLOR'; payload: string }
  | { type: 'SET_FILL_COLOR'; payload: string }
  | { type: 'SET_STROKE_WIDTH'; payload: number }
  | { type: 'SET_FONT_SIZE'; payload: number }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'SET_OFFSET'; payload: { x: number; y: number } }
  | { type: 'SET_SELECTED_IDS'; payload: string[] }
  | { type: 'ADD_SHAPE'; payload: Shape }
  | { type: 'UPDATE_SHAPE'; payload: { id: string; updates: Partial<Shape> } }
  | { type: 'DELETE_SHAPES'; payload: string[] }
  | { type: 'SET_IS_DRAWING'; payload: boolean }
  | { type: 'SET_IS_PANNING'; payload: boolean }
  | { type: 'SET_IS_DRAGGING'; payload: boolean }
  | { type: 'SET_IS_RESIZING'; payload: boolean }
  | { type: 'SET_DRAG_START'; payload: Point | null }
  | { type: 'SET_CURRENT_SHAPE'; payload: Shape | null }
  | { type: 'SET_RESIZE_HANDLE'; payload: string | null }
  | { type: 'SET_SPACE_PRESSED'; payload: boolean }
  | { type: 'ALIGN_SHAPES'; payload: 'left' | 'right' | 'top' | 'bottom' | 'centerH' | 'centerV' };
