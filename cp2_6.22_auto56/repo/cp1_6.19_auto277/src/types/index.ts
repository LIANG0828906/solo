export interface Bubble {
  id: string
  x: number
  y: number
  size: number
  color: string
  text: string
}

export interface Connection {
  id: string
  fromBubbleId: string
  toBubbleId: string
  label: string
}

export interface CanvasState {
  scale: number
  offsetX: number
  offsetY: number
  focusedBubbleId: string | null
}

export interface CanvasExport {
  version: string
  bubbles: Bubble[]
  connections: Connection[]
  exportedAt: string
}

export interface Point {
  x: number
  y: number
}
