export type MaterialCategory = 'nature' | 'geometry' | 'animal' | 'abstract';

export interface Material {
  id: string;
  category: MaterialCategory;
  name: string;
  svgPath: string;
  defaultColor: string;
  viewBox: string;
}

export interface CanvasElement {
  id: string;
  materialId: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  color: string;
  isNew?: boolean;
}

export interface Viewport {
  offsetX: number;
  offsetY: number;
  zoom: number;
}

export type HistoryAction = 'add' | 'update' | 'delete' | 'batch';

export interface HistoryState {
  elements: CanvasElement[];
  action: HistoryAction;
  timestamp: number;
}
