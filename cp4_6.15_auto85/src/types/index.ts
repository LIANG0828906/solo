export type ToolType = 'brush' | 'highlight' | 'text' | 'none';

export interface Point {
  x: number;
  y: number;
}

export interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface BaseAnnotation {
  id: string;
  type: ToolType;
  timestamp: number;
  endTime: number;
  color: string;
}

export interface BrushAnnotation extends BaseAnnotation {
  type: 'brush';
  size: 3 | 6 | 10;
  points: Point[];
}

export interface HighlightAnnotation extends BaseAnnotation {
  type: 'highlight';
  rect: Region;
  opacity: number;
}

export interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  content: string;
  position: Point;
  fontSize: number;
}

export type Annotation = BrushAnnotation | HighlightAnnotation | TextAnnotation;

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  startTime: number;
  duration: number;
  fps: 15 | 30 | 60;
  region: Region | null;
}

export interface ToolSettings {
  currentTool: ToolType;
  brushSize: 3 | 6 | 10;
  color: string;
  highlightOpacity: number;
}

export const COLOR_PALETTE: string[] = [
  '#e94560',
  '#f39c12',
  '#f1c40f',
  '#2ecc71',
  '#3498db',
  '#9b59b6',
  '#e74c3c',
  '#ffffff',
];

export const BRUSH_SIZES: Array<3 | 6 | 10> = [3, 6, 10];
export const FPS_OPTIONS: Array<15 | 30 | 60> = [15, 30, 60];
