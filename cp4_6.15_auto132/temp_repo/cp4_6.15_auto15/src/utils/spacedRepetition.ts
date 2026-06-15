export interface Card {
  id: string;
  deckId: string;
  front: string;
  back: string;
  interval: number;
  easeFactor: number;
  repetitions: number;
  nextReviewDate: string;
  correctCount: number;
  wrongCount: number;
}

export type Rating = 'easy' | 'normal' | 'hard';

const DAY_MS = 24 * 60 * 60 * 1000;

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function parseDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00');
}

export function isDueToday(card: Card): boolean {
  const today = formatDate(new Date());
  return card.nextReviewDate <= today;
}

export function calculateNextReview(card: Card, rating: Rating): Card {
  let { interval, easeFactor, repetitions } = card;

  switch (rating) {
    case 'hard':
      repetitions = 0;
      interval = 1;
      easeFactor = Math.max(1.3, easeFactor - 0.2);
      break;
    case 'normal':
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 3;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions += 1;
      easeFactor = Math.max(1.3, easeFactor - 0.05);
      break;
    case 'easy':
      if (repetitions === 0) {
        interval = 2;
      } else if (repetitions === 1) {
        interval = 4;
      } else {
        interval = Math.round(interval * easeFactor * 1.3);
      }
      repetitions += 1;
      easeFactor = easeFactor + 0.15;
      break;
  }

  const nextDate = new Date(Date.now() + interval * DAY_MS);

  const updatedCorrect = rating === 'hard' ? card.correctCount : card.correctCount + 1;
  const updatedWrong = rating === 'hard' ? card.wrongCount + 1 : card.wrongCount;

  return {
    ...card,
    interval,
    easeFactor: Math.round(easeFactor * 100) / 100,
    repetitions,
    nextReviewDate: formatDate(nextDate),
    correctCount: updatedCorrect,
    wrongCount: updatedWrong,
  };
}

export function createNewCard(deckId: string, front: string, back: string): Card {
  const today = formatDate(new Date());
  return {
    id: generateId(),
    deckId,
    front,
    back,
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0,
    nextReviewDate: today,
    correctCount: 0,
    wrongCount: 0,
  };
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function getCardMastery(card: Card): number {
  const total = card.correctCount + card.wrongCount;
  if (total === 0) return 0;
  const accuracy = card.correctCount / total;
  const repFactor = Math.min(1, card.repetitions / 5);
  return Math.round((accuracy * 0.6 + repFactor * 0.4) * 100);
}

export function getDeckMastery(cards: Card[]): number {
  if (cards.length === 0) return 0;
  const total = cards.reduce((sum, c) => sum + getCardMastery(c), 0);
  return Math.round(total / cards.length);
}

export function getDueCards(cards: Card[]): Card[] {
  return cards.filter(isDueToday);
}

export interface DailyLog {
  date: string;
  reviewed: number;
  correct: number;
}

export function getLast7DaysDays(): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(formatDate(d));
  }
  return days;
}

export function getCalendarDays(year: number, month: number): (string | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startWeekday = firstDay.getDay();

  const result: (string | null)[] = [];
  for (let i = 0; i < startWeekday; i++) {
    result.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    result.push(formatDate(date));
  }
  return result;
}
