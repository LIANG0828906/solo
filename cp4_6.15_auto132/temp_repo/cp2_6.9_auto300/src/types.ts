export type Category = '经' | '史' | '子' | '集';

export interface Book {
  id: string;
  title: string;
  author: string;
  category: Category;
  description: string;
  colophon: string;
  edition: string;
  volumeCount: number;
  isBorrowed: boolean;
  coverGradient: string;
  createdAt: string;
}

export interface BorrowRecord {
  id: string;
  bookId: string;
  bookTitle: string;
  readerName: string;
  borrowDate: string;
  returnDate: string;
  timestamp: number;
}

export type CategoryInfo = {
  key: Category;
  label: string;
};
