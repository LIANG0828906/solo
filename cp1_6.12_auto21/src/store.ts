import { create } from 'zustand';
import type { Book, Shelf, HeatmapSlot, MisplaceAlert, GuidePath, ReaderProfile } from '@/types';

interface ScanResult {
  book: Book;
  shelf: Shelf;
  slot: ShelfSlot;
}

interface ShelfSlot {
  index: number;
  bookId: string | null;
  category: import('@/types').BookCategory;
}

interface BookStore {
  shelves: Shelf[];
  books: Book[];
  heatmapData: HeatmapSlot[];
  alerts: MisplaceAlert[];
  currentGuide: GuidePath | null;
  scanResult: ScanResult | null;
  highlightSlot: { shelfId: string; slotIndex: number } | null;
  selectedZone: string | null;
  showHeatmap: boolean;
  showAnalysis: boolean;
  readerProfiles: ReaderProfile[];
  isExporting: boolean;
  exportProgress: number;
  draggedBook: Book | null;

  setShelves: (shelves: Shelf[]) => void;
  setBooks: (books: Book[]) => void;
  setHeatmapData: (data: HeatmapSlot[]) => void;
  addAlert: (alert: MisplaceAlert) => void;
  removeAlert: (alertId: string) => void;
  setScanResult: (result: ScanResult | null) => void;
  setHighlightSlot: (slot: { shelfId: string; slotIndex: number } | null) => void;
  setSelectedZone: (zone: string | null) => void;
  toggleHeatmap: () => void;
  toggleAnalysis: () => void;
  setReaderProfiles: (profiles: ReaderProfile[]) => void;
  setGuidePath: (path: GuidePath | null) => void;
  setExportState: (isExporting: boolean, progress: number) => void;
  setDraggedBook: (book: Book | null) => void;
  updateBookPosition: (bookId: string, shelfId: string, slotIndex: number) => void;
}

export const useBookStore = create<BookStore>((set) => ({
  shelves: [],
  books: [],
  heatmapData: [],
  alerts: [],
  currentGuide: null,
  scanResult: null,
  highlightSlot: null,
  selectedZone: null,
  showHeatmap: false,
  showAnalysis: false,
  readerProfiles: [],
  isExporting: false,
  exportProgress: 0,
  draggedBook: null,

  setShelves: (shelves) => set({ shelves }),
  setBooks: (books) => set({ books }),
  setHeatmapData: (heatmapData) => set({ heatmapData }),
  addAlert: (alert) => set((state) => ({ alerts: [...state.alerts, alert] })),
  removeAlert: (alertId) => set((state) => ({ alerts: state.alerts.filter((a) => a.id !== alertId) })),
  setScanResult: (scanResult) => set({ scanResult }),
  setHighlightSlot: (highlightSlot) => set({ highlightSlot }),
  setSelectedZone: (selectedZone) => set({ selectedZone }),
  toggleHeatmap: () => set((state) => ({ showHeatmap: !state.showHeatmap })),
  toggleAnalysis: () => set((state) => ({ showAnalysis: !state.showAnalysis })),
  setReaderProfiles: (readerProfiles) => set({ readerProfiles }),
  setGuidePath: (currentGuide) => set({ currentGuide }),
  setExportState: (isExporting, exportProgress) => set({ isExporting, exportProgress }),
  setDraggedBook: (draggedBook) => set({ draggedBook }),

  updateBookPosition: (bookId, shelfId, slotIndex) =>
    set((state) => {
      const updatedBooks = state.books.map((b) =>
        b.id === bookId ? { ...b, shelfId, slotIndex } : b
      );

      const updatedShelves = state.shelves.map((shelf) => {
        const slots = shelf.slots.map((slot) => {
          if (slot.bookId === bookId) {
            return { ...slot, bookId: null };
          }
          if (shelf.id === shelfId && slot.index === slotIndex) {
            return { ...slot, bookId };
          }
          return slot;
        });
        return { ...shelf, slots };
      });

      return { books: updatedBooks, shelves: updatedShelves };
    }),
}));
