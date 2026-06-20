export type EdgeType = 'derived' | 'dependency' | 'related';

export interface GraphNode {
  id: string;
  title: string;
  description: string;
  tags: string[];
  color: string;
  x: number;
  y: number;
  createdAt: number;
  updatedAt: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  createdAt: number;
}

export interface KnowledgeGraph {
  id: string;
  name: string;
  roomCode: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  createdAt: number;
  updatedAt: number;
  version: number;
}

export interface Collaborator {
  id: string;
  name: string;
  color: string;
  activeNodeId: string | null;
  lastSeen: number;
}

export type ToolMode = 'select' | 'addNode' | 'connect' | 'delete';

export interface HistorySnapshot {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface CanvasState {
  offsetX: number;
  offsetY: number;
  scale: number;
}
