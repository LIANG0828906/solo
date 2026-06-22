import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { toPng } from 'html-to-image';
import { BoardState, BoardElement, ColorScheme, FontPreset } from '@/types';
import { DEFAULT_FONT_PRESET } from '@/utils/fontPresets';
import { generateColorScheme } from '@/utils/colorGenerator';

const MAX_HISTORY = 20;
const MAX_ELEMENTS = 30;

interface BoardActions {
  addElement: (element: Omit<BoardElement, 'id' | 'zIndex'>) => void;
  removeElement: (id: string) => void;
  updateElement: (id: string, updates: Partial<BoardElement>) => void;
  selectElement: (id: string | null) => void;
  moveElement: (id: string, x: number, y: number) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  generateAndApplyColorScheme: (primaryColor: string) => void;
  applyColorScheme: (scheme: ColorScheme) => void;
  setFontPreset: (preset: FontPreset) => void;
  undoColor: () => void;
  redoColor: () => void;
  exportBoard: (boardRef: HTMLElement | null) => Promise<void>;
  hideToast: () => void;
  copyShareText: (text: string) => void;
}

const getInitialState = (): BoardState => ({
  elements: [],
  selectedElementId: null,
  colorHistory: [],
  historyIndex: -1,
  currentFontPreset: DEFAULT_FONT_PRESET,
  currentColorScheme: null,
  isExporting: false,
  exportToast: {
    visible: false,
    message: '',
  },
});

export const useBoardStore = create<BoardState & BoardActions>((set, get) => ({
  ...getInitialState(),

  addElement: (element) => {
    const { elements } = get();
    if (elements.length >= MAX_ELEMENTS) {
      return;
    }
    const newElement: BoardElement = {
      ...element,
      id: uuidv4(),
      zIndex: elements.length,
    };
    set({ elements: [...elements, newElement], selectedElementId: newElement.id });
  },

  removeElement: (id) => {
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
    }));
  },

  updateElement: (id, updates) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ),
    }));
  },

  selectElement: (id) => {
    set({ selectedElementId: id });
  },

  moveElement: (id, x, y) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, x, y } : el
      ),
    }));
  },

  bringForward: (id) => {
    set((state) => {
      const elements = [...state.elements];
      const index = elements.findIndex((el) => el.id === id);
      if (index < elements.length - 1) {
        const nextIndex = index + 1;
        const tempZ = elements[index].zIndex;
        elements[index].zIndex = elements[nextIndex].zIndex;
        elements[nextIndex].zIndex = tempZ;
        [elements[index], elements[nextIndex]] = [elements[nextIndex], elements[index]];
      }
      return { elements };
    });
  },

  sendBackward: (id) => {
    set((state) => {
      const elements = [...state.elements];
      const index = elements.findIndex((el) => el.id === id);
      if (index > 0) {
        const prevIndex = index - 1;
        const tempZ = elements[index].zIndex;
        elements[index].zIndex = elements[prevIndex].zIndex;
        elements[prevIndex].zIndex = tempZ;
        [elements[index], elements[prevIndex]] = [elements[prevIndex], elements[index]];
      }
      return { elements };
    });
  },

  bringToFront: (id) => {
    set((state) => {
      const elements = [...state.elements];
      const maxZ = Math.max(...elements.map((el) => el.zIndex));
      return {
        elements: elements.map((el) =>
          el.id === id ? { ...el, zIndex: maxZ + 1 } : el
        ),
      };
    });
  },

  sendToBack: (id) => {
    set((state) => {
      const elements = [...state.elements];
      const minZ = Math.min(...elements.map((el) => el.zIndex));
      return {
        elements: elements.map((el) =>
          el.id === id ? { ...el, zIndex: minZ - 1 } : el
        ),
      };
    });
  },

  generateAndApplyColorScheme: (primaryColor) => {
    const scheme = generateColorScheme(primaryColor);
    get().applyColorScheme(scheme);
  },

  applyColorScheme: (scheme) => {
    const { colorHistory, historyIndex, elements, currentFontPreset } = get();
    
    const allColors = [scheme.primary, ...scheme.complementary, ...scheme.auxiliary];
    const updatedElements = elements.map((el, index) => ({
      ...el,
      fill: allColors[index % allColors.length],
    }));

    const newHistory = colorHistory.slice(0, historyIndex + 1);
    newHistory.push(scheme);
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    }

    const shareText = `我的品牌灵感板 —— 使用${currentFontPreset.displayName}字体组合，主色调为${scheme.primary}`;

    set({
      elements: updatedElements,
      currentColorScheme: scheme,
      colorHistory: newHistory,
      historyIndex: newHistory.length - 1,
      exportToast: {
        visible: true,
        message: '配色方案已应用！',
        shareText,
      },
    });

    setTimeout(() => {
      get().hideToast();
    }, 2000);
  },

  setFontPreset: (preset) => {
    const { elements } = get();
    const updatedElements = elements.map((el) => {
      if (el.type === 'text') {
        return {
          ...el,
          fontFamily: el.fontSize && el.fontSize > 18 ? preset.titleFont : preset.bodyFont,
        };
      }
      return el;
    });

    set({
      currentFontPreset: preset,
      elements: updatedElements,
    });
  },

  undoColor: () => {
    const { colorHistory, historyIndex } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const scheme = colorHistory[newIndex];
      if (scheme) {
        get().applyColorScheme(scheme);
        set({ historyIndex: newIndex });
      }
    }
  },

  redoColor: () => {
    const { colorHistory, historyIndex } = get();
    if (historyIndex < colorHistory.length - 1) {
      const newIndex = historyIndex + 1;
      const scheme = colorHistory[newIndex];
      if (scheme) {
        get().applyColorScheme(scheme);
        set({ historyIndex: newIndex });
      }
    }
  },

  exportBoard: async (boardRef) => {
    if (!boardRef) return;
    
    set({ isExporting: true });
    
    try {
      const dataUrl = await toPng(boardRef, {
        quality: 1,
        pixelRatio: 2,
        width: 1440,
        height: 900,
      });
      
      const { currentFontPreset, currentColorScheme } = get();
      const shareText = `我的品牌灵感板 —— 使用${currentFontPreset.displayName}字体组合，主色调为${currentColorScheme?.primary || '#1976D2'}`;
      
      set({
        isExporting: false,
        exportToast: {
          visible: true,
          message: '导出成功！点击下载图片',
          downloadUrl: dataUrl,
          shareText,
        },
      });
    } catch (error) {
      set({
        isExporting: false,
        exportToast: {
          visible: true,
          message: '导出失败，请重试',
        },
      });
      
      setTimeout(() => {
        get().hideToast();
      }, 2000);
    }
  },

  hideToast: () => {
    set((state) => ({
      exportToast: { ...state.exportToast, visible: false },
    }));
  },

  copyShareText: async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      set((state) => ({
        exportToast: {
          ...state.exportToast,
          visible: true,
          message: '分享文本已复制到剪贴板！',
        },
      }));
      
      setTimeout(() => {
        get().hideToast();
      }, 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  },
}));
