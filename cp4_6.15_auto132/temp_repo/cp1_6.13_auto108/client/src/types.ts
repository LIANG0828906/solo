export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type Priority = 'P0' | 'P1' | 'P2' | 'P3';
export type Tag = '前端' | '后端' | '设计' | '测试' | '运维';

export interface Comment {
  id: string;
  content: string;
  createdAt: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  tags: Tag[];
  priority: Priority;
  status: TaskStatus;
  createdAt: number;
  statusChangedAt: number;
  comments: Comment[];
  order: number;
}

export const STATUS_META: Record<TaskStatus, { label: string; color: string }> = {
  'todo': { label: '待办', color: '#2196F3' },
  'in-progress': { label: '进行中', color: '#FF9800' },
  'done': { label: '已完成', color: '#4CAF50' },
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  P0: '#F44336',
  P1: '#FF9800',
  P2: '#2196F3',
  P3: '#9E9E9E',
};

export const TAG_COLORS: Record<Tag, string> = {
  '前端': '#2196F3',
  '后端': '#4CAF50',
  '设计': '#E91E63',
  '测试': '#9C27B0',
  '运维': '#FF9800',
};

export const PRESET_TAGS: Tag[] = ['前端', '后端', '设计', '测试', '运维'];
