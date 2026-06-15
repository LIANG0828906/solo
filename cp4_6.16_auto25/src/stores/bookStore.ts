import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Book, BookStatus, FilterStatus, BookFormData } from '@/types';
import { getAllBooks, saveBooks } from '@/utils/idb';

interface BookStore {
  books: Book[];
  filterStatus: FilterStatus;
  searchKeyword: string;
  loading: boolean;
  initialized: boolean;

  fetchBooks: () => Promise<void>;
  addBook: (data: BookFormData, creatorName: string) => Promise<Book>;
  updateBook: (id: string, updates: Partial<Book>) => Promise<Book | null>;
  updateBookStatus: (id: string, newStatus: BookStatus) => Promise<Book | null>;
  updateBookLocation: (
    id: string,
    location: string,
    lat: number,
    lng: number
  ) => Promise<Book | null>;
  deleteBook: (id: string) => Promise<void>;
  getBookById: (id: string) => Book | undefined;

  setFilterStatus: (status: FilterStatus) => void;
  setSearchKeyword: (keyword: string) => void;

  getFilteredBooks: () => Book[];
}

export const useBookStore = create<BookStore>((set, get) => ({
  books: [],
  filterStatus: 'all',
  searchKeyword: '',
  loading: false,
  initialized: false,

  fetchBooks: async () => {
    set({ loading: true });
    try {
      const books = await getAllBooks();
      set({ books, initialized: true });
    } finally {
      set({ loading: false });
    }
  },

  addBook: async (data, creatorName) => {
    const now = Date.now();
    const newBook: Book = {
      id: uuidv4(),
      title: data.title,
      author: data.author,
      isbn: data.isbn,
      coverUrl: data.coverUrl,
      status: 'pending',
      currentLocation: data.initialLocation,
      currentLat: data.initialLat,
      currentLng: data.initialLng,
      createdAt: now,
      updatedAt: now,
      creatorName,
    };

    const books = [...get().books, newBook];
    set({ books });
    await saveBooks(books);

    window.dispatchEvent(
      new CustomEvent('book:created', {
        detail: { book: newBook },
      })
    );

    return newBook;
  },

  updateBook: async (id, updates) => {
    const books = get().books;
    const index = books.findIndex((b) => b.id === id);
    if (index === -1) return null;

    const oldBook = books[index];
    const updatedBook: Book = {
      ...oldBook,
      ...updates,
      updatedAt: Date.now(),
    };

    const newBooks = [...books];
    newBooks[index] = updatedBook;
    set({ books: newBooks });
    await saveBooks(newBooks);

    const statusChanged = oldBook.status !== updatedBook.status;
    const locationChanged =
      oldBook.currentLocation !== updatedBook.currentLocation ||
      oldBook.currentLat !== updatedBook.currentLat ||
      oldBook.currentLng !== updatedBook.currentLng;

    if (statusChanged || locationChanged) {
      window.dispatchEvent(
        new CustomEvent('book:updated', {
          detail: {
            oldBook,
            newBook: updatedBook,
            statusChanged,
            locationChanged,
          },
        })
      );
    }

    return updatedBook;
  },

  updateBookStatus: async (id, newStatus) => {
    return get().updateBook(id, { status: newStatus });
  },

  updateBookLocation: async (id, location, lat, lng) => {
    return get().updateBook(id, {
      currentLocation: location,
      currentLat: lat,
      currentLng: lng,
    });
  },

  deleteBook: async (id) => {
    const books = get().books.filter((b) => b.id !== id);
    set({ books });
    await saveBooks(books);

    window.dispatchEvent(
      new CustomEvent('book:deleted', {
        detail: { bookId: id },
      })
    );
  },

  getBookById: (id) => {
    return get().books.find((b) => b.id === id);
  },

  setFilterStatus: (status) => {
    set({ filterStatus: status });
  },

  setSearchKeyword: (keyword) => {
    set({ searchKeyword: keyword });
  },

  getFilteredBooks: () => {
    const { books, filterStatus, searchKeyword } = get();
    let result = books;

    if (filterStatus !== 'all') {
      result = result.filter((b) => b.status === filterStatus);
    }

    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase().trim();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(keyword) ||
          b.author.toLowerCase().includes(keyword) ||
          b.isbn.includes(keyword)
      );
    }

    return result.sort((a, b) => b.updatedAt - a.updatedAt);
  },
}));
