import { create } from 'zustand';
import { isToday } from 'date-fns';

export type Tag = '数学' | '英语' | '历史' | '编程';

export interface Card {
  id: string;
  front: string;
  back: string;
  tag: Tag;
  createdAt: number;
  nextReview: number;
  weight: number;
  lastReviewAt: number | null;
}

export interface ReviewLogEntry {
  cardId: string;
  time: number;
  result: 'remembered' | 'forgot';
}

interface CardStore {
  cards: Card[];
  reviewLog: ReviewLogEntry[];
  addCard: (front: string, back: string, tag: Tag) => void;
  reviewCard: (cardId: string, result: 'remembered' | 'forgot') => void;
  getNextCard: () => Card | null;
  getTodayReviewedCount: () => number;
  getStreak: () => number;
}

export const useCardStore = create<CardStore>((set, get) => ({
  cards: [],
  reviewLog: [],

  addCard: (front, back, tag) => {
    const card: Card = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      front,
      back,
      tag,
      createdAt: Date.now(),
      nextReview: Date.now(),
      weight: 1,
      lastReviewAt: null,
    };
    set(state => ({ cards: [...state.cards, card] }));
  },

  reviewCard: (cardId, result) => {
    const now = Date.now();
    set(state => {
      const cards = state.cards.map(c => {
        if (c.id !== cardId) return c;
        return {
          ...c,
          nextReview:
            result === 'remembered'
              ? now + 3 * 24 * 60 * 60 * 1000
              : now + 4 * 60 * 60 * 1000,
          weight: result === 'forgot' ? c.weight * 2 : c.weight,
          lastReviewAt: now,
        };
      });

      const newLog: ReviewLogEntry = { cardId, time: now, result };
      const reviewLog = [newLog, ...state.reviewLog].slice(0, 500);

      return { cards, reviewLog };
    });
  },

  getNextCard: () => {
    const { cards } = get();
    const now = Date.now();
    const dueCards = cards.filter(c => c.nextReview <= now);
    if (dueCards.length === 0) return null;

    const weighted = dueCards.map(c => {
      let w = c.weight;
      if (c.lastReviewAt && now - c.lastReviewAt < 24 * 60 * 60 * 1000) {
        w *= 0.5;
      }
      if (c.lastReviewAt) {
        const hoursSinceReview = Math.max(
          1,
          (now - c.lastReviewAt) / (60 * 60 * 1000)
        );
        w *= hoursSinceReview;
      }
      return { card: c, weight: w };
    });

    const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;
    for (const { card, weight } of weighted) {
      random -= weight;
      if (random <= 0) return card;
    }
    return weighted[weighted.length - 1].card;
  },

  getTodayReviewedCount: () => {
    return get().reviewLog.filter(l => isToday(l.time)).length;
  },

  getStreak: () => {
    const { reviewLog } = get();
    let count = 0;
    for (const entry of reviewLog) {
      if (entry.result === 'remembered') count++;
      else break;
    }
    return count;
  },
}));
