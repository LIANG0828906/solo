export interface MindMapNode {
  id: string
  title: string
  x: number
  y: number
  parentId: string | null
  children: string[]
  width: number
  height: number
}

export interface Connection {
  id: string
  fromId: string
  toId: string
}

export interface ImageAnnotation {
  id: string
  src: string
  caption?: string
}

export interface NoteData {
  nodeId: string
  content: string
  images: ImageAnnotation[]
  updatedAt: number
}

export interface Theme {
  name: string
  background: string
  nodeFill: string
  nodeText: string
  lineColor: string
  gridColor: string
  glowColor: string
  panelBg: string
  panelText: string
}

export type ThemeName = 'blue' | 'orange' | 'purple'

export const THEMES: Record<ThemeName, Theme> = {
  blue: {
    name: '清爽蓝',
    background: '#F8FAFC',
    nodeFill: '#FFFFFF',
    nodeText: '#1E293B',
    lineColor: '#4A90D9',
    gridColor: '#E0E0E0',
    glowColor: '#4A90D9',
    panelBg: '#FFFFFF',
    panelText: '#1E293B',
  },
  orange: {
    name: '暖阳橙',
    background: '#FFF8F0',
    nodeFill: '#FFFFFF',
    nodeText: '#4A3728',
    lineColor: '#FF9F43',
    gridColor: '#F0E6D8',
    glowColor: '#FF9F43',
    panelBg: '#FFFFFF',
    panelText: '#4A3728',
  },
  purple: {
    name: '暗夜紫',
    background: '#1A1625',
    nodeFill: '#2D2640',
    nodeText: '#E8E4F0',
    lineColor: '#9B59B6',
    gridColor: '#3D3456',
    glowColor: '#9B59B6',
    panelBg: '#252035',
    panelText: '#E8E4F0',
  },
}
