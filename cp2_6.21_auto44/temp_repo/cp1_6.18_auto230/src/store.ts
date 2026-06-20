import { create } from 'zustand';
import type { SearchResult } from './api';

export interface Highlight {
  id: string;
  text: string;
  startOffset: number;
  endOffset: number;
  note: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  summary: string;
  highlights: Highlight[];
  isGenerating: boolean;
}

interface ReadingListState {
  readingList: Book[];
  searchResults: SearchResult[];
  addBook: (book: Omit<Book, 'summary' | 'highlights' | 'isGenerating'>) => void;
  removeBook: (bookId: string) => void;
  setSummary: (bookId: string, summary: string) => void;
  addHighlight: (bookId: string, highlight: Highlight) => void;
  removeHighlight: (bookId: string, highlightId: string) => void;
  addNote: (bookId: string, highlightId: string, note: string) => void;
  setSearchResults: (results: SearchResult[]) => void;
  setIsGenerating: (bookId: string, isGenerating: boolean) => void;
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

const STORAGE_KEY = 'readingList';

export const useReadingListStore = create<ReadingListState>((set, get) => ({
  readingList: [],
  searchResults: [],

  addBook: (book) => {
    const newBook: Book = {
      ...book,
      summary: '',
      highlights: [],
      isGenerating: false,
    };
    set((state) => ({
      readingList: [...state.readingList, newBook],
    }));
    get().saveToStorage();
  },

  removeBook: (bookId) => {
    set((state) => ({
      readingList: state.readingList.filter((book) => book.id !== bookId),
    }));
    get().saveToStorage();
  },

  setSummary: (bookId, summary) => {
    set((state) => ({
      readingList: state.readingList.map((book) =>
        book.id === bookId ? { ...book, summary } : book
      ),
    }));
    get().saveToStorage();
  },

  addHighlight: (bookId, highlight) => {
    set((state) => ({
      readingList: state.readingList.map((book) =>
        book.id === bookId
          ? { ...book, highlights: [...book.highlights, highlight] }
          : book
      ),
    }));
    get().saveToStorage();
  },

  removeHighlight: (bookId, highlightId) => {
    set((state) => ({
      readingList: state.readingList.map((book) =>
        book.id === bookId
          ? {
              ...book,
              highlights: book.highlights.filter((h) => h.id !== highlightId),
            }
          : book
      ),
    }));
    get().saveToStorage();
  },

  addNote: (bookId, highlightId, note) => {
    set((state) => ({
      readingList: state.readingList.map((book) =>
        book.id === bookId
          ? {
              ...book,
              highlights: book.highlights.map((h) =>
                h.id === highlightId ? { ...h, note } : h
              ),
            }
          : book
      ),
    }));
    get().saveToStorage();
  },

  setSearchResults: (results) => {
    set({ searchResults: results });
  },

  setIsGenerating: (bookId, isGenerating) => {
    set((state) => ({
      readingList: state.readingList.map((book) =>
        book.id === bookId ? { ...book, isGenerating } : book
      ),
    }));
  },

  loadFromStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Book[];
        set({ readingList: parsed });
      }
    } catch (error) {
      console.error('Failed to load reading list from storage:', error);
    }
  },

  saveToStorage: () => {
    try {
      const { readingList } = get();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(readingList));
    } catch (error) {
      console.error('Failed to save reading list to storage:', error);
    }
  },
}));
