export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  stock: number;
  borrowCount: number;
  coverColor: string;
  hotLevel: number;
}

export interface Reader {
  id: string;
  name: string;
  borrowCount: number;
  overdueCount: number;
  preferredCategories: string[];
  preferredAuthors: string[];
}

export interface BorrowRecord {
  id: string;
  readerId: string;
  bookId: string;
  borrowDate: Date;
  dueDate: Date;
  returnDate?: Date;
  isOverdue: boolean;
}

export interface AppContextType {
  books: Book[];
  readers: Reader[];
  borrowRecords: BorrowRecord[];
  addBook: (book: Omit<Book, 'id' | 'borrowCount' | 'coverColor' | 'hotLevel'>) => void;
  addReader: (reader: Omit<Reader, 'id' | 'borrowCount' | 'overdueCount'>) => void;
  borrowBook: (readerId: string, bookId: string) => boolean;
  returnBook: (recordId: string) => void;
  searchBooks: (keyword: string) => Book[];
  getRecommendations: (readerId: string, limit?: number) => Book[];
  getHotBooks: (limit?: number) => Book[];
  checkOverdue: () => BorrowRecord[];
  getStats: () => {
    totalBooks: number;
    totalReaders: number;
    borrowedBooks: number;
    overdueBooks: number;
  };
}
