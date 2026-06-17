export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay';

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  points: Point[];
  color: string;
  size: number;
  blendMode: BlendMode;
}

export interface Doodle {
  id: string;
  name: string;
  strokes: Stroke[];
  thumbnail: string;
  createdAt: number;
  updatedAt: number;
  width: number;
  height: number;
}

export interface BrushSettings {
  color: string;
  size: number;
  blendMode: BlendMode;
}

export interface Viewport {
  offsetX: number;
  offsetY: number;
}
