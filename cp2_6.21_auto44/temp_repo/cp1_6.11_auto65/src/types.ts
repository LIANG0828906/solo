export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'warning';

export interface Task {
  id: string;
  name: string;
  assignee: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: TaskStatus;
  parentId?: string;
  dependencies: string[];
  color: string;
}

export interface Dependency {
  id: string;
  fromTaskId: string;
  toTaskId: string;
}

export type ViewMode = 'day' | 'week' | 'month';

export interface GanttConfig {
  viewMode: ViewMode;
  dayWidth: number;
  rowHeight: number;
  startDate: Date;
  endDate: Date;
  totalDays: number;
}

export interface DragState {
  isDragging: boolean;
  type: 'move' | 'resize' | 'progress' | 'dependency' | null;
  taskId: string | null;
  startX: number;
  startY: number;
  initialStartDate?: string;
  initialEndDate?: string;
  initialProgress?: number;
  fromTaskId?: string;
}

export interface Point {
  x: number;
  y: number;
}
