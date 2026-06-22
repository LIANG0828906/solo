export interface RawNode {
  id: string;
  name?: string;
  [key: string]: any;
}

export interface RawEdge {
  source: string;
  target: string;
  [key: string]: any;
}

export interface RawGraphData {
  nodes: RawNode[];
  edges: RawEdge[];
}

export interface GraphNode {
  id: string;
  name: string;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  degree: number;
  color: string;
  radius: number;
  highlighted: boolean;
  visible: boolean;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  visible: boolean;
}

export interface GraphStats {
  nodeCount: number;
  edgeCount: number;
  averageDegree: number;
  maxCentrality: number;
  maxCentralityNode: string;
}

export interface ParseResult {
  success: boolean;
  data?: RawGraphData;
  error?: string;
}

export const NODE_COLOR_PALETTE = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
];
