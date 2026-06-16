import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import * as types from '../types';
import { mockBooks } from '../utils/mockData';

interface AppState {
  books: types.IBook[];
  filterCategory: 'all' | 'fiction' | 'non-fiction';
  filterGenre: string;
  currentExhibition: types.IExhibition | null;
  exhibitions: types.IExhibition[];
  isPreviewOpen: boolean;
  isFullscreen: boolean;
  setFilterCategory: (cat: 'all' | 'fiction' | 'non-fiction') => void;
  setFilterGenre: (genre: string) => void;
  getFilteredBooks: () => types.IBook[];
  createNewExhibition: (title: string) => void;
  addBookToExhibition: (bookId: string) => void;
  removeBookFromExhibition: (bookId: string) => void;
  addTheme: (name: string, color: string) => void;
  removeTheme: (themeId: string) => void;
  reorderThemes: (fromIndex: number, toIndex: number) => void;
  addBookToTheme: (themeId: string, bookId: string) => void;
  removeBookFromTheme: (themeId: string, bookId: string) => void;
  reorderBooksInTheme: (themeId: string, fromIndex: number, toIndex: number) => void;
  setPreviewOpen: (open: boolean) => void;
  setFullscreen: (fullscreen: boolean) => void;
  saveExhibition: (status: 'draft' | 'published') => void;
  loadExhibition: (id: string) => void;
  deleteExhibition: (id: string) => void;
}

const loadExhibitionsFromStorage = (): types.IExhibition[] => {
  try {
    const saved = localStorage.getItem('book-exhibitions');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveExhibitionsToStorage = (exhibitions: types.IExhibition[]) => {
  localStorage.setItem('book-exhibitions', JSON.stringify(exhibitions));
};

export const useStore = create<AppState>((set, get) => ({
  books: mockBooks,
  filterCategory: 'all',
  filterGenre: 'all',
  currentExhibition: null,
  exhibitions: loadExhibitionsFromStorage(),
  isPreviewOpen: false,
  isFullscreen: false,

  setFilterCategory: (cat) => set({ filterCategory: cat }),

  setFilterGenre: (genre) => set({ filterGenre: genre }),

  getFilteredBooks: () => {
    const { books, filterCategory, filterGenre } = get();
    return books.filter((book) => {
      const categoryMatch = filterCategory === 'all' || book.category === filterCategory;
      const genreMatch = filterGenre === 'all' || book.genre === filterGenre;
      return categoryMatch && genreMatch;
    });
  },

  createNewExhibition: (title) => {
    const now = new Date().toISOString();
    const newExhibition: types.IExhibition = {
      id: uuidv4(),
      title,
      themes: [],
      uncategorizedBooks: [],
      createdAt: now,
      updatedAt: now,
      status: 'draft',
    };
    set({ currentExhibition: newExhibition });
  },

  addBookToExhibition: (bookId) => {
    const { currentExhibition } = get();
    if (!currentExhibition) return;
    if (currentExhibition.uncategorizedBooks.includes(bookId)) return;
    const hasBookInTheme = currentExhibition.themes.some((theme) =>
      theme.bookIds.includes(bookId)
    );
    if (hasBookInTheme) return;
    set({
      currentExhibition: {
        ...currentExhibition,
        uncategorizedBooks: [...currentExhibition.uncategorizedBooks, bookId],
        updatedAt: new Date().toISOString(),
      },
    });
  },

  removeBookFromExhibition: (bookId) => {
    const { currentExhibition } = get();
    if (!currentExhibition) return;
    set({
      currentExhibition: {
        ...currentExhibition,
        uncategorizedBooks: currentExhibition.uncategorizedBooks.filter((id) => id !== bookId),
        themes: currentExhibition.themes.map((theme) => ({
          ...theme,
          bookIds: theme.bookIds.filter((id) => id !== bookId),
        })),
        updatedAt: new Date().toISOString(),
      },
    });
  },

  addTheme: (name, color) => {
    const { currentExhibition } = get();
    if (!currentExhibition) return;
    const newTheme: types.ITheme = {
      id: uuidv4(),
      name,
      color,
      bookIds: [],
    };
    set({
      currentExhibition: {
        ...currentExhibition,
        themes: [...currentExhibition.themes, newTheme],
        updatedAt: new Date().toISOString(),
      },
    });
  },

  removeTheme: (themeId) => {
    const { currentExhibition } = get();
    if (!currentExhibition) return;
    const themeToRemove = currentExhibition.themes.find((t) => t.id === themeId);
    if (!themeToRemove) return;
    set({
      currentExhibition: {
        ...currentExhibition,
        themes: currentExhibition.themes.filter((t) => t.id !== themeId),
        uncategorizedBooks: [...currentExhibition.uncategorizedBooks, ...themeToRemove.bookIds],
        updatedAt: new Date().toISOString(),
      },
    });
  },

  reorderThemes: (fromIndex, toIndex) => {
    const { currentExhibition } = get();
    if (!currentExhibition) return;
    const newThemes = [...currentExhibition.themes];
    const [removed] = newThemes.splice(fromIndex, 1);
    newThemes.splice(toIndex, 0, removed);
    set({
      currentExhibition: {
        ...currentExhibition,
        themes: newThemes,
        updatedAt: new Date().toISOString(),
      },
    });
  },

  addBookToTheme: (themeId, bookId) => {
    const { currentExhibition } = get();
    if (!currentExhibition) return;
    const isBookInOtherTheme = currentExhibition.themes.some(
      (t) => t.id !== themeId && t.bookIds.includes(bookId)
    );
    if (isBookInOtherTheme) {
      set({
        currentExhibition: {
          ...currentExhibition,
          themes: currentExhibition.themes.map((theme) => {
            if (theme.id === themeId) {
              return {
                ...theme,
                bookIds: [...theme.bookIds, bookId],
              };
            }
            return {
              ...theme,
              bookIds: theme.bookIds.filter((id) => id !== bookId),
            };
          }),
          updatedAt: new Date().toISOString(),
        },
      });
    } else {
      set({
        currentExhibition: {
          ...currentExhibition,
          uncategorizedBooks: currentExhibition.uncategorizedBooks.filter((id) => id !== bookId),
          themes: currentExhibition.themes.map((theme) => {
            if (theme.id === themeId && !theme.bookIds.includes(bookId)) {
              return {
                ...theme,
                bookIds: [...theme.bookIds, bookId],
              };
            }
            return theme;
          }),
          updatedAt: new Date().toISOString(),
        },
      });
    }
  },

  removeBookFromTheme: (themeId, bookId) => {
    const { currentExhibition } = get();
    if (!currentExhibition) return;
    set({
      currentExhibition: {
        ...currentExhibition,
        uncategorizedBooks: currentExhibition.uncategorizedBooks.includes(bookId)
          ? currentExhibition.uncategorizedBooks
          : [...currentExhibition.uncategorizedBooks, bookId],
        themes: currentExhibition.themes.map((theme) => {
          if (theme.id === themeId) {
            return {
              ...theme,
              bookIds: theme.bookIds.filter((id) => id !== bookId),
            };
          }
          return theme;
        }),
        updatedAt: new Date().toISOString(),
      },
    });
  },

  reorderBooksInTheme: (themeId, fromIndex, toIndex) => {
    const { currentExhibition } = get();
    if (!currentExhibition) return;
    set({
      currentExhibition: {
        ...currentExhibition,
        themes: currentExhibition.themes.map((theme) => {
          if (theme.id === themeId) {
            const newBookIds = [...theme.bookIds];
            const [removed] = newBookIds.splice(fromIndex, 1);
            newBookIds.splice(toIndex, 0, removed);
            return { ...theme, bookIds: newBookIds };
          }
          return theme;
        }),
        updatedAt: new Date().toISOString(),
      },
    });
  },

  setPreviewOpen: (open) => set({ isPreviewOpen: open }),

  setFullscreen: (fullscreen) => set({ isFullscreen: fullscreen }),

  saveExhibition: (status) => {
    const { currentExhibition, exhibitions } = get();
    if (!currentExhibition) return;
    const updatedExhibition = {
      ...currentExhibition,
      status,
      updatedAt: new Date().toISOString(),
    };
    const existingIndex = exhibitions.findIndex((e) => e.id === updatedExhibition.id);
    let newExhibitions: types.IExhibition[];
    if (existingIndex >= 0) {
      newExhibitions = [...exhibitions];
      newExhibitions[existingIndex] = updatedExhibition;
    } else {
      newExhibitions = [...exhibitions, updatedExhibition];
    }
    saveExhibitionsToStorage(newExhibitions);
    set({
      exhibitions: newExhibitions,
      currentExhibition: updatedExhibition,
    });
  },

  loadExhibition: (id) => {
    const { exhibitions } = get();
    const exhibition = exhibitions.find((e) => e.id === id);
    if (exhibition) {
      set({ currentExhibition: { ...exhibition } });
    }
  },

  deleteExhibition: (id) => {
    const { exhibitions, currentExhibition } = get();
    const newExhibitions = exhibitions.filter((e) => e.id !== id);
    saveExhibitionsToStorage(newExhibitions);
    set({
      exhibitions: newExhibitions,
      currentExhibition: currentExhibition?.id === id ? null : currentExhibition,
    });
  },
}));
