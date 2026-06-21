export interface Point {
  x: number;
  y: number;
}

export interface DrawPath {
  id: string;
  userId: string;
  points: Point[];
  color: string;
  size: number;
  isEraser: boolean;
}

export interface User {
  id: string;
  name: string;
  roomId: string;
  socketId: string;
}

export interface RoomState {
  id: string;
  users: User[];
  snapshot: string | null;
  lastSnapshotTime: number;
}

export type ToolType = 'pen' | 'eraser';

export interface ToolSettings {
  type: ToolType;
  color: string;
  size: number;
}

export interface ServerToClientEvents {
  'draw:path': (path: DrawPath) => void;
  'canvas:clear': () => void;
  'canvas:snapshot': (dataUrl: string) => void;
  'room:users': (users: User[]) => void;
  'snapshot:saved': (timestamp: number) => void;
}

export interface ClientToServerEvents {
  'room:join': (data: { roomId: string; userName: string }, callback: (users: User[]) => void) => void;
  'room:leave': () => void;
  'draw:path': (path: DrawPath) => void;
  'canvas:clear': () => void;
  'canvas:saveSnapshot': () => void;
}
