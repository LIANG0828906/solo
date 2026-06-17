import { v4 as uuidv4 } from 'uuid'
import type { StarPoint } from './starMapEngine'
import { findNearestStar } from './starMapEngine'

export interface Node {
  id: string
  x: number
  y: number
  starId?: string
  isManual: boolean
}

export interface Edge {
  id: string
  fromNodeId: string
  toNodeId: string
}

export interface Constellation {
  id: string
  name: string
  themeColor: string
  nodes: Node[]
  edges: Edge[]
  createdAt: number
}

export interface DrawingState {
  isDrawing: boolean
  isDragging: boolean
  currentPath: Array<{ x: number; y: number; timestamp: number }>
  tempNodes: Node[]
  hoveredStarId: string | null
}

export const THEME_COLORS = ['#FFD700', '#7EC8E3', '#FF6B6B', '#A8E6CF'] as const

let constellationCounter = 0

export function generateConstellationName(): string {
  constellationCounter++
  const padded = constellationCounter.toString().padStart(2, '0')
  return `无名座${padded}`
}

export function getThemeColor(index: number): string {
  return THEME_COLORS[index % THEME_COLORS.length]
}

export function createNode(x: number, y: number, isManual: boolean = false, starId?: string): Node {
  return {
    id: uuidv4(),
    x,
    y,
    starId,
    isManual,
  }
}

export function createEdge(fromNodeId: string, toNodeId: string): Edge {
  return {
    id: uuidv4(),
    fromNodeId,
    toNodeId,
  }
}

export function optimizePath(nodes: Node[]): Node[] {
  if (nodes.length < 3) return nodes
  const result: Node[] = [nodes[0]]
  for (let i = 1; i < nodes.length - 1; i++) {
    const prev = result[result.length - 1]
    const curr = nodes[i]
    const next = nodes[i + 1]
    const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x)
    const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x)
    const angleDiff = Math.abs(((angle2 - angle1 + Math.PI * 3) % (Math.PI * 2)) - Math.PI)
    if (angleDiff > 0.15) {
      result.push(curr)
    }
  }
  result.push(nodes[nodes.length - 1])
  return result
}

export function detectCollisions(
  point: { x: number; y: number },
  nodes: Node[],
  threshold: number = 12
): Node | null {
  for (const node of nodes) {
    const dx = node.x - point.x
    const dy = node.y - point.y
    if (Math.sqrt(dx * dx + dy * dy) < threshold) {
      return node
    }
  }
  return null
}

export function snapToStar(
  x: number,
  y: number,
  stars: StarPoint[]
): { x: number; y: number; starId?: string } {
  const nearest = findNearestStar(stars, x, y, 35)
  if (nearest) {
    return { x: nearest.x, y: nearest.y, starId: nearest.id }
  }
  return { x, y }
}

export function buildEdgesFromNodes(nodes: Node[]): Edge[] {
  const edges: Edge[] = []
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push(createEdge(nodes[i].id, nodes[i + 1].id))
  }
  return edges
}

export function createConstellation(
  nodes: Node[],
  themeColorIndex?: number
): Constellation | null {
  const optimizedNodes = optimizePath(nodes)
  if (optimizedNodes.length < 2) return null

  const edges = buildEdgesFromNodes(optimizedNodes)
  return {
    id: uuidv4(),
    name: generateConstellationName(),
    themeColor: getThemeColor(themeColorIndex ?? constellationCounter - 1),
    nodes: optimizedNodes,
    edges,
    createdAt: Date.now(),
  }
}

export function createInitialDrawingState(): DrawingState {
  return {
    isDrawing: false,
    isDragging: false,
    currentPath: [],
    tempNodes: [],
    hoveredStarId: null,
  }
}

export function getTrailPoints(
  path: Array<{ x: number; y: number; timestamp: number }>,
  trailLengthPx: number = 30
): Array<{ x: number; y: number; alpha: number }> {
  if (path.length < 2) return []

  const result: Array<{ x: number; y: number; alpha: number }> = []
  let accumulatedDist = 0

  for (let i = path.length - 1; i >= 1 && accumulatedDist < trailLengthPx; i--) {
    const curr = path[i]
    const prev = path[i - 1]
    const dx = curr.x - prev.x
    const dy = curr.y - prev.y
    const segLen = Math.sqrt(dx * dx + dy * dy)

    const steps = Math.max(1, Math.ceil(segLen / 2))
    for (let s = 0; s <= steps && accumulatedDist < trailLengthPx; s++) {
      const t = s / steps
      const x = prev.x + dx * t
      const y = prev.y + dy * t
      const progress = accumulatedDist / trailLengthPx
      const alpha = Math.max(0, 0.8 * (1 - progress))
      result.unshift({ x, y, alpha })
      accumulatedDist += segLen / steps
    }
  }

  return result
}

export function resetCounter(): void {
  constellationCounter = 0
}

export function setCounter(value: number): void {
  constellationCounter = value
}
