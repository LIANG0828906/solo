import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  Shape,
  ShapeType,
  TextureType,
  GradientConnection,
  GalleryItem,
  PRESET_COLORS,
} from '@/types';
import { loadGallery, saveGallery, generateArtId } from '@/utils/storage';

interface ArtworkState {
  shapes: Shape[];
  selectedShapeId: string | null;
  gradientConnections: GradientConnection[];
  selectedShapeType: ShapeType;
  selectedTexture: TextureType;
  selectedColor: string;
  title: string;
  author: string;
  artId: string | null;
  gallery: GalleryItem[];
  isGeneratingId: boolean;
  gradientMode: boolean;
  gradientStartId: string | null;

  addShape: (x: number, y: number) => void;
  moveShape: (id: string, x: number, y: number) => void;
  deleteShape: (id: string) => void;
  updateShapeColor: (id: string, color: string) => void;
  selectShape: (id: string | null) => void;
  setSelectedColor: (color: string) => void;
  setSelectedShapeType: (type: ShapeType) => void;
  setSelectedTexture: (texture: TextureType) => void;
  addGradientConnection: (fromId: string, toId: string) => void;
  setGradientMode: (active: boolean) => void;
  setGradientStartId: (id: string | null) => void;
  setTitle: (title: string) => void;
  setAuthor: (author: string) => void;
  generateArtIdAction: () => void;
  saveToGallery: (thumbnail: string) => void;
  deleteFromGallery: (id: string) => void;
  loadFromGallery: (item: GalleryItem) => void;
  clearCanvas: () => void;
}

export const useArtworkStore = create<ArtworkState>((set, get) => ({
  shapes: [],
  selectedShapeId: null,
  gradientConnections: [],
  selectedShapeType: 'circle',
  selectedTexture: 'none',
  selectedColor: PRESET_COLORS[0],
  title: '',
  author: '',
  artId: null,
  gallery: loadGallery(),
  isGeneratingId: false,
  gradientMode: false,
  gradientStartId: null,

  addShape: (x: number, y: number) => {
    const { selectedShapeType, selectedColor, selectedTexture, shapes } = get();
    const newShape: Shape = {
      id: uuidv4(),
      type: selectedShapeType,
      x,
      y,
      size: 80,
      color: selectedColor,
      texture: selectedTexture,
      rotation: 0,
    };
    set({ shapes: [...shapes, newShape], selectedShapeId: newShape.id });
  },

  moveShape: (id: string, x: number, y: number) => {
    set((state) => ({
      shapes: state.shapes.map((s) =>
        s.id === id ? { ...s, x, y } : s
      ),
    }));
  },

  deleteShape: (id: string) => {
    set((state) => ({
      shapes: state.shapes.filter((s) => s.id !== id),
      selectedShapeId: state.selectedShapeId === id ? null : state.selectedShapeId,
      gradientConnections: state.gradientConnections.filter(
        (c) => c.fromShapeId !== id && c.toShapeId !== id
      ),
    }));
  },

  updateShapeColor: (id: string, color: string) => {
    set((state) => ({
      shapes: state.shapes.map((s) =>
        s.id === id ? { ...s, color } : s
      ),
    }));
  },

  selectShape: (id: string | null) => {
    set({ selectedShapeId: id });
  },

  setSelectedColor: (color: string) => {
    const { selectedShapeId, updateShapeColor } = get();
    if (selectedShapeId) {
      updateShapeColor(selectedShapeId, color);
    }
    set({ selectedColor: color });
  },

  setSelectedShapeType: (type: ShapeType) => {
    set({ selectedShapeType: type });
  },

  setSelectedTexture: (texture: TextureType) => {
    set({ selectedTexture: texture });
  },

  addGradientConnection: (fromId: string, toId: string) => {
    const { gradientConnections } = get();
    const exists = gradientConnections.some(
      (c) =>
        (c.fromShapeId === fromId && c.toShapeId === toId) ||
        (c.fromShapeId === toId && c.toShapeId === fromId)
    );
    if (exists) return;

    const connection: GradientConnection = {
      id: uuidv4(),
      fromShapeId: fromId,
      toShapeId: toId,
    };
    set({
      gradientConnections: [...gradientConnections, connection],
      gradientMode: false,
      gradientStartId: null,
    });
  },

  setGradientMode: (active: boolean) => {
    set({ gradientMode: active, gradientStartId: null });
  },

  setGradientStartId: (id: string | null) => {
    set({ gradientStartId: id });
  },

  setTitle: (title: string) => {
    set({ title });
  },

  setAuthor: (author: string) => {
    set({ author });
  },

  generateArtIdAction: () => {
    set({ isGeneratingId: true });
    setTimeout(() => {
      const newId = generateArtId();
      set({ artId: newId, isGeneratingId: false });
    }, 500);
  },

  saveToGallery: (thumbnail: string) => {
    const { shapes, title, author, artId, gradientConnections, gallery } = get();
    const item: GalleryItem = {
      id: uuidv4(),
      artId: artId || generateArtId(),
      title: title || '未命名作品',
      author: author || '匿名',
      thumbnail,
      shapes: [...shapes],
      gradientConnections: [...gradientConnections],
      createdAt: Date.now(),
    };
    const newGallery = [item, ...gallery];
    set({ gallery: newGallery });
    saveGallery(newGallery);
  },

  deleteFromGallery: (id: string) => {
    const { gallery } = get();
    const newGallery = gallery.filter((item) => item.id !== id);
    set({ gallery: newGallery });
    saveGallery(newGallery);
  },

  loadFromGallery: (item: GalleryItem) => {
    set({
      shapes: [...item.shapes],
      gradientConnections: [...item.gradientConnections],
      title: item.title,
      author: item.author,
      artId: item.artId,
      selectedShapeId: null,
    });
  },

  clearCanvas: () => {
    set({
      shapes: [],
      gradientConnections: [],
      selectedShapeId: null,
      title: '',
      author: '',
      artId: null,
    });
  },
}));
