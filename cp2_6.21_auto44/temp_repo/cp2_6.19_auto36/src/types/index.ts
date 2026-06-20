export interface MindMapNode {
  id: string;
  title: string;
  x: number;
  y: number;
  parentId: string | null;
  children: string[];
  width: number;
  height: number;
}

export interface NoteImage {
  id: string;
  dataUrl: string;
  width: number;
  height: number;
}

export interface NoteData {
  nodeId: string;
  content: string;
  images: NoteImage[];
  updatedAt: number;
}

export interface Theme {
  id: string;
  name: string;
  background: string;
  gridColor: string;
  nodeFill: string;
  nodeText: string;
  nodeStroke: string;
  lineColor: string;
  glowColor: string;
  panelBg: string;
  panelText: string;
}

export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

export type NodeDragState = {
  isDragging: boolean;
  nodeId: string | null;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
};

export type CreateDragState = {
  isCreating: boolean;
  parentId: string | null;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
};

export const THEMES: Record<string, Theme> = {
  blue: {
    id: 'blue',
    name: '清爽蓝',
    background: '#F5F7FA',
    gridColor: '#E0E0E0',
    nodeFill: '#FFFFFF',
    nodeText: '#333333',
    nodeStroke: '#D0D0D0',
    lineColor: '#4A90D9',
    glowColor: 'rgba(74, 144, 217, 0.6)',
    panelBg: '#FFFFFF',
    panelText: '#333333',
  },
  orange: {
    id: 'orange',
    name: '暖阳橙',
    background: '#FFFAF5',
    gridColor: '#F0E6DC',
    nodeFill: '#FFFFFF',
    nodeText: '#333333',
    nodeStroke: '#E8D5C4',
    lineColor: '#FF8C42',
    glowColor: 'rgba(255, 140, 66, 0.6)',
    panelBg: '#FFFFFF',
    panelText: '#333333',
  },
  purple: {
    id: 'purple',
    name: '暗夜紫',
    background: '#1A1625',
    gridColor: '#2D2640',
    nodeFill: '#2D2640',
    nodeText: '#E8E6F0',
    nodeStroke: '#4A3F6B',
    lineColor: '#7B68EE',
    glowColor: 'rgba(123, 104, 238, 0.6)',
    panelBg: '#252038',
    panelText: '#E8E6F0',
  },
};
