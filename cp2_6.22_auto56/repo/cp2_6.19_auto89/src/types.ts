export interface Article {
  id: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface Highlight {
  id: string;
  articleId: string;
  startOffset: number;
  endOffset: number;
  text: string;
  depth: number;
  createdAt: number;
}

export interface Note {
  id: string;
  articleId: string;
  highlightId: string;
  content: string;
  createdAt: number;
}

export interface Link {
  id: string;
  articleId: string;
  sourceId: string;
  targetId: string;
  sourceType: 'highlight' | 'note';
  targetType: 'highlight' | 'note';
  createdAt: number;
}

export type NodeType = 'highlight' | 'note';

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  highlightId?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphLink {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
}
