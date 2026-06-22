export interface LayoutWord {
  text: string;
  frequency: number;
  fontSize: number;
  color: string;
  rotation: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ColorTheme {
  name: string;
  label: string;
  colors: string[];
}

export type ShapeType = 'circle' | 'heart' | 'cloud';

export interface LayoutResult {
  words: LayoutWord[];
  canvasWidth: number;
  canvasHeight: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
