export interface User {
  id: string;
  nickname: string;
  avatar: string;
  points: number;
  totalReviews: number;
  averageRating: number;
}

export interface Skill {
  id: string;
  userId: string;
  name: string;
  description: string;
  shortDesc: string;
  price: number;
  likes: number;
  reviewCount: number;
  averageRating: number;
  createdAt: Date;
}

export interface Task {
  id: string;
  skillId: string;
  requesterId: string;
  helperId: string;
  status: 'in_progress' | 'pending_review' | 'completed';
  createdAt: Date;
  expiresAt: Date;
  completedAt?: Date;
  requesterRated?: boolean;
  helperRated?: boolean;
}

export interface Rating {
  id: string;
  taskId: string;
  fromUserId: string;
  toUserId: string;
  stars: number;
  isPositive: boolean;
  createdAt: Date;
}

export type Toast = {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'error';
};

export type AnimState = {
  pointsBounce: boolean;
  shakeTrigger: number;
  completedTaskIds: string[];
};
