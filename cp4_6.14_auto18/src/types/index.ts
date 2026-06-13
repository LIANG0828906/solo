export type Difficulty = 'easy' | 'medium' | 'hard';

export interface ReviewRecord {
  date: string;
  difficulty: Difficulty;
  score: number;
}

export interface Card {
  id: string;
  front: string;
  back: string;
  tags: string[];
  initialDifficulty: Difficulty;
  currentInterval: number;
  nextReviewDate: string;
  reviewHistory: ReviewRecord[];
  createdAt: string;
}

export interface ReviewStats {
  todayReviewed: number;
  averageRecallScore: number;
  dueCardsCount: number;
  dailyReviewCounts: { date: string; count: number }[];
}
