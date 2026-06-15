export interface TeamMember {
  id: string;
  name: string;
  avatar: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  assignees: TeamMember[];
  timeSpent: number;
  isRunning: boolean;
  createdAt: number;
  position: number;
}

export interface TimeSnapshot {
  id: string;
  taskId: string;
  timestamp: number;
  timeSpent: number;
}

export type WSMessageType =
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_DELETED'
  | 'TIMER_STARTED'
  | 'TIMER_PAUSED'
  | 'TIMER_RESET'
  | 'TIME_SYNC'
  | 'SNAPSHOT'
  | 'ERROR';

export interface WSMessage<T = unknown> {
  type: WSMessageType;
  payload: T;
  timestamp: number;
}

export interface TaskCreateInput {
  title: string;
  description: string;
  estimatedHours: number;
  assignees: TeamMember[];
}

export interface TaskUpdateInput {
  title?: string;
  description?: string;
  estimatedHours?: number;
  assignees?: TeamMember[];
  position?: number;
}

export interface TimeSpentUpdateInput {
  taskId: string;
  timeSpent: number;
}
