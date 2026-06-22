export interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  rating: number;
  recommendation: string;
  description: string;
  chapters: string[];
}

export interface CheckInRecord {
  id: string;
  date: string;
  duration: number;
  startPage: number;
  endPage: number;
  note: string;
}

export interface Comment {
  id: string;
  bookId: string;
  userId: string;
  userName: string;
  avatar: string;
  content: string;
  likes: number;
  replies: Comment[];
  createdAt: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  target: number;
  condition: string;
}

export interface BookList {
  id: string;
  name: string;
  type: 'want' | 'reading' | 'read';
  cover: string;
  books: Book[];
  order: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

export type CommentSortType = 'latest' | 'popular';

export type BookListType = 'want' | 'reading' | 'read';
