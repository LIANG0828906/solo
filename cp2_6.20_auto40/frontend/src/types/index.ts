export interface GameVariable {
  id: string;
  name: string;
  type: 'number' | 'boolean';
  initialValue: number | boolean;
  minValue?: number;
  maxValue?: number;
  color?: string;
}

export interface VariableRule {
  variableId: string;
  operation: 'add' | 'subtract' | 'set' | 'toggle';
  value: number | boolean;
}

export interface TriggerCondition {
  variableId: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  value: number | boolean;
}

export interface SceneNode {
  id: string;
  title: string;
  description: string;
  backgroundImageUrl?: string;
  backgroundMusicUrl?: string;
  variableRules: VariableRule[];
  position: {
    x: number;
    y: number;
  };
  isStart?: boolean;
}

export interface SceneEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  conditions: TriggerCondition[];
}

export interface Story {
  id: string;
  title: string;
  author: string;
  coverImageUrl?: string;
  playCount: number;
  averageRating: number;
  ratingCount: number;
  createdAt: string;
  published: boolean;
  shortUrl?: string;
  nodes: SceneNode[];
  edges: SceneEdge[];
  variables: GameVariable[];
  startNodeId?: string;
  description?: string;
}

export interface GameRuntimeState {
  currentNodeId: string;
  variables: Record<string, number | boolean>;
  visitedNodes: string[];
}
