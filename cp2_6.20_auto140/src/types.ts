export type ElementType = 'text' | 'image' | 'shape';
export type FontFamily =
  | 'Noto Serif SC'
  | 'ZCOOL QingKe HuangYou'
  | 'Ma Shan Zheng'
  | 'ZCOOL XiaoWei'
  | 'Dancing Script';
export type FitMode = 'cover' | 'contain';

export const FONT_FAMILIES: FontFamily[] = [
  'Noto Serif SC',
  'ZCOOL QingKe HuangYou',
  'Ma Shan Zheng',
  'ZCOOL XiaoWei',
  'Dancing Script',
];

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
  type: 'text';
  content: string;
  fontFamily: FontFamily;
  fontSize: number;
  color: string;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  fitMode: FitMode;
}

export interface ShapeElement extends BaseElement {
  type: 'shape';
  fillColor: string;
  borderRadius: number;
}

export type Element = TextElement | ImageElement | ShapeElement;

export interface Page {
  id: string;
  order: number;
  elements: Element[];
  isToc?: boolean;
}

export interface Magazine {
  id: string;
  name: string;
  author: string;
  pages: Page[];
  coverPageId: string | null;
}

export type ResizeHandle =
  | 'nw'
  | 'n'
  | 'ne'
  | 'e'
  | 'se'
  | 's'
  | 'sw'
  | 'w';

export const CANVAS_WIDTH = 680;
export const CANVAS_HEIGHT = Math.round(CANVAS_WIDTH * 1.414);
