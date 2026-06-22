export type KRType = 'numeric' | 'boolean' | 'percentage';
export type SubTaskStatus = 'todo' | 'in_progress' | 'done';

export interface Quarter {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface Objective {
  id: string;
  quarterId: string;
  title: string;
  order: number;
  dependencyIds: string[];
  dependencyThreshold: number;
}

export interface KeyResult {
  id: string;
  objectiveId: string;
  title: string;
  type: KRType;
  initialValue: number;
  targetValue: number;
  currentValue: number;
  assignee: string;
}

export interface SubTask {
  id: string;
  keyResultId: string;
  title: string;
  status: SubTaskStatus;
  assignee: string;
}

export interface Dependency {
  id: string;
  sourceId: string;
  targetId: string;
  threshold: number;
}

export interface FailureReason {
  keyResultId: string;
  reasons: string[];
}
