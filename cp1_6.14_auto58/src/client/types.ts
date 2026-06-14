export interface User {
  id: string;
  username: string;
  name: string;
  avatar: string;
  role: 'member' | 'manager';
  createdAt: string;
}

export interface KeyResult {
  id: string;
  title: string;
  description?: string;
  progress: number;
  ownerId: string;
  deadline: string;
  score?: number;
  feedback?: string;
  priority: number;
  weeklyProgress: { week: number; progress: number }[];
  createdAt: string;
  updatedAt: string;
}

export interface Objective {
  id: string;
  title: string;
  description?: string;
  quarter: string;
  ownerId: string;
  keyResults: KeyResult[];
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface CreateObjectiveData {
  title: string;
  description?: string;
  quarter: string;
  keyResults: {
    title: string;
    description?: string;
    ownerId: string;
    deadline: string;
  }[];
}
