export interface Skill {
  id: string;
  name: string;
  level: number;
  hoursPerWeek: number;
  description?: string;
}

export interface User {
  id: string;
  nickname: string;
  avatar: string;
  bio: string;
  skills: Skill[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'applied' | 'completed';
  requiredSkills: Skill[];
  estimatedHours: number;
  publisherId: string;
  publisher: User;
  createdAt: string;
}

export interface Exchange {
  id: string;
  taskId: string;
  task: Task;
  applicantId: string;
  applicant: User;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  matchedSkills: Skill[];
  createdAt: string;
}

export interface LoginRequest {
  nickname: string;
  password: string;
}

export interface RegisterRequest {
  nickname: string;
  password: string;
  avatar: string;
  bio: string;
  skills: Omit<Skill, 'id'>[];
}

export interface AuthResponse {
  user: User;
  token: string;
}
