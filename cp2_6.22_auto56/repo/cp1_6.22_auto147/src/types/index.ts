export interface User {
  id: string;
  username: string;
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

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export interface FilterOptions {
  memberId?: string;
  tag?: string;
}
