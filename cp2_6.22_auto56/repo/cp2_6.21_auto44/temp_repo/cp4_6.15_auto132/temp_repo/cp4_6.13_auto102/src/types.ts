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
  version: number;
  operationId: string;
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
  | { type: 'init'; shapes: Shape[]; userId: string; onlineUsers: UserInfo[]; version: number }
  | { type: 'draw'; shape: Shape; version: number }
  | { type: 'undo'; userId: string; operationId: string; shapeId: string; version: number }
  | { type: 'redo'; userId: string; operationId: string; shapeId: string; version: number; shape: Shape }
  | { type: 'cursor'; userId: string; position: Point | null; color: string }
  | { type: 'user-join'; user: UserInfo }
  | { type: 'user-leave'; userId: string }
  | { type: 'online-users'; users: UserInfo[] }
  | { type: 'sync-error'; expectedVersion: number; actualVersion: number; message: string };

export type ClientMessage =
  | { type: 'draw'; shape: Shape; lastKnownVersion: number }
  | { type: 'undo'; lastKnownVersion: number }
  | { type: 'redo'; lastKnownVersion: number }
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

export interface DirtyRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
