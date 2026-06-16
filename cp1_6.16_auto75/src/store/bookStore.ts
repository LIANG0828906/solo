import { create } from 'zustand';
import { Book, BookStoreState } from '../types';
import { generateMockBooks } from '../data/mockBooks';

export const useBookStore = create<BookStoreState>((set, get) => ({
  books: generateMockBooks(36),
  currentBookId: null,
  recommendedBookIds: [],

  setCurrentBook: (bookId: string) => {
    set({ currentBookId: bookId });
  },

  setRecommendedBooks: (bookIds: string[]) => {
    set({ recommendedBookIds: bookIds });
  },

  getBookById: (bookId: string): Book | undefined => {
    return get().books.find(book => book.id === bookId);
  }
}));
