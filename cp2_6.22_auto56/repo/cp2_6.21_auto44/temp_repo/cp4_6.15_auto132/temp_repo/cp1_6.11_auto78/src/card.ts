export interface Card {
  id: string;
  front: string;
  back: string;
  memoryLevel: number;
  nextReviewDate: string;
  createDate: string;
}

export interface CardGroup {
  id: string;
  name: string;
  owner: string;
  createDate: string;
  lastReviewDate: string | null;
  reviewedToday: number;
  lastReviewDay: string | null;
  currentIndex: number;
  cards: Card[];
}

export interface CardGroupSummary {
  id: string;
  name: string;
  owner: string;
  createDate: string;
  cardCount: number;
  reviewedToday: number;
}

export function getNextCard(cards: Card[], now?: Date): Card | null {
  const currentTime = (now || new Date()).getTime();
  const dueCards = cards.filter(card => {
    const nextTime = new Date(card.nextReviewDate).getTime();
    return nextTime <= currentTime;
  });

  if (dueCards.length === 0) {
    return null;
  }

  dueCards.sort((a, b) => a.memoryLevel - b.memoryLevel);
  return dueCards[0];
}

export function sortCardsByPriority(cards: Card[], now?: Date): Card[] {
  const currentTime = (now || new Date()).getTime();
  return [...cards].sort((a, b) => {
    const aDue = new Date(a.nextReviewDate).getTime() <= currentTime ? 0 : 1;
    const bDue = new Date(b.nextReviewDate).getTime() <= currentTime ? 0 : 1;
    if (aDue !== bDue) return aDue - bDue;
    if (a.memoryLevel !== b.memoryLevel) return a.memoryLevel - b.memoryLevel;
    return new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime();
  });
}

export function getMemoryStats(cards: Card[]): { high: number; mid: number; low: number; total: number } {
  let high = 0;
  let mid = 0;
  let low = 0;

  for (const card of cards) {
    if (card.memoryLevel >= 4) {
      high++;
    } else if (card.memoryLevel >= 2) {
      mid++;
    } else {
      low++;
    }
  }

  return { high, mid, low, total: cards.length };
}

export function getDaysUntilReview(card: Card, now?: Date): number {
  const currentTime = (now || new Date()).getTime();
  const nextTime = new Date(card.nextReviewDate).getTime();
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.ceil((nextTime - currentTime) / msPerDay);
}

export function getIntervalDays(memoryLevel: number): number {
  const level = Math.max(1, Math.min(5, memoryLevel));
  return Math.pow(2, level - 1);
}
