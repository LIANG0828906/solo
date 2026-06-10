import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Book, Annotation, CategoryKey } from '../types';
import booksData from '../data/books.json';

interface BookState {
  books: Book[];
  selectedBookId: string | null;
  currentPage: number;
  annotations: Record<string, Annotation>;
  activeCategory: CategoryKey;
  isReading: boolean;
  selectBook: (id: string) => void;
  closeBook: () => void;
  nextPage: () => void;
  prevPage: () => void;
  setActiveCategory: (category: CategoryKey) => void;
  addAnnotation: (annotation: Omit<Annotation, 'id' | 'createdAt'>) => void;
  updateAnnotation: (id: string, note: string) => void;
  deleteAnnotation: (id: string) => void;
}

export const useBookStore = create<BookState>()(
  persist(
    (set, get) => ({
      books: booksData as Book[],
      selectedBookId: null,
      currentPage: 0,
      annotations: {},
      activeCategory: 'jing',
      isReading: false,

      selectBook: (id: string) => {
        set({ selectedBookId: id, currentPage: 0, isReading: true });
      },

      closeBook: () => {
        set({ selectedBookId: null, currentPage: 0, isReading: false });
      },

      nextPage: () => {
        const { selectedBookId, currentPage, books } = get();
        if (!selectedBookId) return;
        const book = books.find(b => b.id === selectedBookId);
        if (book && currentPage < book.pages.length - 1) {
          set({ currentPage: currentPage + 1 });
        }
      },

      prevPage: () => {
        const { currentPage } = get();
        if (currentPage > 0) {
          set({ currentPage: currentPage - 1 });
        }
      },

      setActiveCategory: (category: CategoryKey) => {
        set({ activeCategory: category });
      },

      addAnnotation: (annotation) => {
        const id = `anno-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newAnnotation: Annotation = {
          ...annotation,
          id,
          createdAt: Date.now()
        };
        set((state) => ({
          annotations: {
            ...state.annotations,
            [id]: newAnnotation
          }
        }));
      },

      updateAnnotation: (id: string, note: string) => {
        set((state) => {
          if (!state.annotations[id]) return state;
          return {
            annotations: {
              ...state.annotations,
              [id]: {
                ...state.annotations[id],
                note
              }
            }
          };
        });
      },

      deleteAnnotation: (id: string) => {
        set((state) => {
          const newAnnotations = { ...state.annotations };
          delete newAnnotations[id];
          return { annotations: newAnnotations };
        });
      }
    }),
    {
      name: 'jinling-bookshop-storage',
      partialize: (state) => ({
        annotations: state.annotations
      })
    }
  )
);
