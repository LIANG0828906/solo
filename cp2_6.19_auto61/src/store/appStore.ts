import { create } from 'zustand';

export interface ImageItem {
  id: string;
  imageUrl: string;
  fileName: string;
  addedAt: string;
}

export interface Frame {
  id: string;
  imageUrl: string;
  fileName: string;
  wallId: 'north' | 'south' | 'east' | 'west';
  positionX: number;
  positionY: number;
  addedAt: string;
}

export interface Note {
  id: string;
  frameId: string;
  content: string;
  createdAt: string;
}

interface AppState {
  images: ImageItem[];
  frames: Frame[];
  notes: Note[];
  facingWall: 'north' | 'south' | 'east' | 'west';
  sidebarOpen: boolean;
  addImage: (image: ImageItem) => void;
  removeImage: (id: string) => void;
  addFrame: (frame: Frame) => void;
  removeFrame: (id: string) => void;
  updateFramePosition: (id: string, x: number, y: number) => void;
  addNote: (note: Note) => void;
  removeNote: (id: string) => void;
  updateNote: (id: string, content: string) => void;
  setFacingWall: (wall: 'north' | 'south' | 'east' | 'west') => void;
  setSidebarOpen: (open: boolean) => void;
}

const STORAGE_KEY = 'inspiration-gallery';

const loadState = (): Partial<AppState> => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* empty */ }
  return {};
};

const saveState = (state: AppState) => {
  try {
    const { images, frames, notes } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ images, frames, notes }));
  } catch { /* empty */ }
};

const loaded = loadState();

export const useAppStore = create<AppState>((set, get) => ({
  images: loaded.images || [],
  frames: loaded.frames || [],
  notes: loaded.notes || [],
  facingWall: 'north' as const,
  sidebarOpen: true,

  addImage: (image) => {
    set((state) => {
      const newState = { ...state, images: [...state.images, image] };
      saveState(newState);
      return newState;
    });
  },

  removeImage: (id) => {
    set((state) => {
      const newState = { ...state, images: state.images.filter((i) => i.id !== id) };
      saveState(newState);
      return newState;
    });
  },

  addFrame: (frame) => {
    set((state) => {
      const wallFrames = state.frames.filter((f) => f.wallId === frame.wallId);
      if (wallFrames.length >= 6) return state;
      const newState = { ...state, frames: [...state.frames, frame] };
      saveState(newState);
      return newState;
    });
  },

  removeFrame: (id) => {
    set((state) => {
      const newState = {
        ...state,
        frames: state.frames.filter((f) => f.id !== id),
        notes: state.notes.filter((n) => n.frameId !== id),
      };
      saveState(newState);
      return newState;
    });
  },

  updateFramePosition: (id, x, y) => {
    set((state) => {
      const newState = {
        ...state,
        frames: state.frames.map((f) =>
          f.id === id ? { ...f, positionX: x, positionY: y } : f
        ),
      };
      saveState(newState);
      return newState;
    });
  },

  addNote: (note) => {
    set((state) => {
      const newState = { ...state, notes: [...state.notes, note] };
      saveState(newState);
      return newState;
    });
  },

  removeNote: (id) => {
    set((state) => {
      const newState = { ...state, notes: state.notes.filter((n) => n.id !== id) };
      saveState(newState);
      return newState;
    });
  },

  updateNote: (id, content) => {
    set((state) => {
      const newState = {
        ...state,
        notes: state.notes.map((n) => (n.id === id ? { ...n, content } : n)),
      };
      saveState(newState);
      return newState;
    });
  },

  setFacingWall: (wall) => {
    set({ facingWall: wall });
  },

  setSidebarOpen: (open) => {
    set({ sidebarOpen: open });
  },
}));
