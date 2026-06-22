export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'high' | 'medium' | 'low';
  assignee: string;
  storyPoints: number;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface DailyBurndown {
  day: number;
  date: string;
  ideal: number;
  actual: number;
}

export interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  totalStoryPoints: number;
  dailyBurndown: DailyBurndown[];
}

export interface User {
  id: string;
  name: string;
  online: boolean;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  taskId?: string;
  taskTitle?: string;
  timestamp: string;
}
