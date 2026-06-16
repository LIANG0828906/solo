import { create } from 'zustand';
import type { Book, DragState } from '@/types';
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
  drag: DragState;
  setCurrentPage: (page: number, save?: boolean) => void;
  startFlip: (direction: 'next' | 'prev') => void;
  endFlip: () => void;
  setFlipProgress: (progress: number) => void;
  triggerHotspot: (id: string | null) => void;
  toggleFullscreen: () => void;
  hideContinueReading: () => void;
  loadBook: () => Promise<void>;
  goToPageInstant: (page: number) => void;
  startDrag: (x: number) => void;
  updateDrag: (x: number) => void;
  endDrag: () => { shouldFlip: boolean; direction: 'next' | 'prev' | null };
  cancelDrag: () => void;
}

let saveTimer: number | null = null;

const initialDrag: DragState = {
  isDragging: false,
  startX: 0,
  currentX: 0,
  dragDirection: null,
};

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
  drag: initialDrag,

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

  startDrag: (x: number) => {
    set({
      drag: { isDragging: true, startX: x, currentX: x, dragDirection: null },
      isFlipping: false,
      flipDirection: null,
      flipProgress: 0,
    });
  },

  updateDrag: (x: number) => {
    const { drag } = get();
    if (!drag.isDragging) return;
    const delta = x - drag.startX;
    const direction: 'next' | 'prev' | null = delta < 0 ? 'next' : delta > 0 ? 'prev' : null;
    set({
      drag: { ...drag, currentX: x, dragDirection: direction },
      flipDirection: direction,
    });
  },

  endDrag: () => {
    const { drag, book, currentPage } = get();
    if (!drag.isDragging || !book) {
      set({ drag: initialDrag });
      return { shouldFlip: false, direction: null };
    }
    const delta = drag.currentX - drag.startX;
    const absDelta = Math.abs(delta);
    const direction: 'next' | 'prev' | null = delta < 0 ? 'next' : delta > 0 ? 'prev' : null;
    const threshold = 80;
    let shouldFlip = absDelta >= threshold;
    if (direction === 'next' && currentPage >= book.totalPages - 1) shouldFlip = false;
    if (direction === 'prev' && currentPage <= 0) shouldFlip = false;

    if (!shouldFlip) {
      set({
        drag: initialDrag,
        flipDirection: null,
        flipProgress: 0,
      });
    } else {
      set({
        drag: initialDrag,
        isFlipping: true,
        flipDirection: direction,
        flipProgress: absDelta / 500,
      });
    }
    return { shouldFlip, direction };
  },

  cancelDrag: () => {
    set({
      drag: initialDrag,
      flipDirection: null,
      flipProgress: 0,
      isFlipping: false,
    });
  },
}));
