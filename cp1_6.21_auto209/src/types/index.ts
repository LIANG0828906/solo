export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  isbn: string;
  description: string;
  status: 'available' | 'borrowed';
  totalCopies: number;
  availableCopies: number;
  publishYear: number;
  pages: number;
  coverColor: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'reader' | 'admin';
  avatar: string | null;
  phone: string;
  borrowCount: number;
  maxBorrow: number;
}

export interface LendingRecord {
  id: string;
  userId: string;
  bookId: string;
  type: 'reserved' | 'borrowed';
  status: 'reserved' | 'borrowed' | 'returned';
  renewCount: number;
  reservedAt: string;
  borrowedAt: string | null;
  dueDate: string | null;
  returnedAt: string | null;
  bookSnapshot: Book;
  userSnapshot?: User;
  overdueDays?: number;
  isOverdue?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  total?: number;
  page?: number;
  totalPages?: number;
  categories?: string[];
  stats?: {
    total: number;
    reserved: number;
    borrowed: number;
    returned: number;
    overdue: number;
  };
}
