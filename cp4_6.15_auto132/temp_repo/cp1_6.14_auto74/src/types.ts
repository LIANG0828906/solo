export interface Task {
  id: string;
  name: string;
  description: string;
  clue: string;
  lat: number;
  lng: number;
  points: number;
  difficulty: number;
  timeLimit: number;
  userStatus: 'active' | 'completed' | 'failed' | null;
  acceptedAt: number | null;
  userTaskId: string | null;
}

export interface UserTask {
  id: string;
  taskId: string;
  userId: string;
  acceptedAt: number;
  status: 'active' | 'completed' | 'failed';
}

export interface UserInfo {
  id: string;
  username: string;
  points: number;
  level: number;
  achievements: string[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string;
}

export interface ProfileData {
  id: string;
  username: string;
  points: number;
  level: number;
  userAchievements: Achievement[];
  completedCount: number;
  totalTasks: number;
}

export interface SubmitResult {
  distance: number;
  success: boolean;
  points: number;
  user: UserInfo;
}
