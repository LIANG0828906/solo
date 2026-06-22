export type TaskStatus = 'open' | 'claimed' | 'completed' | 'reviewed';

export type TaskCategory = '跑腿代办' | '家政服务' | '工具借用' | '技能互助' | '宠物照料' | '其他';

export interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  category: TaskCategory;
  publisherId: string;
  publisherName: string;
  claimantId?: string;
  claimantName?: string;
  status: TaskStatus;
  rating?: number;
  createdAt: Date;
  claimedAt?: Date;
  completedAt?: Date;
}

export interface User {
  id: string;
  nickname: string;
  avatar: string;
  points: number;
  level: number;
  completedCount: number;
  avgRating: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'completed' | 'reviewed' | 'claimed';
  content: string;
  taskId: string;
  read: boolean;
  createdAt: Date;
}

export interface PointsChange {
  old: number;
  new: number;
  timestamp: number;
}
