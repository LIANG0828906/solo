export type ReadingStatus = 'want-to-read' | 'reading' | 'finished';

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  publishYear?: number;
  coverUrl?: string;
  status: ReadingStatus;
  priority: number;
  difficulty: number;
  notes: string;
  createdAt: string;
}

export interface ReadingPlan {
  id: string;
  month: string;
  bookIds: string[];
  createdAt: string;
}

export interface LibraryContextType {
  books: Book[];
  plan: ReadingPlan | null;
  selectedBookId: string | null;
  addBook: (book: Omit<Book, 'id' | 'createdAt' | 'status' | 'priority' | 'notes'>) => void;
  updateBook: (id: string, updates: Partial<Book>) => void;
  deleteBook: (id: string) => void;
  selectBook: (id: string | null) => void;
  updateBookStatus: (id: string, status: ReadingStatus) => void;
  reorderWantToRead: (startIndex: number, endIndex: number) => void;
  generateMonthlyPlan: () => void;
  updatePlan: (bookIds: string[]) => void;
  addBookToPlan: (bookId: string) => void;
  removeBookFromPlan: (bookId: string) => void;
  batchImportBooks: (isbns: string[]) => Promise<{ success: number; failed: number; progress: number }[]>;
  searchBooks: (query: string) => Book[];
  getBuiltInBooks: () => BuiltInBook[];
}

export interface BuiltInBook {
  title: string;
  author: string;
  isbn: string;
  publishYear: number;
  coverUrl: string;
  difficulty: number;
}

export type PriorityLevel = 'high' | 'medium' | 'low';
