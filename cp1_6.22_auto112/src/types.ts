import { ReactNode } from 'react';

export type ShapeType = 'rectangle' | 'circle';
export type ToolType = 'select' | 'rectangle' | 'circle' | 'arrow' | 'text';

export interface Point {
  x: number;
  y: number;
}

export interface Shape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  text: string;
}

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  color: string;
  width: number;
  curvature: number;
  opacity: number;
}

export interface CanvasTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface EditorPosition {
  x: number;
  y: number;
}

export interface AppState {
  shapes: Shape[];
  connections: Connection[];
  selectedTool: ToolType;
  selectedShapeId: string | null;
  selectedConnectionId: string | null;
  transform: CanvasTransform;
  editingShapeId: string | null;
  roomCode: string;
  onlineCount: number;
  isMobile: boolean;
  showMobileMenu: boolean;
  pendingArrowSource: string | null;
  contextMenuConnection: Connection | null;
  copiedTip: boolean;
}

export type AppAction =
  | { type: 'SET_TOOL'; payload: ToolType }
  | { type: 'ADD_SHAPE'; payload: Shape }
  | { type: 'UPDATE_SHAPE'; payload: { id: string; updates: Partial<Shape> } }
  | { type: 'DELETE_SHAPE'; payload: string }
  | { type: 'SELECT_SHAPE'; payload: string | null }
  | { type: 'SELECT_CONNECTION'; payload: string | null }
  | { type: 'ADD_CONNECTION'; payload: Connection }
  | { type: 'DELETE_CONNECTION'; payload: string }
  | { type: 'UPDATE_CONNECTION'; payload: { id: string; updates: Partial<Connection> } }
  | { type: 'SET_TRANSFORM'; payload: CanvasTransform }
  | { type: 'START_EDITING'; payload: string }
  | { type: 'STOP_EDITING' }
  | { type: 'SET_PENDING_ARROW_SOURCE'; payload: string | null }
  | { type: 'SHOW_CONTEXT_MENU'; payload: Connection | null }
  | { type: 'SET_MOBILE_MENU'; payload: boolean }
  | { type: 'SET_COPIED_TIP'; payload: boolean }
  | { type: 'SYNC_STATE'; payload: Partial<AppState> };

export interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  wsBroadcast: (action: AppAction) => void;
}

export interface AppProviderProps {
  children: ReactNode;
}
