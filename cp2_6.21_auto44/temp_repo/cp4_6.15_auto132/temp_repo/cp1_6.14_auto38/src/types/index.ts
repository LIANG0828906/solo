export interface Member {
  id: string;
  name: string;
  avatar: string;
  points: number;
  isAdmin: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export type TaskCycle = 'daily' | 'weekly';
export type TaskStatus = 'pending' | 'completed' | 'expired';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  points: number;
  cycle: TaskCycle;
  deadline: string;
  assigneeId: string | null;
  status: TaskStatus;
  completedAt?: string;
  createdAt: string;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  points: number;
  stock: number;
  image?: string;
}

export interface WeeklyReportMemberStats {
  memberId: string;
  completedTasks: number;
  totalPoints: number;
  completionRate: number;
  categoryStats: Record<string, number>;
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  members: WeeklyReportMemberStats[];
}

export interface Redemption {
  id: string;
  memberId: string;
  rewardId: string;
  points: number;
  createdAt: string;
}
