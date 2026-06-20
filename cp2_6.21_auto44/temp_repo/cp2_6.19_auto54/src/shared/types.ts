export interface User {
  id: string;
  name: string;
  role: 'admin' | 'reader';
  createdAt: number;
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  userId: string;
  read: boolean;
  createdAt: number;
  expireAt?: number;
}

export type BookCategory = '小说' | '非小说' | '技术' | '艺术';
export type BookExchangeMode = 'exchange_only' | 'borrow_only' | 'both';
export type BookStatus = 'available' | 'low_stock' | 'out_of_stock' | 'lost';

export interface Book {
  id: string;
  title: string;
  author: string;
  category: BookCategory;
  isbn: string;
  totalQuantity: number;
  availableQuantity: number;
  exchangeMode: BookExchangeMode;
  borrowPeriodDays: number;
  status: BookStatus;
  createdAt: number;
}

export type BookFormData = Omit<Book, 'id' | 'availableQuantity' | 'status' | 'createdAt'>;

export type ExchangeType = 'exchange' | 'borrow';
export type ExchangeStatus = 'pending' | 'active' | 'completed' | 'rejected' | 'overdue' | 'lost';

export interface ExchangeRecord {
  id: string;
  bookId: string;
  bookTitle: string;
  requesterId: string;
  requesterName: string;
  acceptorId: string;
  acceptorName: string;
  type: ExchangeType;
  status: ExchangeStatus;
  createdAt: number;
  confirmedAt?: number;
  dueDate?: number;
  completedAt?: number;
  daysRemaining?: number;
}

export interface AppStorage {
  auth: {
    users: User[];
    currentUserId: string | null;
  };
  books: Book[];
  records: ExchangeRecord[];
  notifications: Notification[];
  meta: {
    version: number;
    lastOverdueCheck: number;
  };
}
