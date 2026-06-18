export interface User {
  id: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  createdAt?: string;
}

export interface Book {
  id: string;
  userId?: string;
  isbn?: string;
  title: string;
  authors: string[];
  coverUrl?: string;
  description?: string;
  tags?: string[];
  rating?: number;
  status?: 'reading' | 'finished' | 'wishlist';
  pagesRead?: number;
  totalPages?: number;
  createdAt?: string;
}

export interface BookMetadata {
  isbn: string;
  title: string;
  authors: string[];
  coverUrl: string;
  description: string;
  publishDate?: string;
  pageCount?: number;
}

export interface Comment {
  id: string;
  shelfId?: string;
  username: string;
  content: string;
  createdAt?: string;
}

export interface BookShelf {
  id: string;
  userId?: string;
  name: string;
  description?: string;
  theme?: string;
  bookIds: string[];
  coverMosaic: string[];
  isPublic: boolean;
  likes: number;
  comments: Comment[];
  books?: Book[];
  owner?: string;
  createdAt?: string;
}

export interface ReadingStats {
  totalBooksRead: number;
  monthlyPages: number;
  averageRating: number;
  currentStreak: number;
}
