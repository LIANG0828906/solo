export type TagColor = 'red' | 'blue' | 'green' | 'orange' | 'purple';
export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface User {
  id: string;
  username: string;
  avatar: string;
}

export interface TaskTag {
  id: string;
  name: string;
  color: TagColor;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  tags: TaskTag[];
  assigneeId?: string;
  estimatedHours: number;
  blockedReason?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  deadline: string;
  memberIds: string[];
  createdAt: string;
}

export const TAG_COLOR_MAP: Record<TagColor, string> = {
  red: '#EF4444',
  blue: '#3B82F6',
  green: '#10B981',
  orange: '#F59E0B',
  purple: '#8B5CF6',
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: '待办',
  'in-progress': '进行中',
  done: '已完成',
};
