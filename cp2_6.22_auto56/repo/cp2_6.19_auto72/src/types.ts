export interface HighlightRange {
  start: number;
  end: number;
}

export interface Excerpt {
  id: string;
  bookId: string;
  content: string;
  createdAt: string;
  highlights: HighlightRange[];
}

export type ReadingStatus = 'reading' | 'finished' | 'wishlist';

export interface Book {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  progress: number;
  status: ReadingStatus;
  gradientColor: string;
  createdAt: string;
  updatedAt: string;
  progressHistory?: { date: string; progress: number }[];
}

export type FilterType = 'all' | ReadingStatus;

export interface WeeklyStat {
  week: string;
  hours: number;
}
