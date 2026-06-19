export interface MindMapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  parentId: string | null;
  childrenIds: string[];
  createdAt: number;
  updatedAt: number;
  note?: string;
}

export interface EditHistory {
  id: string;
  timestamp: number;
  nodes: Record<string, MindMapNode>;
  description: string;
}

export type NodesMap = Record<string, MindMapNode>;
