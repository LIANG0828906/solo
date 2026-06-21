export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  description: string;
  coverImage: string;
  status: 'available' | 'borrowed' | 'pending';
  ownerId: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  reputation: number;
  ratingCount: number;
  ratings: number[];
}

export interface Loan {
  id: string;
  bookId: string;
  borrowerId: string;
  lenderId: string;
  status: 'pending' | 'active' | 'returned' | 'overdue';
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  borrowerRating?: number;
  lenderRating?: number;
}

export interface BookCardProps {
  book: Book;
  onBorrow: (bookId: string) => void;
  disabled?: boolean;
}

export interface UserProfileProps {
  userId: string;
}

export interface LoanWithBook extends Loan {
  book: Book;
}

export type SearchFilter = {
  keyword: string;
  searchBy: 'title' | 'author' | 'all';
  status: 'all' | 'available' | 'borrowed' | 'pending';
};
