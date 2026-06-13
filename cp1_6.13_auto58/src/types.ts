export type ComponentType = 'title' | 'paragraph' | 'image' | 'button' | 'form' | 'carousel';

export interface ComponentConfig {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  backgroundColor?: string;
  fontSize?: number;
  color?: string;
  images?: string[];
  borderRadius?: number;
  textAlign?: string;
}

export interface DragItem {
  type: string;
  componentType: ComponentType;
}

export interface DragMoveItem {
  type: string;
  id: string;
  startX: number;
  startY: number;
}

export interface ResizeItem {
  type: string;
  id: string;
  corner: string;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  startLeft: number;
  startTop: number;
}
