export type Priority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  priority: Priority;
  columnId: string;
  createdAt: number;
}

export interface ColumnData {
  id: string;
  title: string;
}

export type ClientMessage =
  | { type: 'ADD_TASK'; payload: Omit<Task, 'id' | 'createdAt'> }
  | { type: 'DELETE_TASK'; payload: { taskId: string } }
  | { type: 'UPDATE_TASK_TITLE'; payload: { taskId: string; title: string } }
  | { type: 'UPDATE_TASK_PRIORITY'; payload: { taskId: string; priority: Priority } }
  | { type: 'MOVE_TASK'; payload: { taskId: string; toColumnId: string; newIndex: number } }
  | { type: 'REQUEST_STATE' };

export type ServerMessage =
  | { type: 'STATE'; payload: { tasks: Task[]; columns: ColumnData[] } }
  | { type: 'TASK_ADDED'; payload: Task }
  | { type: 'TASK_DELETED'; payload: { taskId: string } }
  | { type: 'TASK_UPDATED'; payload: Partial<Task> & { id: string } }
  | { type: 'TASK_MOVED'; payload: { taskId: string; toColumnId: string; newIndex: number } };

export const PRIORITY_COLORS: Record<Priority, string> = {
  high: '#e74c3c',
  medium: '#f1c40f',
  low: '#2ecc71',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: '高',
  medium: '中',
  low: '低',
};
