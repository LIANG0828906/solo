export type InspirationCategory = 'text' | 'image' | 'music' | 'video' | 'other';

export interface Inspiration {
  id: string;
  title: string;
  description: string;
  category: InspirationCategory;
  tagIds: string[];
  createdAt: number;
}

export type Priority = 'high' | 'medium' | 'low';

export interface Project {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  startDate: number;
  endDate: number;
  sourceInspirationId: string | null;
  createdAt: number;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  estimatedHours: number;
  startDate: number;
  durationDays: number;
  dependencyIds: string[];
  status: TaskStatus;
  order: number;
}

export type LogStatus = 'completed' | 'progress' | 'blocked';

export interface ProgressLog {
  id: string;
  taskId: string;
  content: string;
  status: LogStatus;
  imageUrl: string | null;
  createdAt: number;
}

export interface Tag {
  id: string;
  name: string;
}

export interface AppData {
  inspirations: Inspiration[];
  projects: Project[];
  tasks: Task[];
  progressLogs: ProgressLog[];
  tags: Tag[];
}

export interface ReportData {
  project: Project;
  tasks: Task[];
  logs: ProgressLog[];
  totalHours: number;
  totalDays: number;
  phaseBreakdown: { title: string; hours: number; percentage: number; color?: string }[];
  avgDailyHours: number;
  completionRate: number;
}
