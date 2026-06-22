export interface Point {
  x: number;
  y: number;
  jitterX?: number;
  jitterY?: number;
}

export type PathType = 'path';
export type NoteType = 'note';
export type ActionType = PathType | NoteType;

export interface DrawPath {
  id: string;
  type: PathType;
  userId: string;
  color: string;
  thickness: 2 | 5 | 10;
  points: Point[];
  createdAt: number;
  opacity?: number;
  isRemote?: boolean;
  isDrawing?: boolean;
  animationState?: {
    kind: 'appearing' | 'erasing' | 'redrawing' | 'idle';
    progress: number;
    startTime: number;
  };
}

export interface StickyNote {
  id: string;
  type: NoteType;
  userId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  createdAt: number;
  animationState?: {
    kind: 'entering' | 'idle' | 'erasing';
    progress: number;
    startTime: number;
  };
}

export type ActionItem = DrawPath | StickyNote;

export interface BoardState {
  paths: DrawPath[];
  notes: StickyNote[];
}

export type WSMessage =
  | {
      type: 'init';
      state: BoardState;
      yourId: string;
      nickname: string;
      timestamp: number;
    }
  | {
      type: 'user-join';
      userId: string;
      nickname: string;
      userCount: number;
      self?: boolean;
    }
  | { type: 'user-leave'; userId: string; nickname: string; userCount: number }
  | { type: 'draw-start'; path: DrawPath; userId: string }
  | { type: 'draw-point'; pathId: string; point: Point; userId: string }
  | { type: 'draw-end'; pathId: string; userId: string }
  | { type: 'note-add'; note: StickyNote; userId: string }
  | { type: 'note-update'; note: StickyNote; userId: string }
  | {
      type: 'undo';
      userId: string;
      actionId: string;
      actionType: ActionType;
    }
  | {
      type: 'redo';
      userId: string;
      actionId: string;
      actionType: ActionType;
      action: ActionItem;
    }
  | { type: 'clear'; userId: string }
  | { type: 'heartbeat'; timestamp: number };

export interface ToolbarState {
  activeColor: string;
  thickness: 2 | 5 | 10;
  activeTool: 'pen' | 'note';
}

export const PALETTE_COLORS: string[] = [
  '#1e3a8a',
  '#059669',
  '#dc2626',
  '#d97706',
  '#7c3aed',
  '#111827',
];

export const THICKNESS_OPTIONS: (2 | 5 | 10)[] = [2, 5, 10];
