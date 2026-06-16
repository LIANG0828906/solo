import { create } from 'zustand';
import type { Book } from '@/types';
import { getProgress, saveProgress } from './db';
import { createSampleBook } from '@/data/sampleBook';

interface BookState {
  book: Book | null;
  currentPage: number;
  isFlipping: boolean;
  flipDirection: 'next' | 'prev' | null;
  flipProgress: number;
  activeHotspot: string | null;
  isFullscreen: boolean;
  showContinueReading: boolean;
  isInstantTransition: boolean;
  setCurrentPage: (page: number, save?: boolean) => void;
  startFlip: (direction: 'next' | 'prev') => void;
  endFlip: () => void;
  setFlipProgress: (progress: number) => void;
  triggerHotspot: (id: string | null) => void;
  toggleFullscreen: () => void;
  hideContinueReading: () => void;
  loadBook: () => Promise<void>;
  goToPageInstant: (page: number) => void;
}

let saveTimer: number | null = null;

export const useBookStore = create<BookState>((set, get) => ({
  book: null,
  currentPage: 0,
  isFlipping: false,
  flipDirection: null,
  flipProgress: 0,
  activeHotspot: null,
  isFullscreen: false,
  showContinueReading: false,
  isInstantTransition: false,

  setCurrentPage: (page: number, save = true) => {
    const { book } = get();
    if (!book) return;
    const clamped = Math.max(0, Math.min(page, book.totalPages - 1));
    set({ currentPage: clamped });
    if (save && book) {
      if (saveTimer) window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(() => {
        saveProgress(book.id, clamped);
      }, 100);
    }
  },

  startFlip: (direction: 'next' | 'prev') => {
    set({ isFlipping: true, flipDirection: direction, flipProgress: 0, isInstantTransition: false });
  },

  endFlip: () => {
    const { flipDirection, currentPage, book } = get();
    set({ isFlipping: false, flipDirection: null, flipProgress: 0 });
    if (flipDirection && book) {
      const next = flipDirection === 'next' ? currentPage + 1 : currentPage - 1;
      get().setCurrentPage(next);
    }
  },

  setFlipProgress: (progress: number) => {
    set({ flipProgress: progress });
  },

  triggerHotspot: (id: string | null) => {
    set({ activeHotspot: id });
  },

  toggleFullscreen: () => {
    set({ isFullscreen: !get().isFullscreen });
  },

  hideContinueReading: () => {
    set({ showContinueReading: false });
  },

  goToPageInstant: (page: number) => {
    set({ isInstantTransition: true });
    get().setCurrentPage(page);
    window.setTimeout(() => set({ isInstantTransition: false }), 300);
  },

  loadBook: async () => {
    const book = createSampleBook();
    const savedPage = await getProgress(book.id);
    const hasSaved = savedPage !== null && savedPage >= 0 && savedPage < book.totalPages;
    set({
      book,
      currentPage: hasSaved ? savedPage : 0,
      showContinueReading: hasSaved,
    });
    if (hasSaved) {
      window.setTimeout(() => {
        get().hideContinueReading();
      }, 2300);
    }
  },
}));
