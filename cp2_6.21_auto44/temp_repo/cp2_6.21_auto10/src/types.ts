export type BookStatus = 'unread' | 'reading' | 'finished';

export interface Note {
  id: string;
  date: string;
  content: string;
  tags: string[];
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  status: BookStatus;
  progress: number;
  startDate: string;
  endDate: string;
  lastUpdated: string;
  notes: Note[];
}

export interface AppData {
  books: Book[];
  version: string;
}

export interface SearchResult {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
}
