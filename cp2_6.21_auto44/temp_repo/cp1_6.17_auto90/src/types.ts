export type ToolType = 'select' | 'rectangle' | 'circle' | 'diamond' | 'line' | 'text' | 'eraser';

export type ShapeType = 'rectangle' | 'circle' | 'diamond' | 'line' | 'text';

export interface Shape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  rotation: number;
  opacity: number;
  text?: string;
  createdAt: number;
  createdBy: string;
  pulseSync?: boolean;
}

export interface HistoryEntry {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  action: 'add' | 'move' | 'modify' | 'delete';
  shapeId: string;
  timestamp: number;
  snapshot: Shape[];
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  color: string;
}
