import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  CanvasElement,
  Filters,
  BlendMode,
  CategoryType,
  LibraryItem,
  ExportResolution,
  ExportFormat,
} from '../types';

interface CanvasState {
  elements: CanvasElement[];
  selectedIds: string[];
  activeCategory: CategoryType;
  searchQuery: string;
  filterPanelOpen: boolean;
  exportDialogOpen: boolean;
  recentItems: LibraryItem[];
  exportResolution: ExportResolution;
  exportFormat: ExportFormat;
  exportProgress: number;
  isExporting: boolean;

  selectElement: (id: string, multi?: boolean) => void;
  clearSelection: () => void;
  addElement: (item: LibraryItem, x?: number, y?: number) => void;
  removeElement: (id: string) => void;
  removeSelected: () => void;
  moveElement: (id: string, x: number, y: number) => void;
  scaleElement: (id: string, width: number, height: number) => void;
  rotateElement: (id: string, rotation: number) => void;
  bringToFront: (id: string) => void;

  updateFilter: (key: keyof Filters, value: number) => void;
  updateBlendMode: (mode: BlendMode) => void;
  resetFilters: () => void;

  setActiveCategory: (category: CategoryType) => void;
  setSearchQuery: (query: string) => void;
  toggleFilterPanel: () => void;
  setFilterPanelOpen: (open: boolean) => void;
  openExportDialog: () => void;
  closeExportDialog: () => void;
  setExportResolution: (res: ExportResolution) => void;
  setExportFormat: (fmt: ExportFormat) => void;
  setExportProgress: (progress: number) => void;
  setIsExporting: (exporting: boolean) => void;
  addRecentItem: (item: LibraryItem) => void;
}

const defaultFilters: Filters = {
  blur: 0,
  brightness: 100,
  contrast: 100,
  saturate: 100,
  hueRotate: 0,
  opacity: 100,
};

const createElementFromItem = (
  item: LibraryItem,
  x: number,
  y: number,
  zIndex: number
): CanvasElement => ({
  id: uuidv4(),
  type: item.type,
  name: item.name,
  src: item.src,
  shape: item.shape,
  fillColor: item.fillColor,
  x,
  y,
  width: item.defaultWidth,
  height: item.defaultHeight,
  rotation: 0,
  zIndex,
  filters: { ...defaultFilters },
  blendMode: 'normal',
});

export const useCanvasStore = create<CanvasState>((set, get) => ({
  elements: [],
  selectedIds: [],
  activeCategory: 'all',
  searchQuery: '',
  filterPanelOpen: false,
  exportDialogOpen: false,
  recentItems: [],
  exportResolution: '1080',
  exportFormat: 'png-transparent',
  exportProgress: 0,
  isExporting: false,

  selectElement: (id, multi = false) => {
    set((state) => {
      if (multi) {
        const exists = state.selectedIds.includes(id);
        return {
          selectedIds: exists
            ? state.selectedIds.filter((s) => s !== id)
            : [...state.selectedIds, id],
        };
      }
      return { selectedIds: [id] };
    });
  },

  clearSelection: () => set({ selectedIds: [] }),

  addElement: (item, x, y) => {
    const state = get();
    const maxZ = state.elements.reduce((max, el) => Math.max(max, el.zIndex), 0);
    const posX = x ?? 400 - item.defaultWidth / 2;
    const posY = y ?? 300 - item.defaultHeight / 2;
    const newEl = createElementFromItem(item, posX, posY, maxZ + 1);
    set((s) => ({
      elements: [...s.elements, newEl],
      selectedIds: [newEl.id],
    }));
    get().addRecentItem(item);
  },

  removeElement: (id) => {
    set((s) => ({
      elements: s.elements.filter((el) => el.id !== id),
      selectedIds: s.selectedIds.filter((sid) => sid !== id),
    }));
  },

  removeSelected: () => {
    const state = get();
    if (state.selectedIds.length === 0) return;
    set((s) => ({
      elements: s.elements.filter((el) => !s.selectedIds.includes(el.id)),
      selectedIds: [],
    }));
  },

  moveElement: (id, x, y) => {
    set((s) => ({
      elements: s.elements.map((el) => (el.id === id ? { ...el, x, y } : el)),
    }));
  },

  scaleElement: (id, width, height) => {
    set((s) => ({
      elements: s.elements.map((el) =>
        el.id === id
          ? { ...el, width: Math.max(20, width), height: Math.max(20, height) }
          : el
      ),
    }));
  },

  rotateElement: (id, rotation) => {
    set((s) => ({
      elements: s.elements.map((el) => (el.id === id ? { ...el, rotation } : el)),
    }));
  },

  bringToFront: (id) => {
    const state = get();
    const maxZ = state.elements.reduce((max, el) => Math.max(max, el.zIndex), 0);
    set((s) => ({
      elements: s.elements.map((el) =>
        el.id === id ? { ...el, zIndex: maxZ + 1 } : el
      ),
    }));
  },

  updateFilter: (key, value) => {
    const state = get();
    if (state.selectedIds.length === 0) return;
    set((s) => ({
      elements: s.elements.map((el) =>
        s.selectedIds.includes(el.id)
          ? { ...el, filters: { ...el.filters, [key]: value } }
          : el
      ),
    }));
  },

  updateBlendMode: (mode) => {
    const state = get();
    if (state.selectedIds.length === 0) return;
    set((s) => ({
      elements: s.elements.map((el) =>
        s.selectedIds.includes(el.id) ? { ...el, blendMode: mode } : el
      ),
    }));
  },

  resetFilters: () => {
    const state = get();
    if (state.selectedIds.length === 0) return;
    set((s) => ({
      elements: s.elements.map((el) =>
        s.selectedIds.includes(el.id)
          ? { ...el, filters: { ...defaultFilters }, blendMode: 'normal' }
          : el
      ),
    }));
  },

  setActiveCategory: (category) => set({ activeCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleFilterPanel: () => set((s) => ({ filterPanelOpen: !s.filterPanelOpen })),
  setFilterPanelOpen: (open) => set({ filterPanelOpen: open }),
  openExportDialog: () => set({ exportDialogOpen: true, exportProgress: 0, isExporting: false }),
  closeExportDialog: () => set({ exportDialogOpen: false }),
  setExportResolution: (res) => set({ exportResolution: res }),
  setExportFormat: (fmt) => set({ exportFormat: fmt }),
  setExportProgress: (progress) => set({ exportProgress: progress }),
  setIsExporting: (exporting) => set({ isExporting: exporting }),

  addRecentItem: (item) => {
    set((s) => {
      const filtered = s.recentItems.filter((i) => i.id !== item.id);
      return { recentItems: [item, ...filtered].slice(0, 12) };
    });
  },
}));
