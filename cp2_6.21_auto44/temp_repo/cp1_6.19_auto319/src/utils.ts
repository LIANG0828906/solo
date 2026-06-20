import { v4 as uuidv4 } from 'uuid'
import type { Shape, Point } from './types'

export const generateId = (): string => uuidv4()

export const getDistance = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
}

export const getLinePath = (start: Point, end: Point): string => {
  return `M ${start.x} ${start.y} L ${end.x} ${end.y}`
}

export const getArrowPoints = (start: Point, end: Point, size: number = 10): string => {
  const angle = Math.atan2(end.y - start.y, end.x - start.x)
  const p1x = end.x - size * Math.cos(angle - Math.PI / 6)
  const p1y = end.y - size * Math.sin(angle - Math.PI / 6)
  const p2x = end.x - size * Math.cos(angle + Math.PI / 6)
  const p2y = end.y - size * Math.sin(angle + Math.PI / 6)
  return `${p1x},${p1y} ${end.x},${end.y} ${p2x},${p2y}`
}

export const isPointInRect = (point: Point, x: number, y: number, width: number, height: number): boolean => {
  return point.x >= x && point.x <= x + width && point.y >= y && point.y <= y + height
}

export const isPointInCircle = (point: Point, cx: number, cy: number, r: number): boolean => {
  return getDistance(point, { x: cx, y: cy }) <= r
}

export const isPointNearLine = (point: Point, start: Point, end: Point, threshold: number = 5): boolean => {
  const lineLength = getDistance(start, end)
  if (lineLength === 0) return getDistance(point, start) <= threshold
  const t = Math.max(0, Math.min(1, ((point.x - start.x) * (end.x - start.x) + (point.y - start.y) * (end.y - start.y)) / (lineLength * lineLength)))
  const projection = {
    x: start.x + t * (end.x - start.x),
    y: start.y + t * (end.y - start.y)
  }
  return getDistance(point, projection) <= threshold
}

export const isPointNearText = (point: Point, x: number, y: number, text: string, fontSize: number = 14): boolean => {
  const width = text.length * fontSize * 0.6
  const height = fontSize * 1.4
  return isPointInRect(point, x, y - height, width, height)
}

export const isPointInShape = (point: Point, shape: Shape): boolean => {
  switch (shape.type) {
    case 'rect':
      return isPointInRect(point, shape.x, shape.y, shape.width, shape.height)
    case 'circle':
      return isPointInCircle(point, shape.cx, shape.cy, shape.r)
    case 'line':
    case 'arrow':
      return isPointNearLine(point, shape.start, shape.end)
    case 'text':
      return isPointNearText(point, shape.x, shape.y, shape.text)
    default:
      return false
  }
}

export const normalizeRect = (start: Point, end: Point) => {
  const x = Math.min(start.x, end.x)
  const y = Math.min(start.y, end.y)
  const width = Math.abs(end.x - start.x)
  const height = Math.abs(end.y - start.y)
  return { x, y, width, height }
}
