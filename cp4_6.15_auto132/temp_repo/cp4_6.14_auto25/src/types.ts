export type ToolType = 'brush' | 'rectangle' | 'circle' | 'text';

export interface BaseElement {
  id: string;
  type: ToolType;
  color: string;
  strokeWidth: number;
  userId?: string;
  userColor?: string;
  createdAt: number;
}

export interface BrushElement extends BaseElement {
  type: 'brush';
  points: { x: number; y: number }[];
}

export interface RectangleElement extends BaseElement {
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CircleElement extends BaseElement {
  type: 'circle';
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontSize: number;
}

export type CanvasElement = BrushElement | RectangleElement | CircleElement | TextElement;

export interface HistoryState {
  past: CanvasElement[][];
  present: CanvasElement[];
  future: CanvasElement[][];
  maxHistory: number;
}

export interface ToolbarState {
  tool: ToolType;
  color: string;
  strokeWidth: number;
}
