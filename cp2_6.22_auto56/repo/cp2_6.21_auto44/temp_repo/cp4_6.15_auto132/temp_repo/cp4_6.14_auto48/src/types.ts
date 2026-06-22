export interface DebateNode {
  id: string;
  title: string;
  content: string;
  type: 'pro' | 'con' | 'free';
  x: number;
  y: number;
}

export interface DebateEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'support' | 'refute';
}

export type NodeType = 'pro' | 'con' | 'free';
export type EdgeType = 'support' | 'refute';
export type Side = 'pro' | 'con';

export const NODE_COLORS: Record<NodeType, string> = {
  pro: '#0d9488',
  con: '#e11d48',
  free: '#d97706',
};

export const NODE_LABELS: Record<NodeType, string> = {
  pro: '正方',
  con: '反方',
  free: '自由',
};

export const EDGE_COLORS: Record<EdgeType, string> = {
  support: '#22c55e',
  refute: '#ef4444',
};
