import * as PIXI from 'pixi.js'
import { CellType, GRID_SIZE, CELL_SIZE, COLORS, ResourceType } from '../types'
import { ResourceField } from './resourceField'

export class GridManager {
  gridSize: number = GRID_SIZE
  grid: CellType[][] = []
  resourceFields: ResourceField[] = []
  obstacles: Set<string> = new Set()

  private gridGraphics: PIXI.Graphics
  private starsGraphics: PIXI.Graphics
  private resourceContainer: PIXI.Container
  private nextResourceId: number = 0

  constructor() {
    this.gridGraphics = new PIXI.Graphics()
    this.starsGraphics = new PIXI.Graphics()
    this.resourceContainer = new PIXI.Container()
    this.generate()
  }

  generate(): void {
    this.grid = []
    this.obstacles.clear()
    this.resourceFields = []
    this.nextResourceId = 0

    for (let y = 0; y < this.gridSize; y++) {
      this.grid[y] = []
      for (let x = 0; x < this.gridSize; x++) {
        this.grid[y][x] = CellType.EMPTY
      }
    }

    const obstacleCount = 150 + Math.floor(Math.random() * 100)
    for (let i = 0; i < obstacleCount; i++) {
      const ox = Math.floor(Math.random() * this.gridSize)
      const oy = Math.floor(Math.random() * this.gridSize)
      if (this.grid[oy][ox] === CellType.EMPTY) {
        this.grid[oy][ox] = CellType.OBSTACLE
        this.obstacles.add(`${ox},${oy}`)

        if (Math.random() < 0.4) {
          const dirs = [[1,0],[-1,0],[0,1],[0,-1]]
          const d = dirs[Math.floor(Math.random() * dirs.length)]
          const nx = ox + d[0] * (1 + Math.floor(Math.random() * 2))
          const ny = oy + d[1] * (1 + Math.floor(Math.random() * 2))
          if (nx >= 0 && nx < this.gridSize && ny >= 0 && ny < this.gridSize && this.grid[ny][nx] === CellType.EMPTY) {
            this.grid[ny][nx] = CellType.OBSTACLE
            this.obstacles.add(`${nx},${ny}`)
          }
        }
      }
    }

    const resourceCount = 40 + Math.floor(Math.random() * 10)
    const types = [ResourceType.IRON, ResourceType.CRYSTAL, ResourceType.GAS]
    for (let i = 0; i < resourceCount; i++) {
      const attempts = 50
      for (let a = 0; a < attempts; a++) {
        const rx = Math.floor(Math.random() * this.gridSize)
        const ry = Math.floor(Math.random() * this.gridSize)
        if (this.grid[ry][rx] === CellType.EMPTY) {
          const type = types[Math.floor(Math.random() * types.length)]
          const reserve = 200 + Math.random() * 800
          const efficiency = 0.5 + Math.random() * 0.5
          const field = new ResourceField(this.nextResourceId++, type, reserve, efficiency, rx, ry)
          this.resourceFields.push(field)
          this.grid[ry][rx] = CellType.RESOURCE
          this.resourceContainer.addChild(field.getDisplayObject())
          break
        }
      }
    }

    this.drawGrid()
    this.drawStars()
  }

  private drawGrid(): void {
    const g = this.gridGraphics
    g.clear()

    g.lineStyle(1, COLORS.GRID_LINE, 0.15)
    for (let i = 0; i <= this.gridSize; i++) {
      g.moveTo(i * CELL_SIZE, 0)
      g.lineTo(i * CELL_SIZE, this.gridSize * CELL_SIZE)
      g.moveTo(0, i * CELL_SIZE)
      g.lineTo(this.gridSize * CELL_SIZE, i * CELL_SIZE)
    }

    g.beginFill(0x1a0e2e, 0.6)
    for (const key of this.obstacles) {
      const [ox, oy] = key.split(',').map(Number)
      g.drawRect(ox * CELL_SIZE, oy * CELL_SIZE, CELL_SIZE, CELL_SIZE)
    }
    g.endFill()
  }

  private drawStars(): void {
    const g = this.starsGraphics
    g.clear()
    const count = 600
    for (let i = 0; i < count; i++) {
      const sx = Math.random() * this.gridSize * CELL_SIZE
      const sy = Math.random() * this.gridSize * CELL_SIZE
      const brightness = 0.3 + Math.random() * 0.7
      const size = 0.5 + Math.random() * 1.5
      g.beginFill(0xffffff, brightness)
      g.drawCircle(sx, sy, size)
      g.endFill()
    }
  }

  getCellType(x: number, y: number): CellType {
    if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize) return CellType.OBSTACLE
    return this.grid[y][x]
  }

  isWalkable(x: number, y: number): boolean {
    if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize) return false
    const cell = this.grid[y][x]
    return cell === CellType.EMPTY || cell === CellType.RESOURCE
  }

  getResourceAt(gridX: number, gridY: number): ResourceField | null {
    return this.resourceFields.find(r => r.gridX === gridX && r.gridY === gridY && !r.depleted) || null
  }

  getActiveResourceFields(): ResourceField[] {
    return this.resourceFields.filter(r => !r.depleted)
  }

  removeDepletedField(field: ResourceField): void {
    if (field.depleted) {
      this.grid[field.gridY][field.gridX] = CellType.EMPTY
    }
  }

  setCell(x: number, y: number, type: CellType): void {
    if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
      this.grid[y][x] = type
    }
  }

  update(dt: number): void {
    for (const field of this.resourceFields) {
      field.update(dt)
      if (field.depleted) {
        this.removeDepletedField(field)
      }
    }
  }

  getGridGraphics(): PIXI.Graphics { return this.gridGraphics }
  getStarsGraphics(): PIXI.Graphics { return this.starsGraphics }
  getResourceContainer(): PIXI.Container { return this.resourceContainer }
}
