export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  deadline: string;
  status: TaskStatus;
  creatorId: string;
  creatorName: string;
  assigneeId?: string;
  assigneeName?: string;
  totalHours: number;
  createdAt: number;
  updatedAt: number;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  duration: number;
  timestamp: number;
  date: string;
}

export interface User {
  id: string;
  name: string;
  createdAt: number;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  totalHours: number;
  completedTasks: number;
  rank: number;
}

export interface DailyHours {
  date: string;
  hours: number;
}
