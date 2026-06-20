export type NodeShape = 'rectangle' | 'rounded-rectangle' | 'diamond' | 'ellipse';

export interface MindMapNode {
  id: string;
  title: string;
  note: string;
  color: string;
  fontSize: number;
  x: number;
  y: number;
  shape: NodeShape;
  parentId?: string;
}

export interface MindMapEdge {
  id: string;
  source: string;
  target: string;
}

export interface NodePosition {
  id: string;
  x: number;
  y: number;
}

export interface User {
  id: string;
  name: string;
}

export interface WSMessage {
  type: string;
  userId: string;
  mindmapId: string;
  data: any;
  timestamp: number;
  messageId: string;
}
