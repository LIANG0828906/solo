export interface User {
  id: string;
  nickname: string;
  dailyGoal: number;
  createdAt: string;
}

export interface Task {
  id: string;
  name: string;
  estimatedMinutes: number;
  deadline: string;
  completed: boolean;
  completedMinutes: number;
  projectId: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  tasks: Task[];
}

export interface StudyRecord {
  id: string;
  date: string;
  content: string;
  minutes: number;
  projectId?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type RecordLevel = 'none' | 'light' | 'medium' | 'deep';
