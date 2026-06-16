export interface Point {
  x: number;
  y: number;
}

export interface BezierNode extends Point {
  id: string;
  controlIn?: Point;
  controlOut?: Point;
}

export interface VectorPath {
  id: string;
  nodes: BezierNode[];
  color: string;
  length: number;
  isClosed: boolean;
  thumbnail?: string;
}

export interface ImageTransform {
  x: number;
  y: number;
  scale: number;
}

export interface RippleEffect {
  id: string;
  x: number;
  y: number;
  startTime: number;
}


