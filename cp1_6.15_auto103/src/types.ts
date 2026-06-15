export type NodeCategory = 'concept' | 'principle' | 'case' | 'exercise';
export type RelationType = 'depend' | 'derive' | 'example';

export interface RadarData {
  understanding: number;
  memory: number;
  application: number;
  innovation: number;
  connection: number;
}

export interface GraphNode {
  id: string;
  name: string;
  level: number;
  description: string;
  category: NodeCategory;
  exercises: string[];
  mastery: number;
  radar: RadarData;
  degree?: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphEdge {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  relation: RelationType;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export const CATEGORY_COLORS: Record<NodeCategory, string> = {
  concept: '#4fc3f7',
  principle: '#66bb6a',
  case: '#ffa726',
  exercise: '#ab47bc',
};

export const CATEGORY_LABELS: Record<NodeCategory, string> = {
  concept: '概念',
  principle: '原理',
  case: '案例',
  exercise: '练习',
};

export const RELATION_LABELS: Record<RelationType, string> = {
  depend: '依赖',
  derive: '推导',
  example: '举例',
};

export const RADAR_DIMENSIONS = [
  { key: 'understanding', label: '理解度' },
  { key: 'memory', label: '记忆度' },
  { key: 'application', label: '应用度' },
  { key: 'innovation', label: '创新度' },
  { key: 'connection', label: '关联度' },
] as const;
