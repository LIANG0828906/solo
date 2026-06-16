export type ToolType = 'select' | 'pencil' | 'rectangle' | 'stickyNote' | 'eraser';

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

export type ElementType = 'pencil' | 'rectangle' | 'stickyNote';

export interface Point {
  x: number;
  y: number;
}

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  color: string;
  createdAt: number;
  updatedAt: number;
  sequence: number;
  isDeleted?: boolean;
  deleteAnimationProgress?: number;
  enterAnimationProgress?: number;
  undoAnimationProgress?: number;
}

export interface PencilElement extends BaseElement {
  type: 'pencil';
  points: Point[];
  lineWidth: number;
}

export interface RectangleElement extends BaseElement {
  type: 'rectangle';
  width: number;
  height: number;
  filled: boolean;
  lineWidth: number;
}

export interface StickyNoteElement extends BaseElement {
  type: 'stickyNote';
  width: number;
  height: number;
  text: string;
  isNew?: boolean;
}

export type CanvasElement = PencilElement | RectangleElement | StickyNoteElement;

export type OperationType = 'add' | 'update' | 'delete' | 'snapshot' | 'undo' | 'redo';

export interface CanvasOperation {
  type: OperationType;
  id: string;
  payload: CanvasElement | CanvasElement[];
  timestamp: number;
  clientId: string;
  sequence?: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8',
  '#F7DC6F',
  '#BB8FCE',
  '#85C1E9',
  '#F8B500',
  '#2C3E50',
];

export const STICKY_NOTE_COLOR = 'rgba(255, 255, 0, 0.85)';
export const STICKY_NOTE_BG = '#FFF9C4';
export const STICKY_NOTE_HEADER = 'rgba(0, 0, 0, 0.06)';
export const CANVAS_BG = '#F5F0E8';
export const SELECTION_COLOR = '#4A90D9';
export const SELECTION_FILL = 'rgba(74, 144, 217, 0.12)';
