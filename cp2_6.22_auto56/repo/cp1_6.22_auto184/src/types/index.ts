export type Priority = 'high' | 'medium' | 'low';

export type TaskColumn = 'backlog' | 'in-progress' | 'testing' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string;
  estimateHours: number;
  priority: Priority;
  assignee: string;
  column: TaskColumn;
  order: number;
  actualHours: number;
  createdAt: string;
}

export interface DailySnapshot {
  date: string;
  remainingHours: number;
}

export interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  tasks: Task[];
  dailySnapshots: DailySnapshot[];
}

export interface SprintData {
  sprints: Sprint[];
  activeSprintId: string | null;
}

export interface StandupEntry {
  id: string;
  date: string;
  yesterday: string;
  today: string;
  blockers: string;
}

export type TabType = 'board' | 'standup' | 'report';

export const COLUMN_LABELS: Record<TaskColumn, string> = {
  'backlog': 'Backlog',
  'in-progress': '进行中',
  'testing': '测试中',
  'done': '已完成',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#22C55E',
};

export const PRIORITY_ORDER: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};
