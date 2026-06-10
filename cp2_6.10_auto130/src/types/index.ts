export type MaterialCategory = 'petal' | 'leaf' | 'stem';

export interface Material {
  id: string;
  name: string;
  category: MaterialCategory;
  baseColor: string;
  svgPath: string;
  viewBox: string;
}

export interface PlacedMaterial {
  id: string;
  materialId: string;
  x: number;
  y: number;
  scale: number;
  angle: number;
  currentColor: string;
}

export interface ColorScheme {
  id: string;
  name: string;
  startColor: string;
  endColor: string;
  paperBg: string;
}

export interface PaperSize {
  width: number;
  height: number;
}

export type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}
