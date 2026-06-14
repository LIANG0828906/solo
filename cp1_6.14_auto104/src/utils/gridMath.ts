import type { Direction } from '@/core/types'
import { GRID_SIZE } from '@/config/gameConfig'

export const DIRECTION_VECTORS: Record<Direction, [number, number]> = {
  0: [0, -1],
  1: [1, 0],
  2: [0, 1],
  3: [-1, 0]
}

export function turnDirection(dir: Direction, delta: -1 | 1): Direction {
  return (((dir + delta) % 4) + 4) % 4 as Direction
}

export function getFacingCell(x: number, y: number, direction: Direction): [number, number] {
  const [dx, dy] = DIRECTION_VECTORS[direction]
  return [x + dx, y + dy]
}

export function getBackwardCell(x: number, y: number, direction: Direction): [number, number] {
  const [dx, dy] = DIRECTION_VECTORS[direction]
  return [x - dx, y - dy]
}

export function isInBounds(x: number, y: number): boolean {
  return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE
}

export function manhattanDistance(ax: number, ay: number, bx: number, by: number): number {
  return Math.abs(ax - bx) + Math.abs(ay - by)
}

export function chebyshevDistance(ax: number, ay: number, bx: number, by: number): number {
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by))
}

export function directionTo(from: Direction, to: Direction): 'left' | 'right' | 'same' | 'opposite' {
  const diff = (((to - from) % 4) + 4) % 4
  if (diff === 0) return 'same'
  if (diff === 2) return 'opposite'
  if (diff === 1) return 'right'
  return 'left'
}

export function cellsInFront(
  x: number,
  y: number,
  direction: Direction,
  range: number
): Array<[number, number]> {
  const cells: Array<[number, number]> = []
  const [dx, dy] = DIRECTION_VECTORS[direction]
  for (let i = 1; i <= range; i++) {
    const nx = x + dx * i
    const ny = y + dy * i
    if (!isInBounds(nx, ny)) break
    cells.push([nx, ny])
  }
  return cells
}

export function cellsInViewRange(
  x: number,
  y: number,
  viewRange: number
): Array<[number, number]> {
  const cells: Array<[number, number]> = []
  for (let dy = -viewRange; dy <= viewRange; dy++) {
    for (let dx = -viewRange; dx <= viewRange; dx++) {
      if (dx === 0 && dy === 0) continue
      if (chebyshevDistance(0, 0, dx, dy) > viewRange) continue
      const nx = x + dx
      const ny = y + dy
      if (isInBounds(nx, ny)) cells.push([nx, ny])
    }
  }
  return cells
}

export function directionToDegrees(dir: Direction): number {
  return dir * 90
}
