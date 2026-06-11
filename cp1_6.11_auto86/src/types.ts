export interface Point {
  x: number;
  y: number;
  timestamp: number;
  speed: number;
  pressure: number;
}

export interface Stroke {
  id: string;
  points: Point[];
  baseWidth: number;
  color: string;
}

export type ShapeType = 'line' | 'rectangle' | 'circle' | 'ellipse' | 'triangle' | 'pentagon';

export interface RecognizedShape {
  type: ShapeType;
  cx: number;
  cy: number;
  width: number;
  height: number;
  rotation: number;
  vertices?: { x: number; y: number }[];
}

export interface SVGElementData {
  id: string;
  shape: RecognizedShape;
  scale: number;
  rotation: number;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  isGroup: boolean;
  childIds: string[];
  offsetX: number;
  offsetY: number;
}

export interface HistoryAction {
  type: 'add' | 'edit' | 'delete' | 'group' | 'ungroup' | 'clear';
  svgId: string;
  prevState: SVGElementData | null;
  nextState: SVGElementData | null;
}

export type ToolType = 'pencil' | 'eraser';
