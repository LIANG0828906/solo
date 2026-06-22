export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  totalPages: number;
  currentPage: number;
  publishYear: number;
  coverUrl: string;
  readingStatus: 'unread' | 'reading' | 'finished';
  createdAt: string;
  updatedAt: string;
}

export interface ReadingRecord {
  id: string;
  bookId: string;
  startPage: number;
  endPage: number;
  duration: number;
  date: string;
  notes: string;
  createdAt: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface CategoryStats {
  name: string;
  value: number;
  percentage: number;
}

export interface MonthlyReadingStats {
  month: string;
  hours: number;
}

export interface DailyPageStats {
  date: string;
  pages: number;
}

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}
