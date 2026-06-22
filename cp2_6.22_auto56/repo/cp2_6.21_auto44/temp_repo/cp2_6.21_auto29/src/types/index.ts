export type Priority = 'high' | 'medium' | 'low';

export interface ColumnData {
  id: string;
  title: string;
  order: number;
}

export interface TaskData {
  id: string;
  title: string;
  assignee: string | null;
  priority: Priority;
  estimated_hours: number;
  column_id: string;
  order: number;
  start_date: string | null;
  dependencies: string[];
}

export interface TaskCreateInput {
  title: string;
  assignee?: string | null;
  priority: Priority;
  estimated_hours: number;
  column_id: string;
  start_date?: string | null;
  dependencies?: string[];
}

export interface TaskUpdateInput {
  title?: string;
  assignee?: string | null;
  priority?: Priority;
  estimated_hours?: number;
  column_id?: string;
  order?: number;
  start_date?: string | null;
  dependencies?: string[];
}

export interface TaskMoveInput {
  task_id: string;
  from_column_id: string;
  to_column_id: string;
  to_index: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  operator: string;
  action_type: string;
  details: string | null;
}

export const TEAM_MEMBERS = [
  '张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十',
];

export const PRIORITY_COLORS: Record<Priority, string> = {
  high: '#ff4757',
  medium: '#ffa502',
  low: '#2ed573',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: '高',
  medium: '中',
  low: '低',
};
