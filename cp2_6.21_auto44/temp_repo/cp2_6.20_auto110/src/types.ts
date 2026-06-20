export type ReadingStatus = 'want' | 'reading' | 'read';

export interface Book {
  id: string;
  title: string;
  author: string;
  publisher: string;
  isbn: string;
  totalPages: number;
  currentPage: number;
  status: ReadingStatus;
  coverUrl: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: string;
  bookId: string;
  name: string;
  order: number;
}

export interface Note {
  id: string;
  chapterId: string;
  content: string;
  createdAt: string;
}

export interface Highlight {
  id: string;
  chapterId: string;
  text: string;
  pageLocation: string;
  createdAt: string;
}

export interface ReadingSession {
  id: string;
  bookId: string;
  chapterId: string;
  duration: number;
  date: string;
}

export interface MonthlyPages {
  month: string;
  pages: number;
}

export interface TagDistribution {
  tag: string;
  count: number;
  color: string;
}

export interface CumulativeDays {
  date: string;
  days: number;
}

export interface AnnualStats {
  monthlyPages: MonthlyPages[];
  tagDistribution: TagDistribution[];
  cumulativeDays: CumulativeDays[];
}
