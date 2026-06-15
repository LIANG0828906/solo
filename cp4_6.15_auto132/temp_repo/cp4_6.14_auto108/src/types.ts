export interface Card {
  id: string;
  question: string;
  answer: string;
  category: string;
  difficulty: number;
  createdAt: string;
  reviewCount: number;
  lastReviewDate: string | null;
  nextReviewDate: string | null;
  rememberCount: number;
}

export interface CardCreate {
  question: string;
  answer: string;
  category: string;
  difficulty: number;
}

export interface Stats {
  total: number;
  reviewed: number;
  todayReviewed: number;
  rememberRate: number;
  categoryCounts: Record<string, number>;
}

export const CATEGORIES = ['语文', '数学', '英语', '科学', '历史', '其他'] as const;
