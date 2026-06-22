export type ToolType = 'brush' | 'sticky' | 'line' | 'none';

export type BrushSize = 1 | 3 | 5 | 8;

export type BrushColor = '#FF6B6B' | '#4ECDC4' | '#FFD93D' | '#6C5CE7' | '#A29BFE';

export interface Point {
  x: number;
  y: number;
}

export interface BrushStroke {
  id: string;
  type: 'brush';
  points: Point[];
  color: BrushColor;
  size: BrushSize;
}

export interface StickyNote {
  id: string;
  type: 'sticky';
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: '#FFF9C4';
}

export interface ConnectionLine {
  id: string;
  type: 'line';
  fromStickyId: string;
  toStickyId: string;
}

export type BoardElement = BrushStroke | StickyNote | ConnectionLine;

export interface Snapshot {
  id: string;
  timestamp: number;
  elements: BoardElement[];
  densityColor: string;
}

export interface DiffHighlight {
  addedIds: string[];
  removedIds: string[];
}

export interface CollaborationRole {
  role: 'editor' | 'viewer';
  sessionId: string;
}

export interface IncrementalOp {
  type: 'add' | 'remove' | 'update' | 'move';
  elementId: string;
  element?: BoardElement;
  delta?: Partial<StickyNote>;
  timestamp: number;
  senderId: string;
}
