export interface Review {
  id: string;
  userName: string;
  rating: number;
  content: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  tags: string[];
  description: string;
  publishYear: number;
  reviews: Review[];
}

export interface BookStoreState {
  books: Book[];
  currentBookId: string | null;
  recommendedBookIds: string[];
  setCurrentBook: (bookId: string) => void;
  setRecommendedBooks: (bookIds: string[]) => void;
  getBookById: (bookId: string) => Book | undefined;
}
