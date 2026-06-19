import type { Board, Cell, EventType, Position } from '@/types'

export const BOARD_SIZE = 8

export function createBoard(size: number): Board {
  const cells: Cell[][] = []
  for (let y = 0; y < size; y++) {
    const row: Cell[] = []
    for (let x = 0; x < size; x++) {
      row.push({
        x,
        y,
        eventType: null,
        eventDuration: 0,
        tombstoneUnitId: null,
        tombstoneTurns: 0,
        tombstoneFaction: null,
      })
    }
    cells.push(row)
  }
  return { size, cells }
}

export function getCell(board: Board, x: number, y: number): Cell | null {
  if (x < 0 || x >= board.size || y < 0 || y >= board.size) {
    return null
  }
  return board.cells[y][x]
}

export function setCellEvent(
  board: Board,
  x: number,
  y: number,
  event: EventType,
  duration: number
): void {
  const cell = getCell(board, x, y)
  if (cell) {
    cell.eventType = event
    cell.eventDuration = duration
  }
}

export function clearCellEvent(board: Board, x: number, y: number): void {
  const cell = getCell(board, x, y)
  if (cell) {
    cell.eventType = null
    cell.eventDuration = 0
  }
}

export function setTombstone(
  board: Board,
  x: number,
  y: number,
  unitId: string,
  faction: 'light' | 'dark'
): void {
  const cell = getCell(board, x, y)
  if (cell) {
    cell.tombstoneUnitId = unitId
    cell.tombstoneTurns = 3
    cell.tombstoneFaction = faction
  }
}

export function decreaseTombstoneTurns(board: Board): void {
  for (let y = 0; y < board.size; y++) {
    for (let x = 0; x < board.size; x++) {
      const cell = board.cells[y][x]
      if (cell.tombstoneUnitId && cell.tombstoneTurns > 0) {
        cell.tombstoneTurns--
        if (cell.tombstoneTurns <= 0) {
          cell.tombstoneUnitId = null
          cell.tombstoneFaction = null
        }
      }
    }
  }
}

export function decreaseEventDurations(board: Board): void {
  for (let y = 0; y < board.size; y++) {
    for (let x = 0; x < board.size; x++) {
      const cell = board.cells[y][x]
      if (cell.eventDuration > 0) {
        cell.eventDuration--
        if (cell.eventDuration <= 0) {
          cell.eventType = null
        }
      }
    }
  }
}

export function coordToIndex(x: number, y: number, size: number): number {
  return y * size + x
}

export function indexToCoord(index: number, size: number): Position {
  return {
    x: index % size,
    y: Math.floor(index / size),
  }
}

export function getDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2)
}

export function getPositionsInRange(
  centerX: number,
  centerY: number,
  range: number,
  boardSize: number
): Position[] {
  const positions: Position[] = []
  for (let y = 0; y < boardSize; y++) {
    for (let x = 0; x < boardSize; x++) {
      if (getDistance(centerX, centerY, x, y) <= range && getDistance(centerX, centerY, x, y) > 0) {
        positions.push({ x, y })
      }
    }
  }
  return positions
}

export function isPositionInList(positions: Position[], x: number, y: number): boolean {
  return positions.some(p => p.x === x && p.y === y)
}
