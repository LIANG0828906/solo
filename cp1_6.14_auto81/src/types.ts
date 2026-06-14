export type Category = 'programming' | 'history' | 'life' | 'other';
export type ReviewInterval = 1 | 3 | 7 | 14 | 30;
export type MemoryLevel = 'forgot' | 'hard' | 'normal' | 'easy';
export type LinkType = 'same-category' | 'cross-category' | 'manual';

export interface Card {
  id: string;
  title: string;
  category: Category;
  content: string;
  reviewInterval: ReviewInterval;
  lastReviewedAt: string | null;
  nextReviewAt: string;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  linkedCardIds: string[];
}

export interface CardLink {
  id: string;
  sourceId: string;
  targetId: string;
  type: LinkType;
  createdAt: string;
}

export interface GraphNode {
  id: string;
  title: string;
  category: Category;
  linkCount: number;
}

export interface GraphLink {
  source: string;
  target: string;
  type: LinkType;
  value: number;
}

export const CATEGORY_COLORS: Record<Category, string> = {
  programming: '#3498db',
  history: '#8b4513',
  life: '#27ae60',
  other: '#7f8c8d',
};

export const CATEGORY_LABELS: Record<Category, string> = {
  programming: '编程',
  history: '历史',
  life: '生活技巧',
  other: '其他',
};

export const VALID_INTERVALS: ReviewInterval[] = [1, 3, 7, 14, 30];

export const INTERVAL_LABELS: Record<ReviewInterval, string> = {
  1: '1天',
  3: '3天',
  7: '7天',
  14: '14天',
  30: '30天',
};
