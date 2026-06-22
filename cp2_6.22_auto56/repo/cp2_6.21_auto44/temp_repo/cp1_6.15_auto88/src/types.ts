export type BookStatus = 'available' | 'borrowed';

export interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  status: BookStatus;
  borrower?: string;
  borrowTime?: string;
  borrowCount: number;
  description?: string;
}

export interface BorrowRecord {
  id: string;
  bookId: string;
  borrower: string;
  borrowTime: string;
  returnTime?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
