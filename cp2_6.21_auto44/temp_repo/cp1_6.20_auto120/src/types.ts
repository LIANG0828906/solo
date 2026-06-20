export interface BrandColor {
  name: string;
  value: string;
}

export interface FontConfig {
  family: string;
  size: number;
  weight: number;
  lineHeight: number;
}

export type ElementType = 'logo' | 'text' | 'rectangle';

export interface BaseCanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  zIndex: number;
}

export interface LogoElement extends BaseCanvasElement {
  type: 'logo';
  src: string;
  width: number;
  height: number;
  scale: number;
  rotation: number;
}

export interface TextElement extends BaseCanvasElement {
  type: 'text';
  content: string;
  font: FontConfig;
  color: string;
}

export interface RectangleElement extends BaseCanvasElement {
  type: 'rectangle';
  width: number;
  height: number;
  fill: string;
  borderRadius: number;
  opacity: number;
}

export type CanvasElement = LogoElement | TextElement | RectangleElement;

export interface CanvasPreset {
  id: string;
  name: string;
  width: number;
  height: number;
}

export interface BrandState {
  brandName: string;
  logoSrc: string | null;
  colorPalette: BrandColor[];
  selectedColor: string;
  titleFont: FontConfig;
  bodyFont: FontConfig;
  elements: CanvasElement[];
  selectedElementId: string | null;
  presets: CanvasPreset[];
}

export interface BrandContextType extends BrandState {
  updateBrandName: (name: string) => void;
  setLogoSrc: (src: string | null) => void;
  addCustomColor: (color: string) => void;
  selectColor: (color: string) => void;
  updateTitleFont: (font: Partial<FontConfig>) => void;
  updateBodyFont: (font: Partial<FontConfig>) => void;
  addElement: (element: Omit<CanvasElement, 'id' | 'zIndex'>) => void;
  updateElementPosition: (id: string, x: number, y: number) => void;
  updateElementContent: (id: string, updates: Partial<CanvasElement>) => void;
  selectElement: (id: string | null) => void;
  deleteElement: (id: string) => void;
}
