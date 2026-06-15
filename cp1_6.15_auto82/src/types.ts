export type ToolType = 'pen' | 'rectangle' | 'circle' | 'sticky' | 'none';

export interface Point {
  x: number;
  y: number;
}

export interface BaseShape {
  id: string;
  userId: string;
  color: string;
  deleted?: boolean;
}

export interface PenPath extends BaseShape {
  type: 'pen';
  points: Point[];
  thickness: number;
}

export interface Rectangle extends BaseShape {
  type: 'rectangle';
  startPoint: Point;
  endPoint: Point;
  thickness: number;
}

export interface Circle extends BaseShape {
  type: 'circle';
  center: Point;
  radius: number;
  thickness: number;
}

export interface StickyNote extends BaseShape {
  type: 'sticky';
  position: Point;
  text: string;
  width: number;
  height: number;
}

export type Shape = PenPath | Rectangle | Circle | StickyNote;

export interface User {
  id: string;
  nickname: string;
  color: string;
  avatarInitials: string;
}

export type Operation = 
  | { type: 'add'; shape: Shape; prevShape?: Shape }
  | { type: 'update'; shape: Shape; prevShape: Shape }
  | { type: 'delete'; shapeId: string; shape: Shape; prevShape?: Shape }
  | { type: 'undo'; userId: string };

export interface RoomState {
  roomId: string;
  users: Map<string, User>;
  shapes: Shape[];
  history: Operation[];
}
