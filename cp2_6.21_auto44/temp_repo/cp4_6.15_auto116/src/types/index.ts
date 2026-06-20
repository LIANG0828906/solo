export interface FunctionConfig {
  id: string;
  expression: string;
  color: string;
  amplitude: number;
  frequency: number;
  phase: number;
  visible: boolean;
}

export interface Point {
  x: number;
  y: number;
}

export interface Particle {
  progress: number;
  speed: number;
  size: number;
  trail: Point[];
}

export interface ViewTransform {
  offsetX: number;
  offsetY: number;
  scale: number;
}

export interface ParseResult {
  valid: boolean;
  error?: string;
  points?: Point[];
}
