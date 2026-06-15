import type { Difficulty } from '../types';

const BASE_INTERVAL = 1.5;

export function calculateNextInterval(
  currentInterval: number,
  difficulty: Difficulty,
  initialDifficulty: Difficulty
): number {
  const initialInterval = getInitialInterval(initialDifficulty);
  
  switch (difficulty) {
    case 'easy':
      return Math.max(currentInterval * 2, initialInterval * BASE_INTERVAL);
    case 'medium':
      return Math.max(currentInterval * BASE_INTERVAL, initialInterval);
    case 'hard':
      return initialInterval;
    default:
      return initialInterval;
  }
}

export function getInitialInterval(difficulty: Difficulty): number {
  switch (difficulty) {
    case 'easy':
      return 1;
    case 'medium':
      return 1.5;
    case 'hard':
      return 2;
    default:
      return 1;
  }
}

export function getDifficultyScore(difficulty: Difficulty): number {
  switch (difficulty) {
    case 'easy':
      return 5;
    case 'medium':
      return 3;
    case 'hard':
      return 1;
    default:
      return 3;
  }
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + Math.ceil(days));
  return result;
}

export function isOverdue(nextReviewDate: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const reviewDate = new Date(nextReviewDate);
  reviewDate.setHours(0, 0, 0, 0);
  return reviewDate < today;
}

export function getDaysOverdue(nextReviewDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const reviewDate = new Date(nextReviewDate);
  reviewDate.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - reviewDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}
