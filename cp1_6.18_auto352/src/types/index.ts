export interface Card {
  id: number;
  title: string;
  content: string;
  image: string;
  tags: string[];
  relatedCards: number[];
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface GraphNode {
  id: number;
  title: string;
  category: string;
  connections: number;
  x?: number;
  y?: number;
}

export interface GraphLink {
  source: number | GraphNode;
  target: number | GraphNode;
  value: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}
