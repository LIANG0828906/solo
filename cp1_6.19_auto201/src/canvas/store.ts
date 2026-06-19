import { create } from 'zustand';
import type { Album } from '../data/albumDatabase';

export interface CanvasCover {
  id: string;
  album: Album;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  zIndex: number;
}

interface CanvasState {
  covers: CanvasCover[];
  backgroundColor: string;
  selectedId: string | null;
  canvasWidth: number;
  canvasHeight: number;
  addCover: (album: Album) => void;
  removeCover: (id: string) => void;
  updateCover: (id: string, patch: Partial<CanvasCover>) => void;
  setBackgroundColor: (color: string) => void;
  setSelectedId: (id: string | null) => void;
  bringToFront: (id: string) => void;
  clearCanvas: () => void;
  reorderCovers: (orderedIds: string[]) => void;
}

export const CANVAS_WIDTH_MM = 300;
export const CANVAS_HEIGHT_MM = 400;
export const COVER_BASE_SIZE = 120;
export const MAX_COVERS = 12;
export const SNAP_GAP = 8;
export const SNAP_THRESHOLD = 20;

const initialBackgroundColor = '#3E2723';

export const useCanvasStore = create<CanvasState>((set, get) => ({
  covers: [],
  backgroundColor: initialBackgroundColor,
  selectedId: null,
  canvasWidth: CANVAS_WIDTH_MM,
  canvasHeight: CANVAS_HEIGHT_MM,

  addCover: (album) => {
    const { covers } = get();
    if (covers.length >= MAX_COVERS) return;
    const existing = covers.find(c => c.album.id === album.id);
    if (existing) return;

    const cols = 3;
    const rows = Math.ceil((covers.length + 1) / cols);
    const idx = covers.length;
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const spacing = COVER_BASE_SIZE + 20;

    const newCover: CanvasCover = {
      id: `cover-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      album,
      x: 40 + col * spacing,
      y: 40 + row * spacing,
      scale: 1,
      rotation: 0,
      zIndex: idx + 1,
    };
    set({ covers: [...covers, newCover], selectedId: newCover.id });
  },

  removeCover: (id) => {
    const { covers, selectedId } = get();
    set({
      covers: covers.filter(c => c.id !== id),
      selectedId: selectedId === id ? null : selectedId,
    });
  },

  updateCover: (id, patch) => {
    set({
      covers: get().covers.map(c => (c.id === id ? { ...c, ...patch } : c)),
    });
  },

  setBackgroundColor: (color) => set({ backgroundColor: color }),

  setSelectedId: (id) => set({ selectedId: id }),

  bringToFront: (id) => {
    const { covers } = get();
    const maxZ = Math.max(...covers.map(c => c.zIndex), 0);
    set({
      covers: covers.map(c =>
        c.id === id ? { ...c, zIndex: maxZ + 1 } : c
      ),
    });
  },

  clearCanvas: () => set({ covers: [], selectedId: null }),

  reorderCovers: (orderedIds) => {
    const { covers } = get();
    const map = new Map(covers.map(c => [c.id, c]));
    const next: CanvasCover[] = orderedIds
      .map(id => map.get(id))
      .filter(Boolean) as CanvasCover[];
    next.forEach((c, i) => (c.zIndex = i + 1));
    covers.forEach(c => {
      if (!orderedIds.includes(c.id)) next.push(c);
    });
    set({ covers: next });
  },
}));
