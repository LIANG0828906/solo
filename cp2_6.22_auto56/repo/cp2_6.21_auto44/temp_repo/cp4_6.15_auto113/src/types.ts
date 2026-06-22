export interface Point {
  x: number;
  y: number;
}

export interface StickyNote {
  id: string;
  x: number;
  y: number;
  content: string;
  color: string;
  sidebarColor: string;
  creator: string;
  votes: string[];
  createdAt: number;
}

export interface Drawing {
  id: string;
  points: Point[];
  color: string;
  lineWidth: number;
  creator: string;
}

export type Tool = 'select' | 'note' | 'draw';

export interface CanvasState {
  offsetX: number;
  offsetY: number;
  scale: number;
  targetScale: number;
  targetOffsetX: number;
  targetOffsetY: number;
}

export interface ServerMessage {
  type: string;
  payload: any;
  clientId?: string;
}
