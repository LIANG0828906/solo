export type NodeType = 'concept' | 'article' | 'question' | 'person';

export type LinkType = 'contains' | 'references' | 'contradicts' | 'inspired_by';

export interface GraphNode {
  id: string;
  type: NodeType;
  title: string;
  content: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphLink {
  id: string;
  source: string;
  target: string;
  type: LinkType;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface FilterState {
  searchKeyword: string;
  nodeTypes: NodeType[];
  linkTypes: LinkType[];
}

export const NODE_TYPE_CONFIG: Record<NodeType, { color: string; label: string; shape: string }> = {
  concept: { color: '#4a90d9', label: '概念', shape: 'circle' },
  article: { color: '#4caf50', label: '文章', shape: 'square' },
  question: { color: '#ff9800', label: '问题', shape: 'diamond' },
  person: { color: '#9c27b0', label: '人物', shape: 'hexagon' },
};

export const LINK_TYPE_CONFIG: Record<LinkType, { color: string; label: string }> = {
  contains: { color: '#4caf50', label: '包含' },
  references: { color: '#4a90d9', label: '引用' },
  contradicts: { color: '#f44336', label: '矛盾' },
  inspired_by: { color: '#ff9800', label: '灵感来源' },
};
