export type Priority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  priority: Priority;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface UserCursor {
  userId: string;
  x: number;
  y: number;
  color: string;
  userName: string;
  timestamp: number;
}

export interface TaskConflict {
  message: string;
  task1Id: string;
  task2Id: string;
  timestamp: number;
}

export interface Notification {
  id: string;
  type: 'warning' | 'info' | 'success';
  message: string;
  timestamp: number;
}

export interface WSMessage {
  type: 'task_created' | 'task_updated' | 'task_deleted' | 'cursor_move' | 'conflict' | 'tasks_sync' | 'user_join' | 'user_leave' | 'ping' | 'pong';
  data: any;
  userId?: string;
}
