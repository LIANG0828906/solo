export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  coverUrl: string;
  publishYear: number;
  status: 'reading' | 'read' | 'want' | '';
  rating: number;
  tags: string[];
  addedAt: string;
}

export interface BookList {
  id: string;
  name: string;
  description: string;
  bookIds: string[];
  createdAt: string;
}

export interface BorrowRecord {
  id: string;
  bookId: string;
  borrowerName: string;
  borrowDate: string;
  expectedReturnDate: string;
  actualReturnDate: string | null;
  returned: boolean;
}

export interface OpenLibraryDoc {
  key: string;
  title: string;
  author_name?: string[];
  isbn?: string[];
  cover_i?: number;
  first_publish_year?: number;
}

export interface ReadingStats {
  totalRead: number;
  monthlyAvg: number;
  favoriteTag: string;
  monthlyTrend: number[];
}

export type ActiveView = 'search' | 'shelf' | 'lists';
