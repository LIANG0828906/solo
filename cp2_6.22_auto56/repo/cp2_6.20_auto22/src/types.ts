export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  name: string;
  startDate: string;
  endDate: string;
  assigneeId: string | null;
  dependencies: string[];
  estimatedHours: number;
  progress: number;
}

export interface Resource {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  dailyCapacity: number;
}

export interface ResourceCalendar {
  date: string;
  resourceId: string;
  hours: number;
}

export type ViewMode = 'month' | 'week';

export interface DragState {
  taskId: string | null;
  type: 'start' | 'end' | 'move' | null;
  startX: number;
  originalStart: string;
  originalEnd: string;
}

export interface DependencyConflict {
  taskId: string;
  dependentId: string;
  message: string;
}
