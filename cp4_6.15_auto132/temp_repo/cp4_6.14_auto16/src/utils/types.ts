export type Priority = 'urgent' | 'high' | 'medium' | 'low';

export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';

export interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assigneeId: string | null;
  priority: Priority;
  estimatedHours: number;
  status: TaskStatus;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  order: number;
}

export interface Lane {
  id: string;
  name: string;
  status: TaskStatus;
  order: number;
}

export interface LoadData {
  memberId: string;
  member: TeamMember;
  taskCount: number;
  totalHours: number;
  loadPercentage: number;
  tasks: Task[];
}

export interface AssignmentSuggestion {
  taskId: string;
  taskTitle: string;
  fromMemberId: string | null;
  toMemberId: string;
  reason: string;
}

export interface HeatmapCell {
  day: number;
  hour: number;
  count: number;
  activities: ActivityType[];
  peopleCount: number;
}

export type ActivityType = 'create' | 'update' | 'complete' | 'comment';

export const PRIORITY_LABELS: Record<Priority, string> = {
  urgent: '紧急',
  high: '高',
  medium: '中',
  low: '低',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  urgent: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  'todo': '待分配',
  'in-progress': '进行中',
  'review': '审核中',
  'done': '已完成',
};

export const DEFAULT_LANES: Lane[] = [
  { id: 'lane-1', name: '待分配', status: 'todo', order: 0 },
  { id: 'lane-2', name: '进行中', status: 'in-progress', order: 1 },
  { id: 'lane-3', name: '审核中', status: 'review', order: 2 },
  { id: 'lane-4', name: '已完成', status: 'done', order: 3 },
];

export const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
export const HOURS = Array.from({ length: 24 }, (_, i) => i);
