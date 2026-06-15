export type NodeType = 'selector' | 'sequence' | 'condition' | 'action';

export type NodeStatus = 'success' | 'failure' | 'running';

export interface TreeNodeData {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  label: string;
  properties: Record<string, unknown>;
  isActive: boolean;
  isExecuting: boolean;
}

export interface Connection {
  id: string;
  fromNodeId: string;
  fromPort: 'output';
  toNodeId: string;
  toPort: 'input';
  isActive: boolean;
}

export interface EnvironmentState {
  playerDistance: number;
  health: number;
  hasCover: boolean;
}

export interface CharacterState {
  position: { x: number; z: number };
  rotation: number;
  action: 'idle' | 'move' | 'attack' | 'hide';
  isCrouching: boolean;
}

export interface RunState {
  isRunning: boolean;
  currentNodeId: string;
  executionPath: string[];
  speed: number;
}

export type ConditionOperator = 'lt' | 'lte' | 'gt' | 'gte' | 'eq';

export interface ConditionProperty {
  field: keyof EnvironmentState;
  operator: ConditionOperator;
  value: number;
}

export type ActionType = 'move' | 'attack' | 'hide' | 'idle';

export interface ActionProperties {
  actionType: ActionType;
  target?: { x: number; z: number };
  speed?: number;
}
