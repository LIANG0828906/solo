export interface User {
  id: string;
  username: string;
  passwordHash: string;
  avatar?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'planned' | 'in-progress' | 'blocked' | 'completed';

export interface TaskUpdate {
  id: string;
  projectId: string;
  userId: string;
  targetUserId: string;
  status: TaskStatus;
  note: string;
  tags: string[];
  createdAt: string;
}

export interface WeeklyReport {
  userId: string;
  username: string;
  completed: number;
  blocked: number;
  inProgress: number;
  notes: string[];
}

export interface SafeUser {
  id: string;
  username: string;
  avatar?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
    }
  }
}
