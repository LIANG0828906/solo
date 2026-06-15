export interface GraphNode {
  id: string;
  label: string;
  type: 'person' | 'tech' | 'project' | 'concept' | 'other';
  category?: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  vx?: number;
  vy?: number;
  notes?: string[];
  summary?: string;
}

export interface GraphEdge {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  label: string;
  strength: number;
  cooccurrenceCount: number;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface Note {
  id: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  title?: string;
}

export interface HistorySnapshot {
  id: string;
  timestamp: number;
  graph: KnowledgeGraph;
  notes: Note[];
  description?: string;
}

export interface CategoryTreeNode {
  id: string;
  name: string;
  children?: CategoryTreeNode[];
  nodeIds?: string[];
}
