import { create } from 'zustand';
import type { PdfDocument, PageData, TableData, Toast } from '../utils/types';

interface AppState {
  document: PdfDocument | null;
  isParsing: boolean;
  parseProgress: number;
  parseMessage: string;
  currentTableIndex: number;
  toasts: Toast[];
  sidebarCollapsed: boolean;
  mergeAllPages: boolean;
  selectedPages: number[];
  isExporting: boolean;

  setDocument: (doc: PdfDocument | null) => void;
  setCurrentPage: (pageNum: number) => void;
  updatePage: (pageNum: number, pageData: Partial<PageData>) => void;
  updateTable: (pageNum: number, tableIndex: number, table: TableData) => void;
  setParsing: (parsing: boolean) => void;
  setParseProgress: (progress: number, message: string) => void;
  setCurrentTableIndex: (index: number) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMergeAllPages: (merge: boolean) => void;
  togglePageSelection: (pageNum: number) => void;
  setExporting: (exporting: boolean) => void;
  reset: () => void;

  getTotalTables: () => number;
  getEditedTables: () => number;
  getSelectedPageTables: () => { pageNumber: number; tableIndex: number; data: TableData }[];
}

export const useAppStore = create<AppState>((set, get) => ({
  document: null,
  isParsing: false,
  parseProgress: 0,
  parseMessage: '',
  currentTableIndex: 0,
  toasts: [],
  sidebarCollapsed: false,
  mergeAllPages: false,
  selectedPages: [],
  isExporting: false,

  setDocument: (doc) => {
    set({
      document: doc,
      currentTableIndex: 0,
      selectedPages: doc ? Array.from({ length: doc.totalPages }, (_, i) => i + 1) : [],
    });
  },

  setCurrentPage: (pageNum) => {
    set((state) => {
      if (!state.document) return state;
      return {
        document: { ...state.document, currentPage: pageNum },
        currentTableIndex: 0,
      };
    });
  },

  updatePage: (pageNum, pageData) => {
    set((state) => {
      if (!state.document) return state;
      const newPages = new Map(state.document.pages);
      const existing = newPages.get(pageNum);
      if (existing) {
        newPages.set(pageNum, { ...existing, ...pageData });
      }
      return {
        document: { ...state.document, pages: newPages },
      };
    });
  },

  updateTable: (pageNum, tableIndex, table) => {
    set((state) => {
      if (!state.document) return state;
      const pageData = state.document.pages.get(pageNum);
      if (!pageData) return state;

      const newTables = [...pageData.tables];
      if (tableIndex >= 0 && tableIndex < newTables.length) {
        newTables[tableIndex] = table;
      }

      const newPages = new Map(state.document.pages);
      newPages.set(pageNum, { ...pageData, tables: newTables });

      return {
        document: { ...state.document, pages: newPages },
      };
    });
  },

  setParsing: (parsing) => set({ isParsing: parsing }),

  setParseProgress: (progress, message) => {
    set({ parseProgress: progress, parseMessage: message });
  },

  setCurrentTableIndex: (index) => set({ currentTableIndex: index }),

  addToast: (toast) => {
    const id = Math.random().toString(36).substr(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  setMergeAllPages: (merge) => set({ mergeAllPages: merge }),

  togglePageSelection: (pageNum) => {
    set((state) => {
      const isSelected = state.selectedPages.includes(pageNum);
      if (isSelected) {
        return {
          selectedPages: state.selectedPages.filter((p) => p !== pageNum),
        };
      }
      return {
        selectedPages: [...state.selectedPages, pageNum].sort((a, b) => a - b),
      };
    });
  },

  setExporting: (exporting) => set({ is