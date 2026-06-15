export type ToolType = 'pen' | 'rectangle' | 'circle' | 'text' | 'eraser';

export interface Point {
  x: number;
  y: number;
}

export interface BaseElement {
  id: string;
  type: ToolType;
  color: string;
  strokeWidth: number;
  createdAt: number;
  userId: string;
  userName: string;
  opacity?: number;
}

export interface PenElement extends BaseElement {
  type: 'pen';
  points: Point[];
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
  cx: number;
  cy: number;
  r: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontSize: number;
}

export type BoardElement = PenElement | RectangleElement | CircleElement | TextElement;

export interface UserCursor {
  userId: string;
  userName: string;
  x: number;
  y: number;
  color: string;
}

export interface HistoryState {
  elements: BoardElement[];
}
