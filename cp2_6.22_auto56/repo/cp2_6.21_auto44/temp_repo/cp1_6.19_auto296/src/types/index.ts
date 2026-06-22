export interface User {
  id: string;
  username: string;
  name: string;
  avatarColor: string;
  role: 'admin' | 'member';
}

export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assigneeId: string;
  dueDate: string;
  estimatedHours: number;
  remainingHours: number;
  attachmentUrl?: string;
  createdAt: string;
}

export interface TimeLog {
  id: string;
  taskId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  duration: number;
  createdAt: string;
}

export interface Member {
  id: string;
  name: string;
  avatarColor: string;
  weeklyHours: number;
}

export interface BurndownPoint {
  date: string;
  idealHours: number;
  actualHours: number;
}

export interface WeeklyReportData {
  days: string[];
  tasks: { id: string; title: string }[];
  dailyHours: (number | null)[][];
  taskTotals: number[];
  timeLogsByTask: Record<string, TimeLog[]>;
}
