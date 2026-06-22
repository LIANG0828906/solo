export interface Flashcard {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  interval: number;
  repetitions: number;
  easeFactor: number;
  nextReviewDate: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type Rating = 0 | 1 | 2;
