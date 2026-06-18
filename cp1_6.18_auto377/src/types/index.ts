export type ElementType = 'sticker' | 'shape' | 'fill';
export type ShapeType = 'circle' | 'rectangle' | 'triangle' | 'star';
export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light' | 'hard-light';
export type CategoryType = 'stickers' | 'shapes' | 'fills' | 'recent' | 'all';
export type ExportResolution = '1080' | '2160';
export type ExportFormat = 'png-transparent' | 'png-white' | 'pdf';

export interface Filters {
  blur: number;
  brightness: number;
  contrast: number;
  saturate: number;
  hueRotate: number;
  opacity: number;
}

export interface CanvasElement {
  id: string;
  type: ElementType;
  name: string;
  src?: string;
  shape?: ShapeType;
  fillColor?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  filters: Filters;
  blendMode: BlendMode;
}

export interface LibraryItem {
  id: string;
  type: ElementType;
  name: string;
  src?: string;
  shape?: ShapeType;
  fillColor?: string;
  defaultWidth: number;
  defaultHeight: number;
  category: string;
}

export interface CanvasSnapshot {
  elements: CanvasElement[];
  width: number;
  height: number;
}
