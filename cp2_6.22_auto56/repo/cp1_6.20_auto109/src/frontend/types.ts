export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatarColor: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  createdAt: string;
  completedAt?: string;
  startDate?: string;
}

export interface MemberStats {
  memberId: string;
  memberName: string;
  avatarColor: string;
  totalTasks: number;
  todo: number;
  inProgress: number;
  done: number;
  overdue: number;
}

export const priorityColors: Record<TaskPriority, string> = {
  low: '#96CEB4',
  medium: '#45B7D1',
  high: '#FFA502',
  urgent: '#FF6B6B',
};

export const priorityLabels: Record<TaskPriority, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
};

export const statusLabels: Record<TaskStatus, string> = {
  todo: '待办',
  'in-progress': '进行中',
  done: '已完成',
};

export const statusColors: Record<TaskStatus, string> = {
  todo: '#FFA502',
  'in-progress': '#45B7D1',
  done: '#2ECC71',
};
