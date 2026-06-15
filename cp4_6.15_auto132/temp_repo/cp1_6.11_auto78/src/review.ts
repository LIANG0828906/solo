import type { Card, CardGroup } from './card';
import { getNextCard, sortCardsByPriority, getIntervalDays } from './card';
import { updateCardReview } from './api';

type Listener = (...args: any[]) => void;

class EventEmitter {
  private listeners: Map<string, Set<Listener>> = new Map();

  on(event: string, cb: Listener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(cb);
    return () => this.off(event, cb);
  }

  off(event: string, cb: Listener): void {
    this.listeners.get(event)?.delete(cb);
  }

  emit(event: string, ...args: any[]): void {
    this.listeners.get(event)?.forEach(cb => {
      try { cb(...args); } catch (e) { console.error(e); }
    });
  }
}

export class ReviewState extends EventEmitter {
  public group: CardGroup;
  public queue: Card[];
  public currentIndex: number;
  public currentCard: Card | null;
  public isFlipped: boolean;
  public reviewedCount: number;
  public reviewedToday: number;

  constructor(group: CardGroup) {
    super();
    this.group = group;
    this.queue = sortCardsByPriority(group.cards);
    this.currentIndex = Math.min(group.currentIndex || 0, this.queue.length - 1);
    this.reviewedCount = 0;
    this.reviewedToday = group.reviewedToday || 0;
    this.isFlipped = false;
    this.currentCard = this.queue.length > 0 ? this.queue[this.currentIndex] : null;
    this.findNextDueCard();
  }

  private findNextDueCard(): void {
    if (this.queue.length === 0) return;
    const due = getNextCard(this.queue);
    if (due) {
      const idx = this.queue.findIndex(c => c.id === due.id);
      if (idx >= 0) {
        this.currentIndex = idx;
        this.currentCard = due;
      }
    }
  }

  flipCard(): boolean {
    this.isFlipped = !this.isFlipped;
    this.emit('cardFlipped', this.isFlipped);
    return this.isFlipped;
  }

  resetFlip(): void {
    this.isFlipped = false;
    this.emit('cardFlipped', false);
  }

  async recordFeedback(level: 1 | 2 | 3): Promise<void> {
    if (!this.currentCard) return;

    const cardId = this.currentCard.id;
    let newLevel = this.currentCard.memoryLevel;

    if (level === 1) {
      newLevel = 1;
    } else if (level === 2) {
      newLevel = Math.max(1, newLevel);
    } else if (level === 3) {
      newLevel = Math.min(5, newLevel + 1);
    }

    const intervalDays = getIntervalDays(newLevel);
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + intervalDays);
    const nextReviewDate = nextDate.toISOString();

    try {
      const result = await updateCardReview(cardId, {
        groupId: this.group.id,
        feedback: level
      });
      this.reviewedToday = result.reviewedToday;
    } catch (e) {
      console.warn('同步服务端失败，仅本地更新', e);
    }

    const cardIdx = this.group.cards.findIndex(c => c.id === cardId);
    if (cardIdx >= 0) {
      this.group.cards[cardIdx].memoryLevel = newLevel;
      this.group.cards[cardIdx].nextReviewDate = nextReviewDate;
    }

    const qIdx = this.queue.findIndex(c => c.id === cardId);
    if (qIdx >= 0) {
      this.queue[qIdx].memoryLevel = newLevel;
      this.queue[qIdx].nextReviewDate = nextReviewDate;
    }

    this.reviewedCount++;

    this.emit('feedbackRecorded', {
      cardId,
      level,
      newLevel,
      nextReviewDate
    });

    this.emit('progressUpdated', {
      reviewedCount: this.reviewedCount,
      reviewedToday: this.reviewedToday,
      totalCards: this.group.cards.length,
      currentIndex: this.currentIndex
    });
  }

  advanceToNextCard(): boolean {
    this.isFlipped = false;

    if (this.queue.length === 0) {
      this.currentCard = null;
      this.emit('cardChanged', null);
      return false;
    }

    const remaining = this.queue.filter(c => {
      return new Date(c.nextReviewDate).getTime() <= Date.now();
    });

    if (remaining.length === 0 || remaining.every(c => c.id === this.currentCard?.id)) {
      this.queue = sortCardsByPriority(this.queue);
      const nextDue = getNextCard(this.queue);
      if (nextDue && nextDue.id !== this.currentCard?.id) {
        this.currentCard = nextDue;
        this.currentIndex = this.queue.findIndex(c => c.id === nextDue.id);
      } else if (this.queue.length > 0) {
        this.currentIndex = (this.currentIndex + 1) % this.queue.length;
        this.currentCard = this.queue[this.currentIndex];
      } else {
        this.currentCard = null;
      }
    } else {
      const otherDue = remaining.find(c => c.id !== this.currentCard?.id);
      if (otherDue) {
        this.currentCard = otherDue;
        this.currentIndex = this.queue.findIndex(c => c.id === otherDue.id);
      } else {
        this.currentIndex = (this.currentIndex + 1) % this.queue.length;
        this.currentCard = this.queue[this.currentIndex];
      }
    }

    this.emit('cardChanged', this.currentCard);
    this.emit('cardFlipped', false);
    return this.currentCard !== null;
  }

  getDueCount(): number {
    const now = Date.now();
    return this.queue.filter(c => new Date(c.nextReviewDate).getTime() <= now).length;
  }

  getStats() {
    return {
      total: this.group.cards.length,
      reviewed: this.reviewedCount,
      reviewedToday: this.reviewedToday,
      due: this.getDueCount()
    };
  }
}
