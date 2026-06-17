import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Pixel, PixelBoardState } from './types';
import { DEFAULT_COLORS } from './types';

const generateUserId = (): string => {
  return uuidv4();
};

export const usePixelStore = create<PixelBoardState>((set, get) => ({
  pixels: [],
  redoStack: [],
  currentColor: DEFAULT_COLORS[0],
  presetColors: [...DEFAULT_COLORS],
  onlineUsers: 1,
  userId: generateUserId(),
  isConnected: false,

  addPixel: (pixel: Pixel) => {
    set((state) => {
      const previousPixels = [...state.pixels];
      
      const existingIndex = state.pixels.findIndex(
        (p) => p.x === pixel.x && p.y === pixel.y
      );
      
      let newPixels: Pixel[];
      
      if (existingIndex >= 0) {
        newPixels = [...state.pixels];
        newPixels[existingIndex] = pixel;
      } else {
        newPixels = [...state.pixels, pixel];
      }
      
      return {
        pixels: newPixels,
        redoStack: [...state.redoStack, previousPixels],
      };
    });
  },

  addRemotePixel: (pixel: Pixel) => {
    set((state) => {
      const existingIndex = state.pixels.findIndex(
        (p) => p.x === pixel.x && p.y === pixel.y
      );
      
      let newPixels: Pixel[];
      
      if (existingIndex >= 0) {
        newPixels = [...state.pixels];
        newPixels[existingIndex] = pixel;
      } else {
        newPixels = [...state.pixels, pixel];
      }
      
      return {
        pixels: newPixels,
      };
    });
  },

  undo: (): Pixel | null => {
    const state = get();
    if (state.redoStack.length === 0) return null;

    const previousPixels = state.redoStack[state.redoStack.length - 1];
    const newRedoStack = state.redoStack.slice(0, -1);
    
    const currentPixels = state.pixels;
    let undonePixel: Pixel | null = null;
    
    for (const pixel of currentPixels) {
      const prevPixel = previousPixels.find(
        (p) => p.x === pixel.x && p.y === pixel.y
      );
      if (!prevPixel || prevPixel.id !== pixel.id) {
        undonePixel = pixel;
        break;
      }
    }

    set({
      pixels: previousPixels,
      redoStack: newRedoStack,
    });

    return undonePixel;
  },

  setPixels: (pixels: Pixel[]) => {
    set({ pixels, redoStack: [] });
  },

  setCurrentColor: (color: string) => {
    set({ currentColor: color });
  },

  setPresetColors: (colors: string[]) => {
    set({ presetColors: colors });
  },

  setOnlineUsers: (count: number) => {
    set({ onlineUsers: count });
  },

  setConnected: (connected: boolean) => {
    set({ isConnected: connected });
  },

  removePixelById: (id: string): Pixel | null => {
    const state = get();
    const index = state.pixels.findIndex((p) => p.id === id);
    if (index < 0) return null;

    const removedPixel = state.pixels[index];
    const newPixels = [...state.pixels];
    newPixels.splice(index, 1);

    set({ pixels: newPixels });
    return removedPixel;
  },
}));
