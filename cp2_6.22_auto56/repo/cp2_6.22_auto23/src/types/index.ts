export type Priority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  assignee: string;
  status: TaskStatus;
  storyPoints: number;
  order: number;
  createdAt: string;
  completedAt?: string;
}

export interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  totalStoryPoints: number;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  connectedAt: string;
}

export interface LogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  taskId?: string;
  taskTitle?: string;
  timestamp: string;
}

export interface BurndownPoint {
  date: string;
  ideal: number;
  actual: number | null;
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  'todo': '待办',
  'in-progress': '进行中',
  'done': '已完成',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  'high': '高',
  'medium': '中',
  'low': '低',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  'high': '#e74c3c',
  'medium': '#f39c12',
  'low': '#27ae60',
};
