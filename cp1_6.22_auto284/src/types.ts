export type BookCategory = '文学' | '科技' | '生活';

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: BookCategory;
  price: number;
  stock: number;
  entryDate: string;
  lastSaleDate?: string;
  isBorrowed?: boolean;
  borrowerName?: string;
  dueDate?: string;
}

export type WishlistStatus = '待匹配' | '已联系' | '已完成';

export interface WishlistItem {
  id: string;
  title: string;
  author: string;
  maxPrice: number;
  status: WishlistStatus;
  submitDate: string;
}

export interface BorrowRecord {
  id: string;
  bookId: string;
  borrowerName: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
}

export interface SaleRecord {
  id: string;
  bookId: string;
  saleDate: string;
  price: number;
}

export interface MatchResult {
  book: Book;
  score: number;
}

export interface SearchFilters {
  keyword: string;
  category: BookCategory | '全部';
  minPrice: number;
  maxPrice: number;
}
