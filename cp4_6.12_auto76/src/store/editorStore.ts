import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { LayoutComponent, ComponentType, ComponentProps, LayoutComponentStyle } from '../types';

interface EditorState {
  components: LayoutComponent[];
  history: LayoutComponent[][];
  historyIndex: number;
  selectedComponentId: string | null;
  viewportMode: 'mobile' | 'desktop';

  addComponent: (type: ComponentType, index?: number) => void;
  removeComponent: (id: string) => void;
  moveComponent: (fromIndex: number, toIndex: number) => void;
  selectComponent: (id: string | null) => void;
  updateComponentProps: (id: string, props: Partial<ComponentProps>) => void;
  updateComponentStyle: (id: string, style: Partial<LayoutComponentStyle>) => void;
  undo: () => void;
  redo: () => void;
  setViewportMode: (mode: 'mobile' | 'desktop') => void;
  loadComponents: (components: LayoutComponent[]) => void;
}

const createDefaultStyle = (): LayoutComponentStyle => ({
  backgroundColor: '#ffffff',
  padding: 12,
  fontSize: 14,
});

const createDefaultProps = (type: ComponentType): ComponentProps => {
  switch (type) {
    case 'banner':
      return {
        imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=300&fit=crop',
        link: '#',
      };
    case 'product-grid':
      return {
        columns: 3,
      };
    case 'coupon':
      return {
        title: '新人专享优惠券',
        discountCode: 'NEW2024',
      };
    default:
      return {};
  }
};

const pushToHistory = (state: EditorState): Partial<EditorState> => {
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(JSON.parse(JSON.stringify(state.components)));
  return {
    history: newHistory,
    historyIndex: newHistory.length - 1,
  };
};

export const useEditorStore = create<EditorState>((set, get) => ({
  components: [],
  history: [[]],
  historyIndex: 0,
  selectedComponentId: null,
  viewportMode: 'desktop',

  addComponent: (type, index) => {
    set((state) => {
      const newComponent: LayoutComponent = {
        id: uuidv4(),
        type,
        position: index ?? state.components.length,
        style: createDefaultStyle(),
        props: createDefaultProps(type),
      };

      const newComponents = [...state.components];
      const insertIndex = index ?? state.components.length;
      newComponents.splice(insertIndex, 0, newComponent);
      const reindexed = newComponents.map((c, i) => ({ ...c, position: i }));

      return {
        components: reindexed,
        selectedComponentId: newComponent.id,
        ...pushToHistory({ ...state, components: reindexed }),
      };
    });
  },

  removeComponent: (id) => {
    set((state) => {
      const newComponents = state.components
        .filter((c) => c.id !== id)
        .map((c, i) => ({ ...c, position: i }));

      return {
        components: newComponents,
        selectedComponentId: state.selectedComponentId === id ? null : state.selectedComponentId,
        ...pushToHistory({ ...state, components: newComponents }),
      };
    });
  },

  moveComponent: (fromIndex, toIndex) => {
    set((state) => {
      if (fromIndex === toIndex) return {};

      const newComponents = [...state.components];
      const [moved] = newComponents.splice(fromIndex, 1);
      newComponents.splice(toIndex, 0, moved);
      const reindexed = newComponents.map((c, i) => ({ ...c, position: i }));

      return {
        components: reindexed,
        ...pushToHistory({ ...state, components: reindexed }),
      };
    });
  },

  selectComponent: (id) => {
    set({ selectedComponentId: id });
  },

  updateComponentProps: (id, props) => {
    set((state) => ({
      components: state.components.map((c) =>
        c.id === id ? { ...c, props: { ...c.props, ...props } } : c
      ),
    }));
  },

  updateComponentStyle: (id, style) => {
    set((state) => ({
      components: state.components.map((c) =>
        c.id === id ? { ...c, style: { ...c.style, ...style } } : c
      ),
    }));
  },

  undo: () => {
    set((state) => {
      if (state.historyIndex <= 0) return {};
      const newIndex = state.historyIndex - 1;
      return {
        components: JSON.parse(JSON.stringify(state.history[newIndex])),
        historyIndex: newIndex,
        selectedComponentId: null,
      };
    });
  },

  redo: () => {
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return {};
      const newIndex = state.historyIndex + 1;
      return {
        components: JSON.parse(JSON.stringify(state.history[newIndex])),
        historyIndex: newIndex,
        selectedComponentId: null,
      };
    });
  },

  setViewportMode: (mode) => {
    set({ viewportMode: mode });
  },

  loadComponents: (components) => {
    set((state) => ({
      components,
      ...pushToHistory({ ...state, components }),
    }));
  },
}));
