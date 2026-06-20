export interface CSSProperty {
  name: string;
  value: string;
}

export interface Keyframe {
  id: string;
  time: number;
  properties: CSSProperty[];
  color: string;
}

export type EasingType = 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear' | 'cubic-bezier';

export interface CubicBezierParams {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface AnimationState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

export interface InterpolatedProperties {
  transform: string;
  opacity: number;
  backgroundColor: string;
  [key: string]: string | number;
}

export const SUPPORTED_PROPERTIES = ['transform', 'opacity', 'background-color'] as const;

export const KEYFRAME_COLORS = [
  '#e94560',
  '#00d4ff',
  '#7c3aed',
  '#22c55e',
  '#f59e0b',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
  '#f97316',
  '#8b5cf6',
];

export const DEFAULT_EASING: EasingType = 'ease';

export const DEFAULT_BEZIER: CubicBezierParams = {
  x1: 0.25,
  y1: 0.1,
  x2: 0.25,
  y2: 1,
};
