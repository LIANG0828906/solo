export interface Card {
  id: string;
  front: string;
  back: string;
  correctCount: number;
  nextReviewDate: string;
  createdAt: string;
}

export interface Deck {
  id: string;
  name: string;
  cards: Card[];
  createdAt: string;
}

export type Page = 'home' | 'review';
