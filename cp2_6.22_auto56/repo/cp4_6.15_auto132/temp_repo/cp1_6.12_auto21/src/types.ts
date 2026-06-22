export type BookCategory = 'literature' | 'science' | 'history' | 'art' | 'children' | 'lifestyle';

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: BookCategory;
  shelfId: string;
  slotIndex: number;
  borrowCount: number;
  coverColor: string;
}

export interface Shelf {
  id: string;
  name: string;
  zone: string;
  categories: BookCategory[];
  slots: ShelfSlot[];
  position: { x: number; y: number };
}

export interface ShelfSlot {
  index: number;
  bookId: string | null;
  category: BookCategory;
}

export interface LocationEvent {
  bookId: string;
  targetShelfId: string;
  targetSlotIndex: number;
  timestamp: number;
}

export interface MisplaceAlert {
  id: string;
  book: Book;
  wrongShelfId: string;
  wrongSlotIndex: number;
  correctShelfId: string;
  correctSlotIndex: number;
  timestamp: number;
  acknowledged: boolean;
}

export interface GuidePath {
  steps: PathStep[];
  totalDistance: number;
}

export interface PathStep {
  from: { x: number; y: number };
  to: { x: number; y: number };
  direction: 'up' | 'down' | 'left' | 'right';
  distance: number;
}

export interface ReaderProfile {
  ageGroup: 'children' | 'youth' | 'adult' | 'senior';
  borrowCount: number;
  topBooks: Book[];
  percentage: number;
}

export interface HeatmapSlot {
  shelfId: string;
  slotIndex: number;
  intensity: number;
}

export const CATEGORY_COLORS: Record<BookCategory, string> = {
  literature: '#4A90D9',
  science: '#27AE60',
  history: '#E67E22',
  art: '#8E44AD',
  children: '#F1C40F',
  lifestyle: '#E91E8B',
};

export const CATEGORY_LABELS: Record<BookCategory, string> = {
  literature: '文学',
  science: '科技',
  history: '历史',
  art: '艺术',
  children: '少儿',
  lifestyle: '生活',
};

export const AGE_GROUP_LABELS: Record<string, string> = {
  children: '少儿',
  youth: '青年',
  adult: '成人',
  senior: '老年',
};
