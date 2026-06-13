export interface Card {
  id: string;
  question: string;
  answer: string;
  nextReview: string;
  interval: number;
  easeFactor: number;
  repetitions: number;
}

export type Difficulty = 'hard' | 'medium' | 'easy';

export function calculateNextReview(card: Card, difficulty: Difficulty): Card {
  let { interval, easeFactor, repetitions } = card;

  switch (difficulty) {
    case 'hard':
      repetitions = 0;
      interval = Math.max(1, Math.floor(interval * 0.6));
      easeFactor = Math.max(1.3, easeFactor - 0.2);
      break;
    case 'medium':
      repetitions += 1;
      if (repetitions === 1) {
        interval = 1;
      } else if (repetitions === 2) {
        interval = 3;
      } else {
        interval = Math.floor(interval * easeFactor);
      }
      easeFactor = Math.max(1.3, easeFactor - 0.15);
      break;
    case 'easy':
      repetitions += 1;
      if (repetitions === 1) {
        interval = 4;
      } else {
        interval = Math.floor(interval * easeFactor * 1.3);
      }
      easeFactor = easeFactor + 0.15;
      break;
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    ...card,
    interval,
    easeFactor,
    repetitions,
    nextReview: nextReview.toISOString().split('T')[0]
  };
}

export function isDueForReview(card: Card): boolean {
  const today = new Date().toISOString().split('T')[0];
  return card.nextReview <= today;
}

export function sortByReviewDate(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => a.nextReview.localeCompare(b.nextReview));
}