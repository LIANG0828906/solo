export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  points: Point[];
  color: string;
  width: number;
  tool: 'pen' | 'eraser';
}

export interface StickyNote {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
}

export interface BoardImage {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
  originalName: string;
}

export interface BoardState {
  strokes: Stroke[];
  stickies: StickyNote[];
  images: BoardImage[];
}

export type ToolMode = 'pen' | 'eraser' | 'sticky' | 'image';

export type OperationType =
  | 'draw'
  | 'erase'
  | 'addSticky'
  | 'moveSticky'
  | 'updateStickyText'
  | 'deleteSticky'
  | 'addImage'
  | 'moveImage'
  | 'deleteImage';

export interface RecordedAction {
  timestamp: number;
  type: OperationType;
  params: Record<string, unknown>;
}

export interface WSMessage {
  type: 'init' | 'operation' | 'user_join' | 'user_leave';
  userId?: string;
  sessionId?: string;
  state?: BoardState;
  operation?: OperationType;
  params?: Record<string, unknown>;
}

export interface OnlineUser {
  id: string;
  name: string;
  color: string;
}

export const GRID_SIZE = 50;
export const SNAP_DISTANCE = 10;
export const COLORS = [
  '#000000', '#FFFFFF', '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#14B8A6', '#3B82F6', '#6366F1', '#A855F7', '#EC4899', '#78716C',
];
