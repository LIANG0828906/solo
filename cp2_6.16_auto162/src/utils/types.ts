export type AnnotationType = 'rectangle' | 'arrow' | 'text';

export interface BaseAnnotation {
  id: string;
  type: AnnotationType;
  x: number;
  y: number;
  rotation: number;
  createdAt: number;
}

export interface RectangleAnnotation extends BaseAnnotation {
  type: 'rectangle';
  width: number;
  height: number;
  borderColor: string;
  borderWidth: number;
}

export interface ArrowAnnotation extends BaseAnnotation {
  type: 'arrow';
  endX: number;
  endY: number;
  color: string;
  lineWidth: number;
}

export interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  content: string;
  fontSize: number;
  italic: boolean;
  color: string;
}

export type Annotation = RectangleAnnotation | ArrowAnnotation | TextAnnotation;

export type AppStatus = 'idle' | 'processing' | 'ready' | 'exporting';

export type ToolType = 'select' | 'rectangle' | 'arrow' | 'text';

export interface ExportParams {
  format: 'gif' | 'webm';
  loop: boolean;
  withAnnotations: boolean;
  fps: number;
}

export interface FrameData {
  index: number;
  imageData: ImageData;
  url?: string;
}
