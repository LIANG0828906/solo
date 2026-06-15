export type LayerType = 'stroke' | 'shape' | 'text';

export type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'polygon';

export interface Point {
  x: number;
  y: number;
}

export interface Layer {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  locked: boolean;
  opacity: number;
  strokeColor: string;
  strokeWidth: number;
  fillColor: string;
  fillOpacity: number;
  points?: Point[];
  shapeType?: ShapeType;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  rotation?: number;
  confidence?: number;
  text?: string;
}

export interface LayerGroup {
  id: string;
  name: string;
  type: LayerType;
  layers: Layer[];
  expanded: boolean;
}

export interface SketchState {
  originalImageUrl: string | null;
  layerGroups: LayerGroup[];
  selectedLayerId: string | null;
  isExporting: boolean;
  isProcessing: boolean;
  zoom: number;
  panX: number;
  panY: number;
}

export interface SketchActions {
  setOriginalImage: (url: string | null) => void;
  addLayerGroups: (groups: LayerGroup[]) => void;
  selectLayer: (layerId: string | null) => void;
  toggleLayerVisibility: (layerId: string) => void;
  updateLayer: (layerId: string, updates: Partial<Layer>) => void;
  deleteLayer: (layerId: string) => void;
  reorderLayer: (layerId: string, targetIndex: number, targetGroupId: string) => void;
  setProcessing: (isProcessing: boolean) => void;
  setExporting: (isExporting: boolean) => void;
  setZoom: (zoom: number) => void;
  setPan: (panX: number, panY: number) => void;
  resetView: () => void;
}

export type SketchStore = SketchState & SketchActions;
