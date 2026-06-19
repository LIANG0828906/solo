import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Book, BookFormData, BookStatus } from '../../shared/types';
import { loadStorage, updateStorage } from '../../shared/storage';
import { useAuthStore } from '../user/UserManager';

interface BookState {
  books: Book[];
  newBookId: string | null;
  addBook: (data: BookFormData) => Book | null;
  updateBook: (id: string, data: Partial<BookFormData>) => void;
  deleteBook: (id: string) => void;
  updateBookQuantity: (id: string, delta: number) => void;
  getBook: (id: string) => Book | undefined;
  clearNewBookId: () => void;
}

const initialData = loadStorage();

function calculateBookStatus(available: number, total: number): BookStatus {
  if (total > 0 && available === 0) return 'out_of_stock';
  if (available > 0 && available <= Math.ceil(total * 0.3)) return 'low_stock';
  if (available > 0) return 'available';
  return 'available';
}

export const useBookStore = create<BookState>((set, get) => ({
  books: initialData.books,
  newBookId: null,

  addBook: (data) => {
    const authStore = useAuthStore.getState();
    if (!authStore.isAdmin()) {
      return null;
    }

    const newBook: Book = {
      ...data,
      id: uuidv4(),
      availableQuantity: data.totalQuantity,
      status: calculateBookStatus(data.totalQuantity, data.totalQuantity),
      createdAt: Date.now(),
    };

    const newBooks = [newBook, ...get().books];
    set({ books: newBooks, newBookId: newBook.id });
    updateStorage('books', newBooks);

    setTimeout(() => {
      set({ newBookId: null });
    }, 600);

    return newBook;
  },

  updateBook: (id, data) => {
    const authStore = useAuthStore.getState();
    if (!authStore.isAdmin()) {
      return;
    }

    const newBooks = get().books.map((book) => {
      if (book.id !== id) return book;
      const updated = { ...book, ...data };
      if (data.totalQuantity !== undefined) {
        const availableDiff = data.totalQuantity - book.totalQuantity;
        updated.availableQuantity = Math.max(0, book.availableQuantity + availableDiff);
      }
      updated.status = calculateBookStatus(updated.availableQuantity, updated.totalQuantity);
      return updated;
    });

    set({ books: newBooks });
    updateStorage('books', newBooks);
  },

  deleteBook: (id) => {
    const authStore = useAuthStore.getState();
    if (!authStore.isAdmin()) {
      return;
    }

    const newBooks = get().books.filter((book) => book.id !== id);
    set({ books: newBooks });
    updateStorage('books', newBooks);
  },

  updateBookQuantity: (id, delta) => {
    const newBooks = get().books.map((book) => {
      if (book.id !== id) return book;
      const newAvailable = Math.max(0, book.availableQuantity + delta);
      return {
        ...book,
        availableQuantity: newAvailable,
        status: calculateBookStatus(newAvailable, book.totalQuantity),
      };
    });

    set({ books: newBooks });
    updateStorage('books', newBooks);
  },

  getBook: (id) => {
    return get().books.find((book) => book.id === id);
  },

  clearNewBookId: () => {
    set({ newBookId: null });
  },
}));
