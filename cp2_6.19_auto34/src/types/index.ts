export type Priority = 'high' | 'medium' | 'low';

export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  assignee: string | null;
  estimate: number;
  sprintId: string | null;
  createdAt: string;
}

export interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  teamMembers: string[];
}

export interface TeamMember {
  id: string;
  name: string;
}

export interface BurndownPoint {
  date: string;
  ideal: number;
  actual: number;
}

export type PriorityFilter = 'all' | Priority;
export type StatusFilter = 'all' | TaskStatus;
