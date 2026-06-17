import { v4 as uuidv4 } from 'uuid'

export type SeatStatus = 'available' | 'sold' | 'reserved'

export interface Seat {
  id: string
  row: number
  col: number
  x: number
  y: number
  status: SeatStatus
  price: number
}

export interface Viewport {
  offsetX: number
  offsetY: number
  scale: number
}

export const SEAT_DIAMETER = 24
export const SEAT_SPACING = 8
export const GRID_SIZE = SEAT_DIAMETER + SEAT_SPACING
export const MIN_SCALE = 0.5
export const MAX_SCALE = 2.0

export function generateRectangularSeats(
  startRow: number,
  startCol: number,
  rows: number,
  cols: number,
  originX: number,
  originY: number,
  defaultPrice: number = 50
): Seat[] {
  const seats: Seat[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      seats.push({
        id: uuidv4(),
        row: startRow + r,
        col: startCol + c,
        x: originX + (startCol + c) * GRID_SIZE,
        y: originY + (startRow + r) * GRID_SIZE,
        status: 'available',
        price: defaultPrice,
      })
    }
  }
  return seats
}

export function generateFanSeats(
  centerRow: number,
  startCol: number,
  rows: number,
  cols: number,
  originX: number,
  originY: number,
  defaultPrice: number = 50
): Seat[] {
  const seats: Seat[] = []
  const centerX = originX + (cols / 2) * GRID_SIZE
  for (let r = 0; r < rows; r++) {
    const rowOffset = r - centerRow
    const radius = 200 + Math.abs(rowOffset) * 60
    const angleSpread = Math.min(0.8, cols * 0.08)
    for (let c = 0; c < cols; c++) {
      const colProgress = c / (cols - 1 || 1) - 0.5
      const angle = colProgress * angleSpread
      const x = centerX + Math.sin(angle) * radius - SEAT_DIAMETER / 2
      const y = originY + r * GRID_SIZE - Math.cos(angle) * radius + 200
      seats.push({
        id: uuidv4(),
        row: r,
        col: startCol + c,
        x,
        y,
        status: 'available',
        price: defaultPrice,
      })
    }
  }
  return seats
}

export function screenToWorld(
  screenX: number,
  screenY: number,
  viewport: Viewport
): { x: number; y: number } {
  return {
    x: (screenX - viewport.offsetX) / viewport.scale,
    y: (screenY - viewport.offsetY) / viewport.scale,
  }
}

export function worldToScreen(
  worldX: number,
  worldY: number,
  viewport: Viewport
): { x: number; y: number } {
  return {
    x: worldX * viewport.scale + viewport.offsetX,
    y: worldY * viewport.scale + viewport.offsetY,
  }
}

export function clampScale(scale: number): number {
  return Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale))
}

export function checkSeatCollision(
  x: number,
  y: number,
  existingSeats: Seat[],
  threshold: number = GRID_SIZE * 0.8
): Seat | null {
  for (const seat of existingSeats) {
    const dx = seat.x + SEAT_DIAMETER / 2 - (x + SEAT_DIAMETER / 2)
    const dy = seat.y + SEAT_DIAMETER / 2 - (y + SEAT_DIAMETER / 2)
    const distance = Math.sqrt(dx * dx + dy * dy)
    if (distance < threshold) {
      return seat
    }
  }
  return null
}

export function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE
}

export function getSeatLabel(seat: Seat): string {
  const rowLabel = String.fromCharCode(65 + seat.row)
  return `${rowLabel}${seat.col + 1}`
}

export function duplicateSeatsRow(
  seats: Seat[],
  sourceRow: number,
  targetRow: number
): Seat[] {
  return seats
    .filter((s) => s.row === sourceRow)
    .map((s) => ({
      ...s,
      id: uuidv4(),
      row: targetRow,
      y: s.y + (targetRow - sourceRow) * GRID_SIZE,
      status: 'available' as SeatStatus,
    }))
}
