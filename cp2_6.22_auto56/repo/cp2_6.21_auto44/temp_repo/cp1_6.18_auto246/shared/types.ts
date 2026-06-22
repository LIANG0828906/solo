export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: number;
  createdAtBy?: string;
}

export interface ServerToClientEvents {
  'tasks:initial': (tasks: Task[]) => void;
  'task:created': (task: Task) => void;
  'task:updated': (task: Task) => void;
  'task:deleted': (taskId: string) => void;
  'users:count': (count: number) => void;
  'notification': (message: string) => void;
}

export interface ClientToServerEvents {
  'task:create': (task: Omit<Task, 'id' | 'createdAt'>) => void;
  'task:update': (task: Task) => void;
  'task:delete': (taskId: string) => void;
}

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  high: '#FF6B6B',
  medium: '#FFD93D',
  low: '#6BCB77'
};

export const COLUMN_CONFIG: Record<TaskStatus, { title: string; bgColor: string; counterColor: string }> = {
  'todo': { title: '待办', bgColor: '#E3F2FD', counterColor: '#90CAF9' },
  'in-progress': { title: '进行中', bgColor: '#F3E5F5', counterColor: '#CE93D8' },
  'done': { title: '已完成', bgColor: '#E8F5E9', counterColor: '#A5D6A7' }
};
