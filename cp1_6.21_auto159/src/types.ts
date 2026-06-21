export type TaskStatus = 'todo' | 'inProgress' | 'done';
export type TaskPriority = 'high' | 'medium' | 'low';
export type LogAction = 'created' | 'moved' | 'deleted';

export interface Board {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface Task {
  id: string;
  boardId: string;
  title: string;
  description: string;
  assignee: string;
  priority: TaskPriority;
  status: TaskStatus;
  order: number;
  createdAt: string;
}

export interface LogEntry {
  id: string;
  boardId: string;
  taskId: string;
  taskTitle: string;
  action: LogAction;
  timestamp: string;
  operator: string;
}

export interface MemberLoad {
  date: string;
  member: string;
  todo: number;
  inProgress: number;
  done: number;
}

export const MEMBERS = ['张三', '李四', '王五', '赵六'] as const;
