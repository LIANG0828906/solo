export interface ColorStop {
  id: string;
  color: string;
  position: number;
}

export interface GradientConfig {
  stops: ColorStop[];
  angle: number;
  steps: number;
}

export interface SavedGradient extends GradientConfig {
  id: string;
  createdAt: number;
  name?: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface TransformState {
  x: number;
  y: number;
  scale: number;
}

export type ColorMode = 'hex' | 'rgb' | 'hsl';
