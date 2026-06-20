export type NodeType = 'rectangle' | 'diamond' | 'circle' | 'text';

export interface FlowNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  description: string;
  color: string;
  createdAt: number;
  version: number;
}

export interface FlowEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  createdAt: number;
  version: number;
}

export interface User {
  id: string;
  name: string;
  color: string;
  roomId: string;
}

export interface Snapshot {
  id: string;
  roomId: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  createdBy: string;
  createdAt: number;
}

export interface CursorPosition {
  userId: string;
  x: number;
  y: number;
}

export type ClientMessage =
  | { type: 'join'; roomId: string; userId: string; userName: string; opId?: string }
  | { type: 'leave'; roomId: string; userId: string; opId?: string }
  | { type: 'node-add'; data: FlowNode; opId?: string }
  | { type: 'node-update'; data: Partial<FlowNode> & { id: string }; opId?: string }
  | { type: 'node-delete'; id: string; opId?: string }
  | { type: 'edge-add'; data: FlowEdge; opId?: string }
  | { type: 'edge-update'; data: Partial<FlowEdge> & { id: string }; opId?: string }
  | { type: 'edge-delete'; id: string; opId?: string }
  | { type: 'cursor-move'; userId: string; x: number; y: number; opId?: string };

export type ServerMessage =
  | { type: 'init-state'; nodes: FlowNode[]; edges: FlowEdge[]; users: User[] }
  | { type: 'user-join'; user: User }
  | { type: 'user-leave'; userId: string }
  | { type: 'node-add'; data: FlowNode }
  | { type: 'node-update'; data: Partial<FlowNode> & { id: string } }
  | { type: 'node-delete'; id: string }
  | { type: 'edge-add'; data: FlowEdge }
  | { type: 'edge-update'; data: Partial<FlowEdge> & { id: string } }
  | { type: 'edge-delete'; id: string }
  | { type: 'cursor-move'; userId: string; x: number; y: number }
  | { type: 'snapshot-created'; snapshot: Snapshot };

export const COLOR_PALETTE = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#6c8cff', '#a855f7', '#ec4899',
  '#dc2626', '#ea580c', '#ca8a04', '#16a34a',
  '#0891b2', '#3b82f6', '#9333ea', '#db2777',
];

export const NODE_DEFAULTS: Record<NodeType, { width: number; height: number }> = {
  rectangle: { width: 140, height: 80 },
  diamond: { width: 120, height: 120 },
  circle: { width: 100, height: 100 },
  text: { width: 120, height: 50 },
};

export const USER_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#6c8cff', '#a855f7', '#ec4899',
];
