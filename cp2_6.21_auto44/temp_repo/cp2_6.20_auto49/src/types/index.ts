export interface Tag {
  id: string;
  name: string;
  category: 'tech' | 'life' | 'study';
}

export interface Note {
  id: string;
  title: string;
  content: string;
  summary: string;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
  referenceIds: string[];
}

export interface BacklinkItem {
  noteId: string;
  title: string;
  snippet: string;
}

export interface GraphNode {
  id: string;
  title: string;
  tags: Tag[];
  radius: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: 'reference' | 'tag';
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
