export type NodeType = 'source' | 'processor' | 'sink';

export interface NodeData {
  id: string;
  name: string;
  type: NodeType;
  position: [number, number, number];
  load: number;
  throughput: number;
  latency: number;
}

export interface Edge {
  id: string;
  sourceId: string;
  targetId: string;
}

export interface Particle {
  id: string;
  edgeId: string;
  progress: number;
  speed: number;
}

export interface PanelPosition {
  x: number;
  y: number;
}
