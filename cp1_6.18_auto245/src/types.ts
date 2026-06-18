export type NodeShape = 'rounded-rect' | 'circle' | 'diamond';

export interface MindNode {
  id: string;
  text: string;
  parentId: string | null;
  x: number;
  y: number;
  color: string;
  shape: NodeShape;
  fontSize: number;
  createdAt: number;
  updatedAt: number;
}

export interface Connection {
  id: string;
  from: string;
  to: string;
}

export interface HistorySnapshot {
  nodes: MindNode[];
  connections: Connection[];
  timestamp: number;
}

export const COLOR_PALETTE: string[] = [
  '#FF6B6B',
  '#4FC3F7',
  '#81C784',
  '#FFD54F',
  '#CE93D8',
  '#FF8A65',
  '#A5D6A7',
  '#90CAF9',
];

export const NODE_COLORS = COLOR_PALETTE;
