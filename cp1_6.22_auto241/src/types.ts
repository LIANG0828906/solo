export interface Point {
  x: number;
  y: number;
}

export interface Wall {
  id: string;
  start: Point;
  end: Point;
  thickness: number;
  color: string;
}

export interface Door {
  id: string;
  wallId: string;
  position: number;
  width: number;
  swingAngle: number;
  color: string;
}

export interface Window {
  id: string;
  wallId: string;
  position: number;
  width: number;
  height: number;
  color: string;
}

export interface Room {
  id: string;
  walls: string[];
  points: Point[];
}

export interface Dimension {
  id: string;
  wallId: string;
  startPoint: Point;
  endPoint: Point;
  text: string;
  textPosition: Point;
  offset: number;
}

export type Tool = 'select' | 'room' | 'door' | 'window';

export type ElementType = 'wall' | 'door' | 'window';

export interface DrawingState {
  rooms: Room[];
  walls: Wall[];
  doors: Door[];
  windows: Window[];
  dimensions: Dimension[];
  selectedElementId: string | null;
  selectedElementType: ElementType | null;
  currentTool: Tool;
  zoom: number;
  pan: Point;
  isDrawing: boolean;
  drawingPoints: Point[];
}

export const PIXELS_PER_METER = 50;
