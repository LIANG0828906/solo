/**
 * 任务类型定义
 * 数据流向：被前端组件、API路由、WebSocket服务器共享使用
 */

export interface Task {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  assignees: string[];
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
  snapshotTime: number;
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
  assignees: string[];
}

export interface TaskUpdateInput {
  title?: string;
  description?: string;
  estimatedHours?: number;
  assignees?: string;
}

export interface TimeSpentUpdateInput {
  taskId: string;
  timeSpent: number;
}
