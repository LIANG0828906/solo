export const USER_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#FFD93D',
  '#6BCB77',
  '#9B59B6',
] as const;

export type UserColor = (typeof USER_COLORS)[number];

export type ToolType =
  | 'brush'
  | 'rectangle'
  | 'circle'
  | 'polygon'
  | 'text'
  | 'image'
  | 'select';

export interface BaseElement {
  id: string;
  type: 'path' | 'rectangle' | 'circle' | 'polygon' | 'text' | 'image';
  userId: string;
  color: string;
  createdAt: number;
  updatedAt: number;
}

export interface PathElement extends BaseElement {
  type: 'path';
  points: { x: number; y: number }[];
  width: number;
}

export interface RectangleElement extends BaseElement {
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius: number;
  borderWidth: number;
}

export interface CircleElement extends BaseElement {
  type: 'circle';
  cx: number;
  cy: number;
  radiusX: number;
  radiusY: number;
  borderWidth: number;
}

export interface PolygonElement extends BaseElement {
  type: 'polygon';
  cx: number;
  cy: number;
  radius: number;
  sides: number;
  rotation: number;
  borderWidth: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  x: number;
  y: number;
  content: string;
  fontSize: number;
  bgColor: string;
  width?: number;
  height?: number;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
  originalWidth: number;
  originalHeight: number;
}

export type WhiteboardElement =
  | PathElement
  | RectangleElement
  | CircleElement
  | PolygonElement
  | TextElement
  | ImageElement;

export interface Collaborator {
  id: string;
  name: string;
  color: string;
  cursorX: number;
  cursorY: number;
  lastActive: number;
  isLocal?: boolean;
}

export type CollabEventType =
  | 'element_add'
  | 'element_update'
  | 'element_delete'
  | 'cursor_move'
  | 'user_join'
  | 'user_leave'
  | 'undo'
  | 'redo'
  | 'history_load';

export interface CollabEvent {
  type: CollabEventType;
  userId: string;
  roomId: string;
  timestamp: number;
  payload: any;
}

export interface HistorySnapshot {
  elements: WhiteboardElement[];
  timestamp: number;
}

export type ReplayState = {
  isPlaying: boolean;
  currentStep: number;
  totalSteps: number;
  highlightedElementId: string | null;
};

export const DEFAULT_ROOM_ID = 'room-001';
export const MAX_HISTORY_DEPTH = 50;
export const REPLAY_STEP_INTERVAL = 300;
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const MAX_IMAGE_DISPLAY_WIDTH = 400;
