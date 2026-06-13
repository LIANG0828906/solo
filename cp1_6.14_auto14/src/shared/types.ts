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

export interface Project {
  id: string;
  name: string;
  thumbnail?: string;
  elements: CanvasElement[];
  colorPalette: ColorSwatch[];
  createdAt: number;
  updatedAt: number;
}

export type ToolType = 'select' | 'text' | 'draw' | 'eraser';
