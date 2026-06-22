export interface HandlePoint {
  x: number;
  y: number;
}

export interface PathPoint {
  x: number;
  y: number;
  handleIn?: HandlePoint;
  handleOut?: HandlePoint;
}

export interface PathData {
  id: string;
  name: string;
  points: PathPoint[];
  createdAt: number;
  updatedAt: number;
}

export interface AnimationConfig {
  speed: number;
  loop: boolean;
  duration: number;
}

export type DraggableType = 'anchor' | 'handleIn' | 'handleOut';

export interface DragState {
  type: DraggableType;
  pointIndex: number;
  offsetX: number;
  offsetY: number;
}
