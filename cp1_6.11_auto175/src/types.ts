export type ElementType = 'text' | 'icon' | 'priceTag';

export type ChalkColor = '#FFFFFF' | '#FFE066' | '#FF9E9E' | '#66E0C0';

export type FontFamily = 'Caveat' | 'Patrick Hand' | 'Schoolbell' | 'sans-serif';

export type IconType = 'hotCoffee' | 'icedCoffee' | 'latte' | 'croissant' | 'mapleLeaf' | 'flower';

export type TagColor = '#FF6B6B' | '#4FD1C5' | '#F6AD55';

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  color: ChalkColor;
  fontFamily: FontFamily;
  fontSize: number;
}

export interface IconElement extends BaseElement {
  type: 'icon';
  iconType: IconType;
  color: string;
}

export interface PriceTagElement extends BaseElement {
  type: 'priceTag';
  price: number;
  bgColor: TagColor;
}

export type CanvasElement = TextElement | IconElement | PriceTagElement;

export type CanvasSize = 'A3-portrait' | 'A4-landscape' | 'custom';

export interface CanvasDimensions {
  width: number;
  height: number;
}

export interface DesignData {
  id: string;
  name: string;
  elements: CanvasElement[];
  canvasSize: CanvasSize;
  dimensions: CanvasDimensions;
  createdAt: string;
  updatedAt: string;
}
