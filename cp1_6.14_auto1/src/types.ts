export type ShapeType = 'rect' | 'circle' | 'line';
export type ToolType = 'select' | 'rect' | 'circle' | 'line' | 'sticky' | 'undo';

export interface Point {
  x: number;
  y: number;
}

export interface BaseShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  rotation: number;
  stroke: string;
  strokeWidth: number;
  fill?: string;
  creatorId: string;
  creatorColor: string;
}

export interface RectShape extends BaseShape {
  type: 'rect';
  width: number;
  height: number;
}

export interface CircleShape extends BaseShape {
  type: 'circle';
  radius: number;
}

export interface LineShape extends BaseShape {
  type: 'line';
  points: number[];
}

export type Shape = RectShape | CircleShape | LineShape;

export interface StickyNote {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  creatorId: string;
  creatorColor: string;
}

export interface User {
  id: string;
  color: string;
  name: string;
}

export interface RoomState {
  shapes: Shape[];
  stickyNotes: StickyNote[];
  users: User[];
}

export type ServerAction =
  | { type: 'shape:add'; shape: Shape }
  | { type: 'shape:update'; shape: Shape }
  | { type: 'shape:delete'; shapeId: string }
  | { type: 'sticky:add'; sticky: StickyNote }
  | { type: 'sticky:update'; sticky: StickyNote }
  | { type: 'sticky:delete'; stickyId: string }
  | { type: 'user:join'; user: User }
  | { type: 'user:leave'; userId: string };
