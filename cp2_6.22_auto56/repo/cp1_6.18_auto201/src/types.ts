export interface Card {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Relation {
  source: string;
  target: string;
  strength: number;
  tags: string[];
}

export interface GraphNode {
  id: string;
  x: number;
  y: number;
  z: number;
  radius: number;
  color: string;
  label: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: Relation[];
}

export interface TagInfo {
  name: string;
  count: number;
  type: 'writing' | 'design' | 'planning' | 'other';
  color: string;
}

export type ViewMode = 'honeycomb' | 'graph';

export interface SelectedGroup {
  cardIds: string[];
  title?: string;
}
