export interface MindMapNode {
  id: string
  label: string
  x: number
  y: number
  color: string
  width?: number
  height?: number
}

export interface MindMapEdge {
  id: string
  source: string
  target: string
}

export interface MindMapState {
  nodes: MindMapNode[]
  edges: MindMapEdge[]
  selectedNodeId: string | null
  zoom: number
  panX: number
  panY: number
}

export const PRESET_COLORS = [
  '#E8F5E9',
  '#FFF3E0',
  '#E3F2FD',
  '#FCE4EC',
  '#F3E5F5',
  '#FFFDE7',
  '#E0F7FA',
  '#FFEBEE',
]

export const getRandomColor = (): string => {
  return PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]
}
