export interface Point {
  x: number;
  y: number;
  pressure: number;
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
  width: number;
  height: number;
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

export interface GridSnapResult {
  snappedX: number;
  snappedY: number;
  offsetX: number;
  offsetY: number;
  distance: number;
  snapped: boolean;
}

export interface DragSnapState {
  targetId: string;
  targetType: 'sticky' | 'image';
  startX: number;
  startY: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export interface SpringAnimState {
  id: string;
  type: 'snap' | 'delete';
  progress: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  scaleFrom: number;
  scaleTo: number;
  opacityFrom: number;
  opacityTo: number;
  velocity: number;
  startTimestamp: number;
}

export const GRID_SIZE = 50;
export const SNAP_DISTANCE = 10;
export const ANIM_DURATION_SNAP = 150;
export const ANIM_DURATION_DELETE = 200;
export const SPRING_STIFFNESS = 420;
export const SPRING_DAMPING = 28;
export const MAX_FPS = 60;
export const PLAYBACK_MIN_FPS = 30;
export const COLORS = [
  '#000000', '#FFFFFF', '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#14B8A6', '#3B82F6', '#6366F1', '#A855F7', '#EC4899', '#78716C',
];
