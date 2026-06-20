import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { EmojiItem, Viewport, FilterType, EmojiCategory } from './types';

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    name: 'smileys',
    icon: '😊',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐']
  },
  {
    name: 'animals',
    icon: '🐶',
    emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋']
  },
  {
    name: 'food',
    icon: '🍎',
    emojis: ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🧅', '🥔', '🍞', '🥐', '🥨', '🧀', '🍖', '🍗', '🍔', '🍟', '🍕', '🌭']
  },
  {
    name: 'symbols',
    icon: '❤️',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '⭐', '🌟', '✨', '💫', '🔥', '💧', '🌙', '☀️', '⚡', '🌈', '💎', '🎯']
  }
];

interface CanvasStore {
  emojis: EmojiItem[];
  viewport: Viewport;
  currentEmoji: string;
  currentColor: string;
  currentSize: number;
  currentCategory: string;
  currentFilter: FilterType;
  selectedEmojiId: string | null;
  categories: EmojiCategory[];
  maxZIndex: number;

  addEmoji: (x: number, y: number) => void;
  removeEmoji: (id: string) => void;
  updateEmojiPosition: (id: string, x: number, y: number) => void;
  updateEmojiSize: (id: string, size: number) => void;
  updateEmojiColor: (id: string, color: string) => void;
  duplicateEmoji: (id: string) => void;
  bringToFront: (id: string) => void;

  setViewport: (viewport: Partial<Viewport>) => void;
  setCurrentEmoji: (emoji: string) => void;
  setCurrentColor: (color: string) => void;
  setCurrentSize: (size: number) => void;
  setCurrentCategory: (category: string) => void;
  setCurrentFilter: (filter: FilterType) => void;
  setSelectedEmojiId: (id: string | null) => void;

  getEmojiAtPoint: (x: number, y: number) => EmojiItem | null;
  screenToCanvas: (screenX: number, screenY: number) => { x: number; y: number };
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  emojis: [],
  viewport: {
    offsetX: 0,
    offsetY: 0,
    scale: 1
  },
  currentEmoji: '😀',
  currentColor: '#FF6B6B',
  currentSize: 48,
  currentCategory: 'smileys',
  currentFilter: 'none',
  selectedEmojiId: null,
  categories: EMOJI_CATEGORIES,
  maxZIndex: 0,

  addEmoji: (x: number, y: number) => {
    const { currentEmoji, currentColor, currentSize, maxZIndex } = get();
    const newEmoji: EmojiItem = {
      id: uuidv4(),
      emoji: currentEmoji,
      x,
      y,
      size: currentSize,
      color: currentColor,
      zIndex: maxZIndex + 1
    };
    set((state) => ({
      emojis: [...state.emojis, newEmoji],
      maxZIndex: state.maxZIndex + 1
    }));
  },

  removeEmoji: (id: string) => {
    set((state) => ({
      emojis: state.emojis.filter((e) => e.id !== id),
      selectedEmojiId: state.selectedEmojiId === id ? null : state.selectedEmojiId
    }));
  },

  updateEmojiPosition: (id: string, x: number, y: number) => {
    set((state) => ({
      emojis: state.emojis.map((e) =>
        e.id === id ? { ...e, x, y } : e
      )
    }));
  },

  updateEmojiSize: (id: string, size: number) => {
    set((state) => ({
      emojis: state.emojis.map((e) =>
        e.id === id ? { ...e, size } : e
      )
    }));
  },

  updateEmojiColor: (id: string, color: string) => {
    set((state) => ({
      emojis: state.emojis.map((e) =>
        e.id === id ? { ...e, color } : e
      )
    }));
  },

  duplicateEmoji: (id: string) => {
    const { maxZIndex } = get();
    set((state) => {
      const emoji = state.emojis.find((e) => e.id === id);
      if (!emoji) return state;

      const newEmoji: EmojiItem = {
        ...emoji,
        id: uuidv4(),
        x: emoji.x + 20,
        y: emoji.y + 20,
        zIndex: state.maxZIndex + 1
      };

      return {
        emojis: [...state.emojis, newEmoji],
        maxZIndex: maxZIndex + 1,
        selectedEmojiId: newEmoji.id
      };
    });
  },

  bringToFront: (id: string) => {
    const { maxZIndex } = get();
    set((state) => ({
      emojis: state.emojis.map((e) =>
        e.id === id ? { ...e, zIndex: maxZIndex + 1 } : e
      ),
      maxZIndex: maxZIndex + 1
    }));
  },

  setViewport: (viewport) => {
    set((state) => ({
      viewport: { ...state.viewport, ...viewport }
    }));
  },

  setCurrentEmoji: (emoji) => {
    set({ currentEmoji: emoji });
  },

  setCurrentColor: (color) => {
    set({ currentColor: color });
  },

  setCurrentSize: (size) => {
    set({ currentSize: size });
  },

  setCurrentCategory: (category) => {
    const { categories } = get();
    const cat = categories.find((c) => c.name === category);
    if (cat && cat.emojis.length > 0) {
      set({ currentCategory: category, currentEmoji: cat.emojis[0]! });
    }
  },

  setCurrentFilter: (filter) => {
    set({ currentFilter: filter });
  },

  setSelectedEmojiId: (id) => {
    set({ selectedEmojiId: id });
  },

  getEmojiAtPoint: (x: number, y: number) => {
    const { emojis } = get();
    const sorted = [...emojis].sort((a, b) => b.zIndex - a.zIndex);

    for (const emoji of sorted) {
      const halfSize = emoji.size / 2;
      if (
        x >= emoji.x - halfSize &&
        x <= emoji.x + halfSize &&
        y >= emoji.y - halfSize &&
        y <= emoji.y + halfSize
      ) {
        return emoji;
      }
    }
    return null;
  },

  screenToCanvas: (screenX: number, screenY: number) => {
    const { viewport } = get();
    return {
      x: (screenX - viewport.offsetX) / viewport.scale,
      y: (screenY - viewport.offsetY) / viewport.scale
    };
  }
}));
