import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type ComponentType = 'title' | 'image' | 'textCard';

export interface PortfolioComponent {
  id: string;
  type: ComponentType;
  order: number;
  props: TitleProps | ImageProps | TextCardProps;
}

export interface TitleProps {
  text: string;
  fontSize: number;
}

export interface ImageProps {
  src: string;
  widthPercent: number;
  borderRadius: number;
}

export interface TextCardProps {
  content: string;
  bgColor: string;
}

interface EditorState {
  components: PortfolioComponent[];
  selectedId: string | null;
  themeColor: string;
  bgColor: string;
  addComponent: (type: ComponentType, order?: number) => void;
  removeComponent: (id: string) => void;
  selectComponent: (id: string | null) => void;
  updateComponentProps: (id: string, props: Record<string, unknown>) => void;
  moveComponent: (id: string, newOrder: number) => void;
  setThemeColor: (color: string) => void;
  setBgColor: (color: string) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  components: [],
  selectedId: null,
  themeColor: '#2C3E50',
  bgColor: '#F5F5F5',

  addComponent: (type, order) =>
    set((state) => {
      const id = uuidv4();
      const insertAt = order ?? state.components.length;
      let props: TitleProps | ImageProps | TextCardProps;

      switch (type) {
        case 'title':
          props = { text: '标题文本', fontSize: 32 };
          break;
        case 'image':
          props = {
            src: 'https://trae-api-cn.mchont.guru/api/ide/v1/text_to_image?prompt=portfolio%20cover%20image%20modern%20design%20minimal&image_size=landscape_16_9',
            widthPercent: 100,
            borderRadius: 0,
          };
          break;
        case 'textCard':
          props = {
            content: '在此输入文本内容...',
            bgColor: '#FFFFFF',
          };
          break;
      }

      const newComp: PortfolioComponent = { id, type, order: insertAt, props };

      const updated = [...state.components];
      updated.forEach((c) => {
        if (c.order >= insertAt) {
          c.order += 1;
        }
      });
      updated.push(newComp);
      updated.sort((a, b) => a.order - b.order);
      updated.forEach((c, i) => (c.order = i));

      return { components: updated, selectedId: id };
    }),

  removeComponent: (id) =>
    set((state) => {
      const filtered = state.components
        .filter((c) => c.id !== id)
        .sort((a, b) => a.order - b.order);
      filtered.forEach((c, i) => (c.order = i));
      return {
        components: filtered,
        selectedId: state.selectedId === id ? null : state.selectedId,
      };
    }),

  selectComponent: (id) => set({ selectedId: id }),

  updateComponentProps: (id, props) =>
    set((state) => ({
      components: state.components.map((c) =>
        c.id === id ? { ...c, props: { ...c.props, ...props } } : c
      ),
    })),

  moveComponent: (id, newOrder) =>
    set((state) => {
      const comps = [...state.components];
      const idx = comps.findIndex((c) => c.id === id);
      if (idx === -1) return state;
      const [moved] = comps.splice(idx, 1);
      moved.order = newOrder;
      comps.splice(newOrder, 0, moved);
      comps.forEach((c, i) => (c.order = i));
      return { components: comps };
    }),

  setThemeColor: (color) => set({ themeColor: color }),
  setBgColor: (color) => set({ bgColor: color }),
}));

export const useComponentList = () =>
  useEditorStore((s) => s.components);

export const useSelectedId = () =>
  useEditorStore((s) => s.selectedId);

export const useBgColor = () =>
  useEditorStore((s) => s.bgColor);

export const useThemeColor = () =>
  useEditorStore((s) => s.themeColor);
