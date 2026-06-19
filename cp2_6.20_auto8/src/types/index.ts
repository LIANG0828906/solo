export interface Note {
  id: string;
  content: string;
  author: string;
  createdAt: string;
}

export type Priority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: Priority;
  dueDate: string | null;
  assignee: string | null;
  tags: string[];
  notes: Note[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Lane {
  id: string;
  title: string;
  order: number;
}

export interface WSMessage {
  type: 'task_updated' | 'task_created' | 'task_deleted' | 'lane_updated' | 'lane_created' | 'lane_deleted' | 'note_added';
  data: Task | Lane | Note;
}

export const TAG_COLORS: Record<string, string> = {
  Bug: '#e94560',
  功能: '#0f3460',
  优化: '#533483',
  设计: '#e58e26',
  文档: '#2ecc71',
  紧急: '#e74c3c',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  high: '#e94560',
  medium: '#f39c12',
  low: '#27ae60',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: '高',
  medium: '中',
  low: '低',
};
