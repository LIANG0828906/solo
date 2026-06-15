export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  created_at: string;
}

export type BookStatus = 'available' | 'borrowed' | 'drifting';

export interface Book {
  id: string;
  title: string;
  author: string;
  cover_url?: string;
  status: BookStatus;
  owner_id: string;
  max_borrow_days: number;
  max_borrow_count: number;
  borrow_count: number;
  average_rating: number;
  created_at: string;
}

export type BorrowStatus = 'pending' | 'approved' | 'rejected' | 'returned';

export interface Borrow {
  id: string;
  book_id: string;
  borrower_id: string;
  owner_id: string;
  borrow_days: number;
  reason: string;
  status: BorrowStatus;
  borrow_date?: string;
  return_date?: string;
  created_at: string;
  borrower?: {
    id: string;
    username: string;
    avatar?: string;
  };
  book?: {
    id: string;
    title: string;
    author: string;
    cover_url?: string;
  };
}

export interface Review {
  id: string;
  borrow_id: string;
  book_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer?: {
    id: string;
    username: string;
    avatar?: string;
  };
}

export interface DriftLog {
  id: string;
  book_id: string;
  borrower_id: string;
  borrower_name: string;
  borrow_date: string;
  return_date?: string;
  rating?: number;
}

export interface BookWithDetails extends Book {
  drift_logs: DriftLog[];
  owner?: User;
}

export interface Notification {
  id: string;
  borrow_id: string;
  book_id: string;
  book_title: string;
  borrower_id: string;
  borrower_name: string;
  borrower_avatar?: string;
  borrow_days: number;
  reason: string;
  created_at: string;
  read: boolean;
}
