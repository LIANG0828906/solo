export interface MagazineElement {
  id: string;
  type: 'text' | 'image' | 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  content?: string;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  src?: string;
  fillColor?: string;
}

export interface Page {
  id: string;
  title: string;
  elements: MagazineElement[];
  isCover: boolean;
  isToc: boolean;
  order: number;
}

export interface Magazine {
  id: string;
  name: string;
  author: string;
  pages: Page[];
  coverPageId: string | null;
}

export const CANVAS_ASPECT = 1.414;

export const FONTS = [
  'Noto Serif SC',
  'ZCOOL QingKe HuangYou',
  'Ma Shan Zheng',
  'ZCOOL XiaoWei',
  'Dancing Script',
] as const;

export const MAX_PAGES = 12;
