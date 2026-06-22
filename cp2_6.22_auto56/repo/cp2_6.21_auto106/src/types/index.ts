export interface Book {
  id: number;
  title: string;
  author: string;
  tags: string[];
  cover_url: string;
  status: 'available' | 'borrowed';
  rating: number;
  description: string;
  borrower?: string;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
}

export interface BorrowRecord {
  id: number;
  book_id: number;
  borrower_id: number;
  borrow_date: string;
  return_date?: string;
}

export interface StatisticsData {
  tags_count: Record<string, number>;
  borrow_trend: { date: string; count: number }[];
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}

export interface WebSocketMessage {
  type: 'borrow' | 'return';
  user: string;
  book_id: number;
  book_title: string;
  timestamp: string;
}
