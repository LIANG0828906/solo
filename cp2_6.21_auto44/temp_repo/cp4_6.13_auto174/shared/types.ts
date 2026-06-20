export type Tool = 'pen' | 'line' | 'rect' | 'sticky';

export interface Point {
  x: number;
  y: number;
}

export interface BaseElement {
  id: string;
  type: 'path' | 'line' | 'rect' | 'sticky';
  color: string;
  strokeWidth: number;
  timestamp: number;
  seq: number;
  userId: string;
}

export interface PathElement extends BaseElement {
  type: 'path';
  points: Point[];
}

export interface LineElement extends BaseElement {
  type: 'line';
  start: Point;
  end: Point;
}

export interface RectElement extends BaseElement {
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  filled: boolean;
}

export interface StickyElement extends BaseElement {
  type: 'sticky';
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
}

export type WhiteboardElement = PathElement | LineElement | RectElement | StickyElement;

export type OperationType =
  | 'element:add'
  | 'element:update'
  | 'element:delete'
  | 'canvas:clear'
  | 'sticky:move'
  | 'sticky:text'
  | 'draw:path'
  | 'draw:point';

export interface Operation {
  id: string;
  type: OperationType;
  roomId: string;
  userId: string;
  timestamp: number;
  seq: number;
  payload: any;
}

export interface User {
  id: string;
  name: string;
  color: string;
}

export interface RoomState {
  id: string;
  users: Map<string, User>;
  elements: WhiteboardElement[];
  operations: Operation[];
  nextSeq: number;
}
