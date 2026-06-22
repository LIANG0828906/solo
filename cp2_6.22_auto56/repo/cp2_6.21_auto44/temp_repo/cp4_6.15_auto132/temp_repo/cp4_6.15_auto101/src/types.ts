export enum RecordingState {
  IDLE = 'idle',
  COUNTDOWN = 'countdown',
  RECORDING = 'recording',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  PROCESSING = 'processing'
}

export enum AnnotationTool {
  NONE = 'none',
  PEN = 'pen',
  HIGHLIGHT = 'highlight',
  TEXT = 'text'
}

export type AnnotationColor = 'red' | 'yellow' | 'blue' | 'green' | 'white';

export interface Point {
  x: number;
  y: number;
}

export interface BaseAnnotation {
  id: string;
  timestamp: number;
  tool: AnnotationTool;
  color: AnnotationColor;
}

export interface PenAnnotation extends BaseAnnotation {
  tool: AnnotationTool.PEN;
  points: Point[];
  lineWidth: number;
}

export interface HighlightAnnotation extends BaseAnnotation {
  tool: AnnotationTool.HIGHLIGHT;
  startPoint: Point;
  endPoint: Point;
}

export interface TextAnnotation extends BaseAnnotation {
  tool: AnnotationTool.TEXT;
  position: Point;
  text: string;
  fontSize: number;
}

export type Annotation = PenAnnotation | HighlightAnnotation | TextAnnotation;

export interface SubtitleEntry {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  offset: number;
}

export interface RecordingConfig {
  video: boolean;
  audio: boolean;
  displayMediaOptions: DisplayMediaStreamOptions;
}

export interface RecordingData {
  blob: Blob | null;
  url: string | null;
  duration: number;
  annotations: Annotation[];
  subtitles: SubtitleEntry[];
}

export const COLOR_MAP: Record<AnnotationColor, string> = {
  red: '#ef4444',
  yellow: '#eab308',
  blue: '#3b82f6',
  green: '#22c55e',
  white: '#ffffff'
};
