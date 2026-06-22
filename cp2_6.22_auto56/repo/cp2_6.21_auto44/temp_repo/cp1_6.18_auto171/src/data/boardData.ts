export type ElementType = 'path' | 'sticky' | 'image';
export type ToolType = 'select' | 'pen' | 'eraser' | 'sticky' | 'image';
export type PenColor = '#333333' | '#E53935' | '#43A047' | '#1E88E5' | '#FDD835' | '#8E24AA';
export type PenWidth = 3 | 6 | 12;

export interface PathPoint {
  x: number;
  y: number;
}

export interface BoardElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  strokeWidth?: number;
  points?: PathPoint[];
  text?: string;
  dataUrl?: string;
  opacity: number;
  zIndex: number;
  createdAt: number;
  updatedAt: number;
}

export interface Snapshot {
  id: string;
  timestamp: number;
  elements: BoardElement[];
  expired: boolean;
}

export interface HistoryEntry {
  type: 'add' | 'update' | 'delete' | 'clear';
  element?: BoardElement;
  previousElement?: BoardElement;
  clearedElements?: BoardElement[];
}

export const PEN_COLORS: PenColor[] = ['#333333', '#E53935', '#43A047', '#1E88E5', '#FDD835', '#8E24AA'];
export const PEN_WIDTHS: PenWidth[] = [3, 6, 12];
export const MAX_HISTORY_SIZE = 50;
export const SNAPSHOT_INTERVAL = 5 * 60 * 1000;
