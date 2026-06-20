export type TriggerType = 'click' | 'hover' | 'load' | 'timer';
export type EasingType = 'ease' | 'linear' | 'ease-in' | 'ease-out' | 'cubic-bezier';

export interface FlowNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  color: string;
  animation: {
    trigger: TriggerType;
    duration: number;
    easing: EasingType;
  };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface CanvasState {
  nodes: FlowNode[];
  edges: FlowEdge[];
  selectedId: string | null;
  pan: { x: number; y: number };
  zoom: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface BezierPath {
  path: string;
  startPoint: Point;
  endPoint: Point;
  controlPoint: Point;
  midPoint: Point;
}
