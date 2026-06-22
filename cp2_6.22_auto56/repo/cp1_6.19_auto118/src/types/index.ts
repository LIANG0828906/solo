export interface MindMapNode {
  id: string
  content: string
  x: number
  y: number
  color: string
  createdAt: Date
  groupId?: string
}

export interface Connection {
  id: string
  from: string
  to: string
  label: string
  color: string
}

export interface NodeGroup {
  id: string
  nodeIds: string[]
  label: string
  bounds: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface TimeRange {
  start: Date
  end: Date
}

export const COLOR_PALETTE: string[] = [
  '#FFB5BA',
  '#FFD6A5',
  '#FDFFB6',
  '#CAFFBF',
  '#9BF6FF',
  '#A0C4FF',
  '#BDB2FF',
  '#FFC6FF',
  '#FFADAD',
  '#FFC6A5',
  '#F1FFC4',
  '#B8E0D2',
  '#95D5E3',
  '#B0C4DE',
  '#C7B8EA',
  '#F4C2C2'
]

export const NODE_WIDTH = 160
export const NODE_HEIGHT = 80
export const GRID_SIZE = 30
export const GROUP_THRESHOLD_X = 80
export const GROUP_THRESHOLD_Y = 80
