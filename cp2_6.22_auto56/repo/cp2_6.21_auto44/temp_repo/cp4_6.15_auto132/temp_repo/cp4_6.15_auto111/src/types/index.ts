export type ElementType = 'shape' | 'line' | 'text' | 'texture';
export type CategoryType = 'basic' | 'line' | 'text' | 'texture';
export type ResponsiveMode = 'desktop' | 'tablet' | 'mobile';

export interface CanvasElement {
  id: string;
  type: ElementType;
  presetId: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color: string;
  glitchIntensity: number;
  visible: boolean;
  zIndex: number;
  isNew?: boolean;
  isFlashing?: boolean;
  isGlitching?: boolean;
}

export interface PresetElement {
  id: string;
  category: CategoryType;
  name: string;
  type: ElementType;
  defaultWidth: number;
  defaultHeight: number;
  svgContent: string;
  defaultColor: string;
}

export interface ViewportState {
  x: number;
  y: number;
  scale: number;
}

export interface HistoryState {
  past: CanvasElement[][];
  future: CanvasElement[][];
}

export interface Bounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
}

export interface ExportOptions {
  format: 'png' | 'svg';
  scale: 1 | 2 | 4;
}

export type ExportWorkerMessage =
  | {
      type: 'export';
      format: 'png' | 'svg';
      scale: number;
      elements: CanvasElement[];
      width: number;
      height: number;
      presetsMap: Record<string, PresetElement>;
    }
  | { type: 'cancel' };

export type ExportWorkerResponse =
  | { type: 'progress'; percent: number }
  | { type: 'done'; blob: Blob; filename: string }
  | { type: 'error'; message: string };

export type ThumbnailWorkerMessage = {
  type: 'generate';
  elements: Array<{
    id: string;
    element: CanvasElement;
    preset: PresetElement;
  }>;
  size?: number;
};

export type ThumbnailWorkerResponse = {
  type: 'done';
  thumbnails: Record<string, string>;
};
