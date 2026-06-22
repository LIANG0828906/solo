export type Tool = 'select' | 'pen' | 'rectangle' | 'ellipse' | 'text' | 'eraser';

export type ThemeName = 'light' | 'dark';

export interface Theme {
  name: ThemeName;
  backgroundColor: string;
  gridColor: string;
  gridOpacity: number;
  textColor: string;
  panelBg: string;
  toolbarBg: string;
}

export interface Point {
  x: number;
  y: number;
}

export type ElementType = 'shape' | 'path' | 'text' | 'image';

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

export type ShapeType = 'rectangle' | 'ellipse';

export interface ShapeElement extends BaseElement {
  type: 'shape';
  shapeType: ShapeType;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
}

export interface PathElement extends BaseElement {
  type: 'path';
  points: Point[];
  strokeColor: string;
  strokeWidth: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  alt?: string;
}

export type BoardElement = ShapeElement | PathElement | TextElement | ImageElement;

export interface Board {
  id: string;
  name: string;
  elements: BoardElement[];
  zoom: number;
  offset: Point;
  maxZIndex: number;
}

export type HandleType =
  | 'nw' | 'n' | 'ne'
  | 'e' | 'se' | 's'
  | 'sw' | 'w' | 'rotate'
  | null;

export interface InteractionState {
  isDragging: boolean;
  isDrawing: boolean;
  isResizing: boolean;
  isRotating: boolean;
  isPanning: boolean;
  activeHandle: HandleType;
  startPoint: Point | null;
  lastPoint: Point | null;
  startElement: BoardElement | null;
}

export interface AssetItem {
  id: string;
  name: string;
  category: string;
  svg: string;
  thumbnail: string;
}
