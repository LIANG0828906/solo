export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type Priority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  estimatedHours: number;
  focusCount: number;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface FocusRecord {
  id: string;
  taskId: string | null;
  taskTitle: string;
  duration: number;
  startTime: string;
  endTime: string;
  status: 'completed' | 'interrupted';
}

export interface Statistics {
  totalFocusTime: number;
  completedTasks: number;
  avgFocusDuration: number;
  records: FocusRecord[];
}

export interface DailyStats {
  date: string;
  totalFocusTime: number;
  completedTasks: number;
}

export interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  duration: number;
  remainingTime: number;
  taskId: string | null;
  startTime: string | null;
}
