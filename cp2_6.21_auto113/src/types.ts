export type TaskStatus = 'pending' | 'reviewing' | 'approved' | 'changes_needed';

export interface User {
  id: string;
  name: string;
  avatarColor: string;
  isOnline: boolean;
  activeTasks: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  repoUrl: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  submitter: User;
  reviewer: User | null;
}

export interface CreateTaskPayload {
  title: string;
  description: string;
  repoUrl: string;
  submitterId: string;
}

export interface UpdateStatusPayload {
  taskId: string;
  status: TaskStatus;
}

export interface ToastItem {
  id: string;
  message: string;
  type: TaskStatus | 'info' | 'error' | 'success';
}

export const STATUS_COLUMNS: { id: TaskStatus; title: string; bgColor: string }[] = [
  { id: 'pending', title: '待审查', bgColor: '#f8f9fa' },
  { id: 'reviewing', title: '审查中', bgColor: '#fff3e0' },
  { id: 'approved', title: '已通过', bgColor: '#e8f5e9' },
  { id: 'changes_needed', title: '需修改', bgColor: '#ffebee' },
];

export const STATUS_TOAST_COLORS: Record<string, string> = {
  pending: '#6c757d',
  reviewing: '#ff9800',
  approved: '#4caf50',
  changes_needed: '#f44336',
  info: '#2196f3',
  error: '#d32f2f',
  success: '#388e3c',
};
