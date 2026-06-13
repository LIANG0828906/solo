export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface ImageElement {
  id: string;
  type: 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  src: string;
  name: string;
  note?: string;
}

export interface TextElement {
  id: string;
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  name: string;
  note?: string;
}

export interface DrawingElement {
  id: string;
  type: 'drawing';
  x: number;
  y: number;
  width: number;
  height: number;
  dataUrl: string;
  name: string;
  note?: string;
}

export type CanvasElement = ImageElement | TextElement | DrawingElement;

export interface ColorSwatch {
  hex: string;
  rgb: { r: number; g: number; b: number };
  count: number;
}

export interface Materials {
  images: {
    id: string;
    src: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    name: string;
    note?: string;
  }[];
  texts: {
    id: string;
    x: number;
    y: number;
    text: string;
    fontSize: number;
    fontFamily: string;
    color: string;
    name: string;
    note?: string;
  }[];
  drawings: {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    dataUrl: string;
    paths: { x: number; y: number }[];
    color: string;
    size: number;
    name: string;
    note?: string;
  }[];
}

export interface Project {
  id: string;
  name: string;
  thumbnail?: string;
  elements: CanvasElement[];
  materials: Materials;
  colorPalette: ColorSwatch[];
  createdAt: number;
  updatedAt: number;
}

export type ToolType = 'select' | 'text' | 'draw' | 'eraser';
