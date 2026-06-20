export const TILE_SIZE = 40

export const GRID_COLS = 20
export const GRID_ROWS = 14

export const INITIAL_LIVES = 20
export const ENEMY_DAMAGE = 2
export const WAVE_INTERVAL_MS = 15000
export const ENEMIES_PER_WAVE_MIN = 5
export const ENEMIES_PER_WAVE_MAX = 10

export type GridPoint = { col: number; row: number }

export const pathPoints: GridPoint[] = [
  { col: 0, row: 2 },
  { col: 4, row: 2 },
  { col: 4, row: 6 },
  { col: 8, row: 6 },
  { col: 8, row: 2 },
  { col: 12, row: 2 },
  { col: 12, row: 10 },
  { col: 6, row: 10 },
  { col: 6, row: 12 },
  { col: 16, row: 12 },
  { col: 16, row: 6 },
  { col: 19, row: 6 },
]

export function gridToPixel(col: number, row: number): { x: number; y: number } {
  return {
    x: col * TILE_SIZE + TILE_SIZE / 2,
    y: row * TILE_SIZE + TILE_SIZE / 2,
  }
}

export function pixelToGrid(x: number, y: number): GridPoint {
  return {
    col: Math.floor(x / TILE_SIZE),
    row: Math.floor(y / TILE_SIZE),
  }
}

export function getPathPixelPoints(): { x: number; y: number }[] {
  return pathPoints.map((p) => gridToPixel(p.col, p.row))
}

export function getPathTiles(): Set<string> {
  const tiles = new Set<string>()
  for (let i = 0; i < pathPoints.length - 1; i++) {
    const start = pathPoints[i]
    const end = pathPoints[i + 1]
    if (start.col === end.col) {
      const minRow = Math.min(start.row, end.row)
      const maxRow = Math.max(start.row, end.row)
      for (let r = minRow; r <= maxRow; r++) {
        tiles.add(`${start.col},${r}`)
      }
    } else {
      const minCol = Math.min(start.col, end.col)
      const maxCol = Math.max(start.col, end.col)
      for (let c = minCol; c <= maxCol; c++) {
        tiles.add(`${c},${start.row}`)
      }
    }
  }
  return tiles
}

export function isBuildable(col: number, row: number): boolean {
  if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return false
  const pathTiles = getPathTiles()
  return !pathTiles.has(`${col},${row}`)
}
