import { GridCell, GRID_SIZE } from './Types'

interface Wall {
  x: number
  y: number
  direction: 'top' | 'right' | 'bottom' | 'left'
}

export class MazeGenerator {
  private grid: GridCell[][] = []

  generate(): GridCell[][] {
    this.grid = []
    for (let y = 0; y < GRID_SIZE; y++) {
      const row: GridCell[] = []
      for (let x = 0; x < GRID_SIZE; x++) {
        row.push({
          x,
          y,
          walls: { top: true, right: true, bottom: true, left: true },
          visited: false,
          isDeadEnd: false
        })
      }
      this.grid.push(row)
    }

    this.primAlgorithm()
    this.identifyDeadEnds()
    return this.grid
  }

  private primAlgorithm(): void {
    const walls: Wall[] = []
    const startX = Math.floor(Math.random() * GRID_SIZE)
    const startY = Math.floor(Math.random() * GRID_SIZE)

    this.grid[startY][startX].visited = true
    this.addWalls(startX, startY, walls)

    while (walls.length > 0) {
      const idx = Math.floor(Math.random() * walls.length)
      const wall = walls.splice(idx, 1)[0]

      const { nx, ny } = this.getNeighbor(wall.x, wall.y, wall.direction)
      if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) continue

      const current = this.grid[wall.y][wall.x]
      const neighbor = this.grid[ny][nx]

      if (!neighbor.visited) {
        this.removeWall(current, wall.direction)
        this.removeWall(neighbor, this.getOpposite(wall.direction))
        neighbor.visited = true
        this.addWalls(nx, ny, walls)
      }
    }
  }

  private addWalls(x: number, y: number, walls: Wall[]): void {
    if (y > 0) walls.push({ x, y, direction: 'top' })
    if (x < GRID_SIZE - 1) walls.push({ x, y, direction: 'right' })
    if (y < GRID_SIZE - 1) walls.push({ x, y, direction: 'bottom' })
    if (x > 0) walls.push({ x, y, direction: 'left' })
  }

  private getNeighbor(x: number, y: number, direction: string): { nx: number; ny: number } {
    switch (direction) {
      case 'top': return { nx: x, ny: y - 1 }
      case 'right': return { nx: x + 1, ny: y }
      case 'bottom': return { nx: x, ny: y + 1 }
      case 'left': return { nx: x - 1, ny: y }
      default: return { nx: x, ny: y }
    }
  }

  private getOpposite(direction: string): 'top' | 'right' | 'bottom' | 'left' {
    switch (direction) {
      case 'top': return 'bottom'
      case 'right': return 'left'
      case 'bottom': return 'top'
      case 'left': return 'right'
      default: return 'top'
    }
  }

  private removeWall(cell: GridCell, direction: string): void {
    switch (direction) {
      case 'top': cell.walls.top = false; break
      case 'right': cell.walls.right = false; break
      case 'bottom': cell.walls.bottom = false; break
      case 'left': cell.walls.left = false; break
    }
  }

  private identifyDeadEnds(): void {
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const cell = this.grid[y][x]
        let openCount = 0
        if (!cell.walls.top) openCount++
        if (!cell.walls.right) openCount++
        if (!cell.walls.bottom) openCount++
        if (!cell.walls.left) openCount++
        cell.isDeadEnd = openCount === 1
      }
    }
  }

  getCell(x: number, y: number): GridCell | null {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return null
    return this.grid[y][x]
  }

  getNeighbors(cell: GridCell): GridCell[] {
    const neighbors: GridCell[] = []
    const directions = [
      { dx: 0, dy: -1, wall: 'top' },
      { dx: 1, dy: 0, wall: 'right' },
      { dx: 0, dy: 1, wall: 'bottom' },
      { dx: -1, dy: 0, wall: 'left' }
    ]
    for (const dir of directions) {
      if (!cell.walls[dir.wall as keyof typeof cell.walls]) {
        const nx = cell.x + dir.dx
        const ny = cell.y + dir.dy
        const neighbor = this.getCell(nx, ny)
        if (neighbor) neighbors.push(neighbor)
      }
    }
    return neighbors
  }

  getDeadEnds(): GridCell[] {
    const deadEnds: GridCell[] = []
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (this.grid[y][x].isDeadEnd) {
          deadEnds.push(this.grid[y][x])
        }
      }
    }
    return deadEnds
  }
}
