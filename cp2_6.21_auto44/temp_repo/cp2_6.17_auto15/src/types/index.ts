export type ToolType = 'brush' | 'rectangle' | 'circle' | 'line' | 'eraser' | 'note';

export interface Point {
  x: number;
  y: number;
}

export interface BaseShape {
  id: string;
  type: ToolType;
  color: string;
  lineWidth: number;
  fillColor?: string;
  createdAt: number;
  userId: string;
}

export interface BrushShape extends BaseShape {
  type: 'brush';
  points: Point[];
}

export interface RectangleShape extends BaseShape {
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CircleShape extends BaseShape {
  type: 'circle';
  x: number;
  y: number;
  radius: number;
}

export interface LineShape extends BaseShape {
  type: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface EraserShape extends BaseShape {
  type: 'eraser';
  points: Point[];
}

export interface NoteShape extends BaseShape {
  type: 'note';
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
}

export type Shape = BrushShape | RectangleShape | CircleShape | LineShape | EraserShape | NoteShape;

export interface ActionRecord {
  id: string;
  shape: Shape;
  timestamp: number;
  userId: string;
  action: 'add' | 'delete' | 'update';
}

export interface HistoryState {
  past: Shape[][];
  future: Shape[][];
  maxHistory: number;
}

export interface ViewTransform {
  offsetX: number;
  offsetY: number;
  scale: number;
}
