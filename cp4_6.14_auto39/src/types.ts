export type ComponentType = 'rectangle' | 'circle' | 'text' | 'image';

export interface ComponentStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  color?: string;
  fontSize?: number;
  fontWeight?: number;
  src?: string;
  opacity?: number;
}

export interface CanvasComponent {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  style: ComponentStyle;
  content: string;
  zIndex: number;
  name?: string;
}

export interface Connection {
  id: string;
  fromComponentId: string;
  toComponentId: string;
  label: string;
}

export interface Project {
  id: string;
  name: string;
  components: CanvasComponent[];
  connections: Connection[];
  createdAt: number;
  updatedAt: number;
}

export interface HistoryState {
  components: CanvasComponent[];
  connections: Connection[];
}

export type HandlePosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'rotate';

export interface DragState {
  type: 'move' | 'resize' | 'rotate' | 'connect' | 'pan';
  startX: number;
  startY: number;
  componentId?: string;
  handle?: HandlePosition;
  originalX?: number;
  originalY?: number;
  originalWidth?: number;
  originalHeight?: number;
  originalRotation?: number;
  fromComponentId?: string;
  tempEndX?: number;
  tempEndY?: number;
}

export const DEFAULT_STYLES: Record<ComponentType, ComponentStyle> = {
  rectangle: {
    backgroundColor: '#ffffff',
    borderColor: '#1f2937',
    borderWidth: 1,
    borderRadius: 4
  },
  circle: {
    backgroundColor: '#ffffff',
    borderColor: '#1f2937',
    borderWidth: 1,
    borderRadius: 9999
  },
  text: {
    color: '#1f2937',
    fontSize: 14,
    fontWeight: 400,
    backgroundColor: 'transparent'
  },
  image: {
    backgroundColor: '#e5e7eb',
    borderRadius: 4
  }
};

export const DEFAULT_SIZES: Record<ComponentType, { width: number; height: number }> = {
  rectangle: { width: 120, height: 80 },
  circle: { width: 80, height: 80 },
  text: { width: 120, height: 32 },
  image: { width: 120, height: 90 }
};
