export type ExplorationType = 'cafe' | 'bookstore' | 'graffiti' | 'architecture' | 'hidden_shop' | 'other';

export const ExplorationTypeLabels: Record<ExplorationType, string> = {
  cafe: '咖啡馆',
  bookstore: '书店',
  graffiti: '涂鸦墙',
  architecture: '独特建筑',
  hidden_shop: '隐蔽小店',
  other: '其他',
};

export const ExplorationTypeColors: Record<ExplorationType, string> = {
  cafe: '#f97316',
  bookstore: '#3b82f6',
  graffiti: '#a855f7',
  architecture: '#10b981',
  hidden_shop: '#ec4899',
  other: '#64748b',
};

export interface User {
  id: string;
  nickname: string;
  avatar: string;
}

export interface Exploration {
  id: string;
  title: string;
  description: string;
  type: ExplorationType;
  images: string[];
  lat: number;
  lng: number;
  address?: string;
  ratingCount: number;
  ratingSum: number;
  avgRating: number;
  visitCount: number;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface Comment {
  id: string;
  explorationId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  images: string[];
  rating: number;
  createdAt: number;
}

export interface Favorite {
  id: string;
  explorationId: string;
  userId: string;
  createdAt: number;
}

export interface ExplorationDetail {
  exploration: Exploration;
  comments: Comment[];
  ratingDistribution: Record<number, number>;
  isFavorited: boolean;
}

export interface CreateExplorationPayload {
  title: string;
  description: string;
  type: ExplorationType;
  images: string[];
  lat: number;
  lng: number;
  address?: string;
}

export interface CreateCommentPayload {
  explorationId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  images: string[];
  rating: number;
}

export interface DatabaseSchema {
  users: User[];
  explorations: Exploration[];
  comments: Comment[];
  favorites: Favorite[];
}
