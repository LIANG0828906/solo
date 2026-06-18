export type Category = '文学' | '科学' | '历史' | '艺术' | '哲学';

export interface Book {
  id: string;
  title: string;
  author: string;
  category: Category;
  coverColor: string;
  popularity: number;
  puzzleCompletion: number;
  totalPuzzleAttempts: number;
}

export interface ScrapPiece {
  id: string;
  bookId: string;
  order: number;
  content: string;
}

export interface Annotation {
  id: string;
  bookId: string;
  sentenceIndex: number;
  content: string;
  createdAt: number;
}

export interface AppState {
  books: Book[];
  annotations: Annotation[];
  completedPuzzles: Record<string, boolean>;
  currentCategory: Category | '全部';
  selectedBookId: string | null;
  isScrapPanelOpen: boolean;
}

export const CATEGORY_COLORS: Record<Category, string> = {
  文学: '#C71585',
  科学: '#0047AB',
  历史: '#C2B280',
  艺术: '#8A2BE2',
  哲学: '#50C878',
};
