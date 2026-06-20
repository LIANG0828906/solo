import type { Point, Bubble } from '@/types'

export function screenToCanvas(
  screenX: number,
  screenY: number,
  scale: number,
  offsetX: number,
  offsetY: number
): Point {
  return {
    x: (screenX - offsetX) / scale,
    y: (screenY - offsetY) / scale
  }
}

export function canvasToScreen(
  canvasX: number,
  canvasY: number,
  scale: number,
  offsetX: number,
  offsetY: number
): Point {
  return {
    x: canvasX * scale + offsetX,
    y: canvasY * scale + offsetY
  }
}

export function getBubbleEdgePoint(
  bubble: Bubble,
  targetX: number,
  targetY: number
): Point {
  const dx = targetX - bubble.x
  const dy = targetY - bubble.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  if (distance === 0) return { x: bubble.x, y: bubble.y }
  const radius = bubble.size / 2
  const ratio = radius / distance
  return {
    x: bubble.x + dx * ratio,
    y: bubble.y + dy * ratio
  }
}

export function getBezierControlPoints(
  start: Point,
  end: Point
): { cp1: Point; cp2: Point } {
  const dx = end.x - start.x
  const offset = Math.abs(dx) * 0.4 + 60
  return {
    cp1: { x: start.x + offset, y: start.y },
    cp2: { x: end.x - offset, y: end.y }
  }
}

export function getBezierPath(
  start: Point,
  end: Point
): string {
  const { cp1, cp2 } = getBezierControlPoints(start, end)
  return `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`
}

export function getPointOnBezier(
  start: Point,
  end: Point,
  t: number
): Point {
  const { cp1, cp2 } = getBezierControlPoints(start, end)
  const mt = 1 - t
  return {
    x: mt * mt * mt * start.x + 3 * mt * mt * t * cp1.x + 3 * mt * t * t * cp2.x + t * t * t * end.x,
    y: mt * mt * mt * start.y + 3 * mt * mt * t * cp1.y + 3 * mt * t * t * cp2.y + t * t * t * end.y
  }
}

export function getBezierAngle(
  start: Point,
  end: Point,
  t: number
): number {
  const { cp1, cp2 } = getBezierControlPoints(start, end)
  const mt = 1 - t
  const dx = 3 * mt * mt * (cp1.x - start.x) + 6 * mt * t * (cp2.x - cp1.x) + 3 * t * t * (end.x - cp2.x)
  const dy = 3 * mt * mt * (cp1.y - start.y) + 6 * mt * t * (cp2.y - cp1.y) + 3 * t * t * (end.y - cp2.y)
  return Math.atan2(dy, dx)
}

export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  return Math.sqrt(dx * dx + dy * dy)
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function generateId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}
