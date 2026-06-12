import { create } from 'zustand';
import { TextBubble, PlacedSticker } from './types';

interface EditorState {
  backgroundUrl: string | null;
  textBubbles: TextBubble[];
  placedStickers: PlacedSticker[];
  selectedItemId: string | null;
  setBackground: (url: string | null) => void;
  addTextBubble: (bubble: TextBubble) => void;
  updateTextBubble: (id: string, updates: Partial<TextBubble>) => void;
  removeTextBubble: (id: string) => void;
  addPlacedSticker: (sticker: PlacedSticker) => void;
  updatePlacedSticker: (id: string, updates: Partial<PlacedSticker>) => void;
  removePlacedSticker: (id: string) => void;
  selectItem: (id: string | null) => void;
  reset: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  backgroundUrl: null,
  textBubbles: [],
  placedStickers: [],
  selectedItemId: null,

  setBackground: (url) => set({ backgroundUrl: url }),

  addTextBubble: (bubble) =>
    set((s) => ({ textBubbles: [...s.textBubbles, bubble], selectedItemId: bubble.id })),

  updateTextBubble: (id, updates) =>
    set((s) => ({
      textBubbles: s.textBubbles.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    })),

  removeTextBubble: (id) =>
    set((s) => ({
      textBubbles: s.textBubbles.filter((b) => b.id !== id),
      selectedItemId: s.selectedItemId === id ? null : s.selectedItemId,
    })),

  addPlacedSticker: (sticker) =>
    set((s) => ({ placedStickers: [...s.placedStickers, sticker], selectedItemId: sticker.id })),

  updatePlacedSticker: (id, updates) =>
    set((s) => ({
      placedStickers: s.placedStickers.map((st) => (st.id === id ? { ...st, ...updates } : st)),
    })),

  removePlacedSticker: (id) =>
    set((s) => ({
      placedStickers: s.placedStickers.filter((st) => st.id !== id),
      selectedItemId: s.selectedItemId === id ? null : s.selectedItemId,
    })),

  selectItem: (id) => set({ selectedItemId: id }),

  reset: () =>
    set({
      backgroundUrl: null,
      textBubbles: [],
      placedStickers: [],
      selectedItemId: null,
    }),
}));
