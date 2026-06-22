export interface Node {
  id: string;
  name: string;
  category: 'person' | 'location' | 'event' | 'concept';
  frequency: number;
  context: string;
}

export interface Edge {
  source: string;
  target: string;
  relation: 'contains' | 'belongs_to' | 'causes' | 'related';
  label: string;
}

export interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

export interface ForceNode extends Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx: number | null;
  fy: number | null;
  radius: number;
}

export interface ForceEdge extends Edge {
  sourceNode: ForceNode;
  targetNode: ForceNode;
}