export type ToolType =
  | 'select'
  | 'point'
  | 'segment'
  | 'circle'
  | 'line'
  | 'ray'
  | 'polygon'
  | 'parallel'
  | 'perpendicular'
  | 'midpoint'
  | 'angle';

export interface PointShape {
  id: string;
  type: 'point';
  x: number;
  y: number;
  selected?: boolean;
  creating?: boolean;
  createdAt?: number;
}

export interface SegmentShape {
  id: string;
  type: 'segment';
  startPointId: string;
  endPointId: string;
  selected?: boolean;
  creating?: boolean;
  createdAt?: number;
}

export interface CircleShape {
  id: string;
  type: 'circle';
  centerId: string;
  radiusPointId: string;
  selected?: boolean;
  creating?: boolean;
  createdAt?: number;
}

export interface LineShape {
  id: string;
  type: 'line';
  point1Id: string;
  point2Id: string;
  selected?: boolean;
  creating?: boolean;
  createdAt?: number;
}

export interface RayShape {
  id: string;
  type: 'ray';
  startPointId: string;
  directionPointId: string;
  selected?: boolean;
  creating?: boolean;
  createdAt?: number;
}

export interface PolygonShape {
  id: string;
  type: 'polygon';
  pointIds: string[];
  selected?: boolean;
  creating?: boolean;
  createdAt?: number;
  closed?: boolean;
}

export type Shape =
  | PointShape
  | SegmentShape
  | CircleShape
  | LineShape
  | RayShape
  | PolygonShape;

export interface ParallelConstraint {
  id: string;
  type: 'parallel';
  segment1Id: string;
  segment2Id: string;
}

export interface PerpendicularConstraint {
  id: string;
  type: 'perpendicular';
  segment1Id: string;
  segment2Id: string;
}

export interface MidpointConstraint {
  id: string;
  type: 'midpoint';
  pointId: string;
  segmentId: string;
}

export interface AngleConstraint {
  id: string;
  type: 'angle';
  segment1Id: string;
  segment2Id: string;
  angle: number;
}

export type Constraint =
  | ParallelConstraint
  | PerpendicularConstraint
  | MidpointConstraint
  | AngleConstraint;

export interface HistoryState {
  shapes: Shape[];
  constraints: Constraint[];
}

export interface CanvasState {
  shapes: Shape[];
  constraints: Constraint[];
  currentTool: ToolType;
  selectedShapeIds: string[];
  zoom: number;
  pan: { x: number; y: number };
  history: HistoryState[];
  historyIndex: number;
  isPanning: boolean;
  isDragging: boolean;
  dragPointId: string | null;
  mousePos: { x: number; y: number } | null;
  drawingPreview: any;
  constraintSelectionStep: number;
  constraintFirstShapeId: string | null;
}
