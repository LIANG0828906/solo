export type ToolType = 'pen' | 'rectangle' | 'circle' | 'line' | 'text' | 'eraser';

export interface Point {
  x: number;
  y: number;
}

export interface BaseShape {
  id: string;
  type: ToolType;
  color: string;
  thickness: number;
  userId: string;
  timestamp: number;
}

export interface PenShape extends BaseShape {
  type: 'pen';
  points: Point[];
}

export interface RectangleShape extends BaseShape {
  type: 'rectangle';
  start: Point;
  end: Point;
}

export interface CircleShape extends BaseShape {
  type: 'circle';
  center: Point;
  radius: number;
}

export interface LineShape extends BaseShape {
  type: 'line';
  start: Point;
  end: Point;
}

export interface TextShape extends BaseShape {
  type: 'text';
  position: Point;
  text: string;
  fontSize: number;
}

export interface EraserShape extends BaseShape {
  type: 'eraser';
  erasedIds: string[];
}

export type Shape = PenShape | RectangleShape | CircleShape | LineShape | TextShape | EraserShape;

export type ServerMessage =
  | { type: 'init'; shapes: Shape[]; userId: string; onlineUsers: UserInfo[] }
  | { type: 'draw'; shape: Shape }
  | { type: 'undo'; userId: string }
  | { type: 'redo'; userId: string }
  | { type: 'cursor'; userId: string; position: Point | null; color: string }
  | { type: 'user-join'; user: UserInfo }
  | { type: 'user-leave'; userId: string }
  | { type: 'online-users'; users: UserInfo[] };

export type ClientMessage =
  | { type: 'draw'; shape: Shape }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'cursor'; position: Point | null; color: string }
  | { type: 'request-history' };

export interface UserInfo {
  id: string;
  color: string;
  name: string;
}

export interface ToolbarState {
  tool: ToolType;
  color: string;
  thickness: number;
}
