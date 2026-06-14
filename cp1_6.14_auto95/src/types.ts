export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  isbn: string;
  cover: string;
  description: string;
  totalQuantity: number;
  availableQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface Reader {
  id: string;
  name: string;
  email: string;
  role: 'reader' | 'admin';
  createdAt: string;
}

export interface Loan {
  id: string;
  bookId: string;
  readerId: string;
  borrowDate: string;
  dueDate: string;
  returnDate: string | null;
  lateFee: number;
  status: 'borrowed' | 'returned' | 'overdue';
  book?: Book;
  reader?: Reader;
}

export interface Notification {
  id: string;
  readerId: string;
  type: 'overdue' | 'return' | 'system';
  content: string;
  isRead: boolean;
  sentAt: string;
}

export interface LibraryConfig {
  maxBorrowCount: number;
  loanDays: number;
  lateFeePerDay: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'reader' | 'admin';
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}
