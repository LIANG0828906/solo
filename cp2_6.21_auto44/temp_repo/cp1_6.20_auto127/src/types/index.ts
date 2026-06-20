export type ElementType = 'image' | 'text' | 'button' | 'divider';

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src?: string;
  alt?: string;
  backgroundColor?: string;
  borderRadius?: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  fontWeight: number;
  textAlign: 'left' | 'center' | 'right';
  lineHeight: number;
}

export interface ButtonElement extends BaseElement {
  type: 'button';
  text: string;
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
}

export interface DividerElement extends BaseElement {
  type: 'divider';
  color: string;
  thickness: number;
  style: 'solid' | 'dashed' | 'dotted';
}

export type CanvasElement = ImageElement | TextElement | ButtonElement | DividerElement;

export interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  canvasWidth: number;
  canvasHeight: number;
  elements: CanvasElement[];
}

export interface Version {
  id: string;
  name: string;
  createdAt: string;
  thumbnail?: string;
  elements: CanvasElement[];
  canvasWidth: number;
  canvasHeight: number;
}

export interface Project {
  id: string;
  name: string;
  currentVersionId: string;
  versions: Version[];
  createdAt: string;
  updatedAt: string;
}

export type AppView = 'templates' | 'editor' | 'compare';

export interface GuideLines {
  vertical: number[];
  horizontal: number[];
}
