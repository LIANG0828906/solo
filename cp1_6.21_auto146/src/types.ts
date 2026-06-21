export type Language = 'TypeScript' | 'JavaScript' | 'CSS' | 'HTML';

export interface Snippet {
  id: string;
  filename: string;
  language: Language;
  content: string;
  module: string;
  createdAt: string;
  updatedAt: string;
  dependencies: string[];
}

export interface GraphNode {
  id: string;
  filename: string;
  module: string;
  language: Language;
  referenceCount: number;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface RelationGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
