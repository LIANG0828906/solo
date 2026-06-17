import { CellType, Position } from '../stores/gameStore'

export function generateMaze(size: number): CellType[][] {
  if (size % 2 === 0) size = size + 1

  const maze: CellType[][] = []
  for (let y = 0; y < size; y++) {
    maze[y] = []
    for (let x = 0; x < size; x++) {
      maze[y][x] = CellType.WALL
    }
  }

  const visited: boolean[][] = []
  for (let y = 0; y < size; y++) {
    visited[y] = []
    for (let x = 0; x < size; x++) {
      visited[y][x] = false
    }
  }

  function carve(x: number, y: number) {
    visited[y][x] = true
    maze[y][x] = CellType.PATH

    const directions = [
      { dx: 0, dy: -2 },
      { dx: 2, dy: 0 },
      { dx: 0, dy: 2 },
      { dx: -2, dy: 0 },
    ]
    shuffle(directions)

    for (const dir of directions) {
      const nx = x + dir.dx
      const ny = y + dir.dy

      if (
        nx > 0 &&
        nx < size - 1 &&
        ny > 0 &&
        ny < size - 1 &&
        !visited[ny][nx]
      ) {
        const wx = x + dir.dx / 2
        const wy = y + dir.dy / 2
        maze[wy][wx] = CellType.PATH
        carve(nx, ny)
      }
    }
  }

  carve(1, 1)

  const extraOpenings = Math.floor((size * size) / 40)
  for (let i = 0; i < extraOpenings; i++) {
    const x = 1 + Math.floor(Math.random() * (size - 2))
    const y = 1 + Math.floor(Math.random() * (size - 2))
    if (maze[y][x] === CellType.WALL) {
      let neighbors = 0
      if (y > 0 && maze[y - 1][x] !== CellType.WALL) neighbors++
      if (y < size - 1 && maze[y + 1][x] !== CellType.WALL) neighbors++
      if (x > 0 && maze[y][x - 1] !== CellType.WALL) neighbors++
      if (x < size - 1 && maze[y][x + 1] !== CellType.WALL) neighbors++
      if (neighbors >= 2) {
        maze[y][x] = CellType.PATH
      }
    }
  }

  if (maze[size - 2][size - 2] === CellType.WALL) {
    maze[size - 2][size - 2] = CellType.PATH
    if (maze[size - 3][size - 2] === CellType.WALL && maze[size - 2][size - 3] === CellType.WALL) {
      maze[size - 3][size - 2] = CellType.PATH
    }
  }

  return maze
}

export function placeDotsAndCount(maze: CellType[][]): { maze: CellType[][]; count: number } {
  const size = maze.length
  const newMaze: CellType[][] = []
  let count = 0

  for (let y = 0; y < size; y++) {
    newMaze[y] = []
    for (let x = 0; x < size; x++) {
      if (maze[y][x] === CellType.PATH) {
        newMaze[y][x] = CellType.DOT
        count++
      } else {
        newMaze[y][x] = maze[y][x]
      }
    }
  }

  return { maze: newMaze, count }
}

export function findRandomPathCells(maze: CellType[][], count: number): Position[] {
  const size = maze.length
  const pathCells: Position[] = []

  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      if (maze[y][x] !== CellType.WALL) {
        pathCells.push({ x, y })
      }
    }
  }

  shuffle(pathCells)

  const selected: Position[] = []
  const usedKeys = new Set<string>()
  for (const cell of pathCells) {
    const key = `${cell.x},${cell.y}`
    if (usedKeys.has(key)) continue
    let tooClose = false
    for (const s of selected) {
      const dist = Math.abs(s.x - cell.x) + Math.abs(s.y - cell.y)
      if (dist < 3) {
        tooClose = true
        break
      }
    }
    if (!tooClose) {
      selected.push(cell)
      usedKeys.add(key)
      if (selected.length >= count) break
    }
  }

  while (selected.length < count && pathCells.length > 0) {
    const idx = Math.floor(Math.random() * pathCells.length)
    const cell = pathCells[idx]
    const key = `${cell.x},${cell.y}`
    if (!usedKeys.has(key)) {
      selected.push(cell)
      usedKeys.add(key)
    }
    pathCells.splice(idx, 1)
  }

  return selected
}

export function isPathCell(maze: CellType[][], x: number, y: number): boolean {
  const size = maze.length
  if (x < 0 || x >= size || y < 0 || y >= size) return false
  return maze[y][x] !== CellType.WALL
}

export function findNewPelletPosition(maze: CellType[][], avoidPositions: Position[]): Position | null {
  const size = maze.length
  const candidates: Position[] = []

  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const cell = maze[y][x]
      if (cell === CellType.DOT || cell === CellType.PATH) {
        let avoid = false
        for (const ap of avoidPositions) {
          if (ap.x === x && ap.y === y) {
            avoid = true
            break
          }
        }
        if (!avoid) candidates.push({ x, y })
      }
    }
  }

  if (candidates.length === 0) return null
  shuffle(candidates)
  return candidates[0]
}

function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
  return array
}
