import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type ComponentType = 'title' | 'image' | 'textCard';

export interface PortfolioComponent {
  id: string;
  type: ComponentType;
  order: number;
  zIndex: number;
  props: TitleProps | ImageProps | TextCardProps;
}

export interface TitleProps {
  text: string;
  fontSize: number;
  color: string;
  align: 'left' | 'center' | 'right';
}

export interface ImageProps {
  src: string;
  widthPercent: number;
  borderRadius: number;
  alt: string;
}

export interface TextCardProps {
  content: string;
  bgColor: string;
  fontSize: number;
}

interface HistorySnapshot {
  components: PortfolioComponent[];
  themeColor: string;
  bgColor: string;
  timestamp: number;
}

interface EditorState {
  components: PortfolioComponent[];
  selectedId: string | null;
  selectedIds: string[];
  themeColor: string;
  bgColor: string;
  history: HistorySnapshot[];
  historyIndex: number;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  saveHistory: () => void;
  addComponent: (type: ComponentType, order?: number) => void;
  removeComponent: (id: string) => void;
  removeComponents: (ids: string[]) => void;
  selectComponent: (id: string | null) => void;
  toggleMultiSelect: (id: string) => void;
  clearSelection: () => void;
  updateComponentProps: (id: string, props: Record<string, unknown>) => void;
  moveComponent: (id: string, newOrder: number) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  setThemeColor: (color: string) => void;
  setBgColor: (color: string, skipHistory?: boolean) => void;
}

const MAX_HISTORY = 50;

const deepCloneComponents = (components: PortfolioComponent[]): PortfolioComponent[] =>
  JSON.parse(JSON.stringify(components));

const createSnapshot = (
  components: PortfolioComponent[],
  themeColor: string,
  bgColor: string
): HistorySnapshot => ({
  components: deepCloneComponents(components),
  themeColor,
  bgColor,
  timestamp: Date.now(),
});

const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTVlN2ViIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzlhYTBhNiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWbvueJh+WKoOi9veWbvueJh+WKoOWcsOeahOWKoOWFqDwvdGV4dD48L3N2Zz4=';

export const defaultTitleProps: TitleProps = {
  text: '点击编辑标题',
  fontSize: 32,
  color: 'inherit',
  align: 'center',
};

export const defaultImageProps: ImageProps = {
  src: PLACEHOLDER_IMAGE,
  widthPercent: 100,
  borderRadius: 0,
  alt: '图片占位',
};

export const defaultTextCardProps: TextCardProps = {
  content:
    '<h3 style="color:#2C3E50;margin-bottom:12px;">示例文本卡片</h3><p>这是一段<strong>富文本</strong>示例内容。</p><p>您可以在这里编辑<em>HTML格式</em>的文本，支持各种标签。</p><ul><li>列表项 1</li><li>列表项 2</li><li>列表项 3</li></ul>',
  bgColor: '#FFFFFF',
  fontSize: 15,
};

export const useEditorStore = create<EditorState>((set, get) => ({
  components: [],
  selectedId: null,
  selectedIds: [],
  themeColor: '#2C3E50',
  bgColor: '#F5F5F5',
  history: [],
  historyIndex: -1,
  canUndo: false,
  canRedo: false,

  saveHistory: () =>
    set((state) => {
      const snapshot = createSnapshot(state.components, state.themeColor, state.bgColor);
      const newHistory = [...state.history.slice(0, state.historyIndex + 1), snapshot];
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
      }
      const newIndex = newHistory.length - 1;
      return {
        history: newHistory,
        historyIndex: newIndex,
        canUndo: newIndex > 0,
        canRedo: false,
      };
    }),

  undo: () =>
    set((state) => {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      const snapshot = state.history[newIndex];
      return {
        components: deepCloneComponents(snapshot.components),
        themeColor: snapshot.themeColor,
        bgColor: snapshot.bgColor,
        historyIndex: newIndex,
        canUndo: newIndex > 0,
        canRedo: true,
        selectedId: null,
        selectedIds: [],
      };
    }),

  redo: () =>
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      const snapshot = state.history[newIndex];
      return {
        components: deepCloneComponents(snapshot.components),
        themeColor: snapshot.themeColor,
        bgColor: snapshot.bgColor,
        historyIndex: newIndex,
        canUndo: true,
        canRedo: newIndex < state.history.length - 1,
        selectedId: null,
        selectedIds: [],
      };
    }),

  addComponent: (type, order) => {
    const { saveHistory } = get();
    saveHistory();
    set((state) => {
      const id = uuidv4();
      const insertAt = order ?? state.components.length;
      let props: TitleProps | ImageProps | TextCardProps;

      switch (type) {
        case 'title':
          props = { ...defaultTitleProps, color: state.themeColor };
          break;
        case 'image':
          props = { ...defaultImageProps };
          break;
        case 'textCard':
          props = { ...defaultTextCardProps };
          break;
      }

      const newComp: PortfolioComponent = {
        id,
        type,
        order: insertAt,
        zIndex: state.components.length,
        props,
      };

      const updated = [...state.components];
      updated.forEach((c) => {
        if (c.order >= insertAt) {
          c.order += 1;
        }
      });
      updated.push(newComp);
      updated.sort((a, b) => a.order - b.order);
      updated.forEach((c, i) => (c.order = i));

      return { components: updated, selectedId: id, selectedIds: [id] };
    });
  },

  removeComponent: (id) => {
    const { saveHistory } = get();
    saveHistory();
    set((state) => {
      const filtered = state.components
        .filter((c) => c.id !== id)
        .sort((a, b) => a.order - b.order);
      filtered.forEach((c, i) => (c.order = i));
      return {
        components: filtered,
        selectedId: state.selectedId === id ? null : state.selectedId,
        selectedIds: state.selectedIds.filter((sid) => sid !== id),
      };
    });
  },

  removeComponents: (ids) => {
    if (ids.length === 0) return;
    const { saveHistory } = get();
    saveHistory();
    set((state) => {
      const filtered = state.components
        .filter((c) => !ids.includes(c.id))
        .sort((a, b) => a.order - b.order);
      filtered.forEach((c, i) => (c.order = i));
      return {
        components: filtered,
        selectedId: null,
        selectedIds: [],
      };
    });
  },

  selectComponent: (id) => set({ selectedId: id, selectedIds: id ? [id] : [] }),

  toggleMultiSelect: (id) =>
    set((state) => {
      const isSelected = state.selectedIds.includes(id);
      const newIds = isSelected
        ? state.selectedIds.filter((sid) => sid !== id)
        : [...state.selectedIds, id];
      return {
        selectedIds: newIds,
        selectedId: newIds.length > 0 ? newIds[newIds.length - 1] : null,
      };
    }),

  clearSelection: () => set({ selectedId: null, selectedIds: [] }),

  updateComponentProps: (id, props) => {
    const { saveHistory } = get();
    saveHistory();
    set((state) => ({
      components: state.components.map((c) =>
        c.id === id ? { ...c, props: { ...c.props, ...props } } : c
      ),
    }));
  },

  moveComponent: (id, newOrder) => {
    const { saveHistory } = get();
    saveHistory();
    set((state) => {
      const comps = [...state.components];
      const idx = comps.findIndex((c) => c.id === id);
      if (idx === -1) return state;
      const [moved] = comps.splice(idx, 1);
      moved.order = newOrder;
      comps.splice(newOrder, 0, moved);
      comps.forEach((c, i) => (c.order = i));
      return { components: comps };
    });
  },

  bringToFront: (id) => {
    const { saveHistory } = get();
    saveHistory();
    set((state) => {
      const maxZ = Math.max(...state.components.map((c) => c.zIndex));
      return {
        components: state.components.map((c) =>
          c.id === id ? { ...c, zIndex: maxZ + 1 } : c
        ),
      };
    });
  },

  sendToBack: (id) => {
    const { saveHistory } = get();
    saveHistory();
    set((state) => {
      const minZ = Math.min(...state.components.map((c) => c.zIndex));
      return {
        components: state.components.map((c) =>
          c.id === id ? { ...c, zIndex: minZ - 1 } : c
        ),
      };
    });
  },

  setThemeColor: (color) => {
    const { saveHistory } = get();
    saveHistory();
    set((state) => ({
      themeColor: color,
      components: state.components.map((c) =>
        c.type === 'title'
          ? {
              ...c,
              props: {
                ...c.props,
                color: (c.props as TitleProps).color === state.themeColor ? color : (c.props as TitleProps).color,
              },
            }
          : c
      ),
    }));
  },

  setBgColor: (color, skipHistory = false) => {
    if (!skipHistory) {
      const { saveHistory } = get();
      saveHistory();
    }
    set({ bgColor: color });
  },
}));

export const useComponentList = () => useEditorStore((s) => s.components);
export const useSelectedId = () => useEditorStore((s) => s.selectedId);
export const useSelectedIds = () => useEditorStore((s) => s.selectedIds);
export const useBgColor = () => useEditorStore((s) => s.bgColor);
export const useThemeColor = () => useEditorStore((s) => s.themeColor);
export const useCanUndo = () => useEditorStore((s) => s.canUndo);
export const useCanRedo = () => useEditorStore((s) => s.canRedo);

export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

export const getLuminance = (hex: string): number => {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const { r, g, b } = rgb;
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

export const getContrastRatio = (hex1: string, hex2: string): number => {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};

export const getBrightnessPercent = (hex: string): number => {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  return ((rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 255000) * 100;
};
