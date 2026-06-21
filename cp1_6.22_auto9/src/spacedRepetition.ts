import { addDays } from "date-fns";

export type Rating = "easy" | "medium" | "hard";

export interface CardData {
  id: string;
  front: string;
  back: string;
  category: string;
  tags: string[];
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudyStats {
  streakDays: number;
  lastStudyDate: string;
  totalReviewed: number;
  totalMastered: number;
}

const MIN_EASE_FACTOR = 1.3;

export function calculateNextReview(card: CardData, rating: Rating): CardData {
  let easeFactor = card.easeFactor;
  let interval = card.interval;
  let repetitions = card.repetitions + 1;

  switch (rating) {
    case "easy":
      easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor + 0.15);
      if (card.repetitions === 0) {
        interval = 4;
      } else if (card.repetitions === 1) {
        interval = Math.round(interval * easeFactor * 1.3);
      } else {
        interval = Math.round(interval * easeFactor * 1.3);
      }
      break;
    case "medium":
      if (card.repetitions === 0) {
        interval = 2;
      } else if (card.repetitions === 1) {
        interval = Math.round(interval * easeFactor);
      } else {
        interval = Math.round(interval * easeFactor);
      }
      break;
    case "hard":
      easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor - 0.2);
      interval = Math.max(1, Math.round(interval * 0.5));
      repetitions = 0;
      break;
  }

  const nextReview = addDays(new Date(), interval).toISOString();

  return {
    ...card,
    easeFactor,
    interval,
    repetitions,
    nextReview,
    updatedAt: new Date().toISOString(),
  };
}

export function isDue(card: CardData): boolean {
  const nextReview = new Date(card.nextReview);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  nextReview.setHours(0, 0, 0, 0);
  return nextReview <= now;
}

export function getDueCards(cards: CardData[]): CardData[] {
  return cards.filter(isDue);
}

export function getCardsForDate(cards: CardData[], date: Date): CardData[] {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  return cards.filter((card) => {
    const reviewDate = new Date(card.nextReview);
    reviewDate.setHours(0, 0, 0, 0);
    return reviewDate.getTime() === targetDate.getTime();
  });
}

export function createNewCard(
  front: string,
  back: string,
  category: string,
  tags: string[]
): CardData {
  const now = new Date().toISOString();
  return {
    id: "",
    front,
    back,
    category,
    tags,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: now,
    createdAt: now,
    updatedAt: now,
  };
}

export function getMasteryPercentage(cards: CardData[]): number {
  if (cards.length === 0) return 0;
  const mastered = cards.filter((c) => c.interval >= 21 && c.repetitions >= 3);
  return Math.round((mastered.length / cards.length) * 100);
}
