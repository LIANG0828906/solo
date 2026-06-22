export interface ControlPoint {
  x: number;
  y: number;
}

export interface KeyframeProperties {
  translateX?: number;
  translateY?: number;
  scale?: number;
  rotate?: number;
  opacity?: number;
}

export interface Keyframe {
  percentage: number;
  properties: KeyframeProperties;
}

export interface KeyframeConfig {
  name: string;
  duration: number;
  keyframes: Keyframe[];
}

export interface SpringParams {
  mass: number;
  stiffness: number;
  damping: number;
}

export interface PreviewState {
  curve: string;
  keyframes: KeyframeConfig;
}

export type CurveType = 'bezier' | 'spring';

export interface BezierEditorState {
  p1: ControlPoint;
  p2: ControlPoint;
}

export interface SpringEditorState {
  mass: number;
  stiffness: number;
  damping: number;
}
