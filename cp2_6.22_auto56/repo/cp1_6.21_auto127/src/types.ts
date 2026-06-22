export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  isBorrowed: boolean;
  color: string;
}

export interface Record {
  id: string;
  bookId: string;
  bookTitle: string;
  borrower: string;
  borrowDate: string;
  returnDate: string | null;
  isReturned: boolean;
}

export interface AppContextType {
  books: Book[];
  records: Record[];
  loadBooks: () => Promise<void>;
  loadRecords: () => Promise<void>;
  addBook: (title: string, author: string, isbn: string) => Promise<void>;
  deleteBook: (id: string) => Promise<void>;
  borrowBook: (bookId: string, borrower: string, borrowDate: string) => Promise<void>;
  returnBook: (recordId: string, returnDate: string) => Promise<void>;
}
