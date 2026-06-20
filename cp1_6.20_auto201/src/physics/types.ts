export interface Vec2 {
  x: number;
  y: number;
}

export interface PhysicsNode {
  id: string;
  pos: Vec2;
  prevPos: Vec2;
  radius: number;
  pinned: boolean;
  createdAt: number;
  deleting?: boolean;
  deleteProgress?: number;
}

export interface Constraint {
  id: string;
  nodeAId: string;
  nodeBId: string;
  restLength: number;
  stiffness: number;
  tearThreshold?: number;
  deleting?: boolean;
  deleteProgress?: number;
}

export interface Particle {
  id: string;
  pos: Vec2;
  vel: Vec2;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface WorldState {
  nodes: Map<string, PhysicsNode>;
  constraints: Map<string, Constraint>;
  particles: Particle[];
  gravity: number;
  damping: number;
  iterations: number;
}

export type ToolMode = 'select' | 'node' | 'constraint';

export interface AppState {
  selectedNodeId: string | null;
  constraintStartNodeId: string | null;
  toolMode: ToolMode;
  isDragging: boolean;
  dragNodeId: string | null;
  dragMousePos: Vec2 | null;
  isCtrlPressed: boolean;
  fpsWarning: boolean;
}

export interface SpawnAnimation {
  nodeId: string;
  delay: number;
  elapsed: number;
}
