export interface Board {
  id: string;
  name: string;
  createdAt: number;
  cardCount?: number;
}

export interface Card {
  id: string;
  boardId: string;
  title: string;
  author: string;
  excerpt: string;
  insight: string;
  tags: string[];
  createdAt: number;
}

export type SortOrder = 'asc' | 'desc';
