export type TaskStatus = 'todo' | 'in-progress' | 'completed';
export type TaskPriority = 'high' | 'medium' | 'low';
export type UserRole = 'PM' | 'Dev';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatarColor: string;
}

export interface Task {
  id: string;
  projectId: string;
  name: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  assigneeName: string;
  startDate: string;
  endDate: string;
  dependencies: string[];
  dependents: string[];
  milestoneId?: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  date: string;
  completed: boolean;
  taskIds: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  ownerName: string;
  deadline: string;
  avatarColor: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  message: string;
  userId: string;
  userName: string;
  type: 'task-created' | 'task-updated' | 'task-completed' | 'task-dragged';
  timestamp: number;
}

export type SocketEvent =
  | 'task:created'
  | 'task:updated'
  | 'task:deleted'
  | 'task:dependency-added'
  | 'milestone:created'
  | 'milestone:updated'
  | 'project:created'
  | 'notification';
