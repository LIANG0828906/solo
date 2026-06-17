export interface Task {
  id: string;
  title: string;
  assignee: string;
  status: 'todo' | 'in-progress' | 'done';
  estimatedHours: number;
  actualHours: number;
  createdAt: string;
  description?: string;
}

export interface Stats {
  person: string;
  totalHours: number;
  taskCount: number;
  totalEstimatedHours: number;
  totalActualHours: number;
  tasks: Task[];
}

export interface StatsParams {
  startDate?: string;
  endDate?: string;
  person?: string;
}
