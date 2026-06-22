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
  startTime: 0,
  lastX: 0,
  lastTime: 0,
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
    const now = performance.now();
    set({
      drag: {
        isDragging: true,
        startX: x,
        currentX: x,
        dragDirection: null,
        startTime: now,
        lastX: x,
        lastTime: now,
      },
      isFlipping: false,
      flipDirection: null,
      flipProgress: 0,
    });
  },

  updateDrag: (x: number) => {
    const { drag } = get();
    if (!drag.isDragging) return;
    const now = performance.now();
    const delta = x - drag.startX;
    const direction: 'next' | 'prev' | null = delta < 0 ? 'next' : delta > 0 ? 'prev' : null;
    set({
      drag: { ...drag, currentX: x, dragDirection: direction, lastX: x, lastTime: now },
      flipDirection: direction,
    });
  },

  endDrag: () => {
    const { drag, book, currentPage } = get();
    if (!drag.isDragging || !book) {
      set({ drag: initialDrag });
      return { shouldFlip: false, direction: null };
    }

    const totalDelta = drag.currentX - drag.startX;
    const absDelta = Math.abs(totalDelta);
    const direction: 'next' | 'prev' | null = totalDelta < 0 ? 'next' : totalDelta > 0 ? 'prev' : null;

    const elapsed = drag.lastTime - drag.startTime;
    const recentElapsed = drag.lastTime - (drag.startTime || 0);
    const recentDelta = Math.abs(drag.lastX - drag.startX);
    const avgVelocity = elapsed > 0 ? absDelta / elapsed : 0;
    const recentVelocity = recentElapsed > 0 ? recentDelta / recentElapsed : 0;
    const velocity = Math.max(avgVelocity, recentVelocity);

    const DISTANCE_THRESHOLD = 80;
    const VELOCITY_THRESHOLD = 0.5;

    let shouldFlip = absDelta >= DISTANCE_THRESHOLD || velocity >= VELOCITY_THRESHOLD;

    if (direction === 'next' && currentPage >= book.totalPages - 1) shouldFlip = false;
    if (direction === 'prev' && currentPage <= 0) shouldFlip = false;
    if (!direction) shouldFlip = false;

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
        flipProgress: Math.min(absDelta / 300, 1),
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
