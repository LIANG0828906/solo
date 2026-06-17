export type Tool = 'pen' | 'eraser';

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  points: Point[];
  color: string;
  width: number;
  isEraser: boolean;
}

export interface StickyNote {
  id: string;
  x: number;
  y: number;
  text: string;
  width: number;
  height: number;
}

export interface Connection {
  id: string;
  fromNoteId: string;
  toNoteId: string;
  curvature: number;
}

export interface Transform {
  x: number;
  y: number;
  scale: number;
}

export interface AppState {
  strokes: Stroke[];
  notes: StickyNote[];
  connections: Connection[];
  currentTool: Tool;
  currentColor: string;
  currentWidth: number;
  transform: Transform;
  selectedNoteId: string | null;
  connectionStartId: string | null;
  isSyncConnected: boolean;
}

export type Action =
  | { type: 'SET_TOOL'; payload: Tool }
  | { type: 'SET_COLOR'; payload: string }
  | { type: 'SET_WIDTH'; payload: number }
  | { type: 'ADD_STROKE'; payload: Stroke }
  | { type: 'UPDATE_STROKE'; payload: Stroke }
  | { type: 'ADD_NOTE'; payload: StickyNote }
  | { type: 'UPDATE_NOTE'; payload: StickyNote }
  | { type: 'DELETE_NOTE'; payload: string }
  | { type: 'ADD_CONNECTION'; payload: Connection }
  | { type: 'SET_TRANSFORM'; payload: Transform }
  | { type: 'SELECT_NOTE'; payload: string | null }
  | { type: 'SET_CONNECTION_START'; payload: string | null }
  | { type: 'CLEAR_CANVAS' }
  | { type: 'SET_SYNC_CONNECTED'; payload: boolean }
  | { type: 'SYNC_STATE'; payload: Partial<AppState> };
