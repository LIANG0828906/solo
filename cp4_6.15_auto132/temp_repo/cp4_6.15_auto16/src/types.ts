export type Priority = 'high' | 'medium' | 'low';
export type TaskStatus = 'not_started' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  name: string;
  assignee: string;
  startDate: string;
  endDate: string;
  priority: Priority;
  progress: number;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
}

export interface FilterState {
  assignees: string[];
  priorities: Priority[];
  status: TaskStatus | 'all';
  keyword: string;
}

export interface ModalState {
  open: boolean;
  mode: 'create' | 'edit';
  taskId: string | null;
}
