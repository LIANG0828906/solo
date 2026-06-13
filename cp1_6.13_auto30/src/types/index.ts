export enum ElementType {
  TEXT = 'text',
  IMAGE = 'image',
}

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
}

export interface TextElement extends BaseElement {
  type: ElementType.TEXT;
  content: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  lineHeight: number;
  textAlign: 'left' | 'center' | 'right';
}

export interface ImageElement extends BaseElement {
  type: ElementType.IMAGE;
  src: string;
  objectFit: 'contain' | 'cover';
}

export type PosterElement = TextElement | ImageElement;

export interface LayoutState {
  elements: PosterElement[];
  selectedId: string | null;
  backgroundColor: string;
}

export type LayoutStateCallback = (state: LayoutState) => void;

export const CANVAS_WIDTH = 595;
export const CANVAS_HEIGHT = 842;

export const AVAILABLE_FONTS = [
  { label: '系统默认', value: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  { label: '宋体', value: '"SimSun", "Songti SC", serif' },
  { label: '黑体', value: '"SimHei", "Heiti SC", sans-serif' },
  { label: '微软雅黑', value: '"Microsoft YaHei", sans-serif' },
  { label: '楷体', value: '"KaiTi", "Kaiti SC", serif' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Courier New', value: '"Courier New", Courier, monospace' },
];

export const DRAG_TYPES = {
  MATERIAL: 'material',
  LAYER: 'layer',
} as const;

export interface MaterialDragItem {
  type: typeof DRAG_TYPES.MATERIAL;
  elementType: ElementType;
}

export interface LayerDragItem {
  type: typeof DRAG_TYPES.LAYER;
  index: number;
  elementId: string;
}
