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

export interface TextItem {
  id: string;
  userId: string;
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
}

export type HistoryAction =
  | { type: 'draw'; data: DrawPath }
  | { type: 'text-add'; data: TextItem }
  | { type: 'text-move'; data: { id: string; fromX: number; fromY: number; toX: number; toY: number } }
  | { type: 'text-delete'; data: TextItem };

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

export type ToolType = 'pen' | 'eraser' | 'text';

export interface ToolSettings {
  type: ToolType;
  color: string;
  size: number;
}

export interface ServerToClientEvents {
  'draw:path': (path: DrawPath) => void;
  'text:add': (text: TextItem) => void;
  'text:move': (data: { id: string; x: number; y: number; userId: string }) => void;
  'text:delete': (data: { id: string; userId: string }) => void;
  'canvas:clear': () => void;
  'canvas:snapshot': (dataUrl: string) => void;
  'room:users': (users: User[]) => void;
  'snapshot:saved': (timestamp: number) => void;
  'canvas:requestSnapshot': () => void;
}

export interface ClientToServerEvents {
  'room:join': (data: { roomId: string; userName: string }, callback: (users: User[]) => void) => void;
  'room:leave': () => void;
  'draw:path': (path: DrawPath) => void;
  'text:add': (text: TextItem) => void;
  'text:move': (data: { id: string; x: number; y: number; userId: string }) => void;
  'text:delete': (data: { id: string; userId: string }) => void;
  'canvas:clear': () => void;
  'canvas:saveSnapshot': (dataUrl: string) => void;
}
