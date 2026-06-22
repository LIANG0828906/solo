import { create } from 'zustand';
import type { KeywordStyle, TextRange } from '../types';

const DEFAULT_CODE = `function bubbleSort(arr) {
  const n = arr.length;

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        const temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }

  return arr;
}

const numbers = [64, 34, 25, 12, 22, 11, 90];
const sorted = bubbleSort(numbers);
console.log("排序结果:", sorted);`;

const STORAGE_KEY_STYLES = 'codePalette.styles';
const STORAGE_KEY_CODE = 'codePalette.code';

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored) as T;
    }
  } catch {
    // ignore
  }
  return defaultValue;
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

interface StyleState {
  code: string;
  styles: KeywordStyle[];
  selectedRange: TextRange | null;
  currentColor: string;
  exportStatus: {
    png: 'idle' | 'loading' | 'success';
    svg: 'idle' | 'loading' | 'success';
  };

  setCode: (code: string) => void;
  setSelectedRange: (range: TextRange | null) => void;
  setCurrentColor: (color: string) => void;

  addOrUpdateStyle: (style: KeywordStyle) => void;
  removeStyle: (start: number, end: number) => void;
  clearStyles: () => void;

  getStyleForRange: (start: number, end: number) => KeywordStyle | undefined;
  getSelectedStyle: () => KeywordStyle | undefined;

  updateCurrentSelectionStyle: (updates: Partial<Omit<KeywordStyle, 'start' | 'end' | 'text'>>) => void;

  setExportStatus: (format: 'png' | 'svg', status: 'idle' | 'loading' | 'success') => void;

  resetToDefault: () => void;
}

export const useStyleStore = create<StyleState>((set, get) => ({
  code: loadFromStorage<string>(STORAGE_KEY_CODE, DEFAULT_CODE),
  styles: loadFromStorage<KeywordStyle[]>(STORAGE_KEY_STYLES, []),
  selectedRange: null,
  currentColor: '#3B82F6',
  exportStatus: {
    png: 'idle',
    svg: 'idle',
  },

  setCode: (code) => {
    set({ code });
    saveToStorage(STORAGE_KEY_CODE, code);
  },

  setSelectedRange: (range) => set({ selectedRange: range }),

  setCurrentColor: (color) => set({ currentColor: color }),

  addOrUpdateStyle: (style) => {
    set((state) => {
      const existingIndex = state.styles.findIndex(
        (s) => s.start === style.start && s.end === style.end
      );
      let newStyles: KeywordStyle[];
      if (existingIndex >= 0) {
        newStyles = [...state.styles];
        newStyles[existingIndex] = style;
      } else {
        newStyles = [...state.styles, style];
      }
      saveToStorage(STORAGE_KEY_STYLES, newStyles);
      return { styles: newStyles };
    });
  },

  removeStyle: (start, end) => {
    set((state) => {
      const newStyles = state.styles.filter(
        (s) => !(s.start === start && s.end === end)
      );
      saveToStorage(STORAGE_KEY_STYLES, newStyles);
      return { styles: newStyles };
    });
  },

  clearStyles: () => {
    set({ styles: [] });
    saveToStorage(STORAGE_KEY_STYLES, []);
  },

  getStyleForRange: (start, end) => {
    return get().styles.find(
      (s) => s.start === start && s.end === end
    );
  },

  getSelectedStyle: () => {
    const { selectedRange, styles } = get();
    if (!selectedRange) return undefined;
    return styles.find(
      (s) => s.start === selectedRange.start && s.end === selectedRange.end
    );
  },

  updateCurrentSelectionStyle: (updates) => {
    const { selectedRange, code, addOrUpdateStyle, getSelectedStyle } = get();
    if (!selectedRange) return;

    const text = code.slice(selectedRange.start, selectedRange.end);
    if (!text.trim()) return;

    const existing = getSelectedStyle();
    const baseStyle: KeywordStyle = existing || {
      start: selectedRange.start,
      end: selectedRange.end,
      text,
      color: get().currentColor,
      bold: false,
      italic: false,
      underline: false,
    };

    addOrUpdateStyle({
      ...baseStyle,
      ...updates,
      text,
    });
  },

  setExportStatus: (format, status) => {
    set((state) => ({
      exportStatus: {
        ...state.exportStatus,
        [format]: status,
      },
    }));
  },

  resetToDefault: () => {
    set({
      code: DEFAULT_CODE,
      styles: [],
      selectedRange: null,
    });
    saveToStorage(STORAGE_KEY_CODE, DEFAULT_CODE);
    saveToStorage(STORAGE_KEY_STYLES, []);
  },
}));

export { DEFAULT_CODE };
