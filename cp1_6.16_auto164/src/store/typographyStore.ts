import { create } from 'zustand';
import { CONTRAST_MODES, ContrastModeId, FONT_LIBRARY } from '../utils/fontLoader';

export type FontWeight = 'light' | 'regular' | 'bold';
export type TextBlockType = 'title' | 'body';

export interface DragPosition {
  x: number;
  y: number;
}

export interface TypographyState {
  titleText: string;
  bodyText: string;
  titleFontId: string;
  bodyFontId: string;
  fontSize: number;
  fontWeight: FontWeight;
  lineHeight: number;
  letterSpacing: number;
  contrastMode: ContrastModeId;
  titleDrag: DragPosition;
  bodyDrag: DragPosition;
  isDragging: TextBlockType | null;
  bounceAnimating: TextBlockType | null;
  transitionKey: number;

  setTitleText: (text: string) => void;
  setBodyText: (text: string) => void;
  setTitleFontId: (id: string) => void;
  setBodyFontId: (id: string) => void;
  setFontSize: (size: number) => void;
  setFontWeight: (weight: FontWeight) => void;
  setLineHeight: (value: number) => void;
  setLetterSpacing: (value: number) => void;
  setContrastMode: (mode: ContrastModeId) => void;
  setDragPosition: (type: TextBlockType, pos: DragPosition) => void;
  setIsDragging: (type: TextBlockType | null) => void;
  setBounceAnimating: (type: TextBlockType | null) => void;
  resetDragPositions: () => void;
  resetSingleDrag: (type: TextBlockType) => void;
  bumpTransitionKey: () => void;
}

export const useTypographyStore = create<TypographyState>((set, get) => ({
  titleText: '书籍设计的艺术',
  bodyText: '一本好书的封面设计是读者与书籍之间的第一次对话。字体的选择、颜色的搭配、空间的布局，每一个细节都在诉说着故事的基调。',
  titleFontId: FONT_LIBRARY[0].id,
  bodyFontId: FONT_LIBRARY[4].id,
  fontSize: 18,
  fontWeight: 'regular',
  lineHeight: 1.6,
  letterSpacing: 0.02,
  contrastMode: 'high',
  titleDrag: { x: 0, y: 0 },
  bodyDrag: { x: 0, y: 0 },
  isDragging: null,
  bounceAnimating: null,
  transitionKey: 0,

  setTitleText: (text) => set({ titleText: text.slice(0, 100) }),
  setBodyText: (text) => set({ bodyText: text.slice(0, 100) }),

  setTitleFontId: (id) => {
    const font = FONT_LIBRARY.find((f) => f.id === id);
    if (!font) return;
    const currentWeight = get().fontWeight;
    const weightValues: Record<FontWeight, number> = {
      light: 300,
      regular: 400,
      bold: 700,
    };
    if (!font.weights.includes(weightValues[currentWeight] as 300 | 400 | 700)) {
      const fallbackWeight =
        font.weights.includes(400) ? 'regular' : (String(font.weights[0] === 300 ? 'light' : 'bold') as FontWeight);
      set({ titleFontId: id, fontWeight: fallbackWeight });
      return;
    }
    set({ titleFontId: id });
  },

  setBodyFontId: (id) => {
    const font = FONT_LIBRARY.find((f) => f.id === id);
    if (!font) return;
    const currentWeight = get().fontWeight;
    const weightValues: Record<FontWeight, number> = {
      light: 300,
      regular: 400,
      bold: 700,
    };
    if (!font.weights.includes(weightValues[currentWeight] as 300 | 400 | 700)) {
      const fallbackWeight =
        font.weights.includes(400) ? 'regular' : (String(font.weights[0] === 300 ? 'light' : 'bold') as FontWeight);
      set({ bodyFontId: id, fontWeight: fallbackWeight });
      return;
    }
    set({ bodyFontId: id });
  },

  setFontSize: (size) => set({ fontSize: Math.max(12, Math.min(72, size)) }),
  setFontWeight: (weight) => set({ fontWeight: weight }),
  setLineHeight: (value) => set({ lineHeight: Math.max(0.8, Math.min(2.0, value)) }),
  setLetterSpacing: (value) => set({ letterSpacing: Math.max(-0.05, Math.min(0.2, value)) }),

  setContrastMode: (mode) => {
    if (!CONTRAST_MODES[mode]) return;
    set((state) => ({ contrastMode: mode, transitionKey: state.transitionKey + 1 }));
  },

  setDragPosition: (type, pos) =>
    set(() => ({
      [type === 'title' ? 'titleDrag' : 'bodyDrag']: pos,
    })),

  setIsDragging: (type) => set({ isDragging: type }),
  setBounceAnimating: (type) => set({ bounceAnimating: type }),

  resetDragPositions: () =>
    set({
      titleDrag: { x: 0, y: 0 },
      bodyDrag: { x: 0, y: 0 },
    }),

  resetSingleDrag: (type) =>
    set((state) => ({
      [type === 'title' ? 'titleDrag' : 'bodyDrag']: { x: 0, y: 0 },
      bounceAnimating: state.bounceAnimating === type ? null : state.bounceAnimating,
    })),

  bumpTransitionKey: () => set((state) => ({ transitionKey: state.transitionKey + 1 })),
}));
