import type { CellValue, GameObject, TerrainTheme, PlayerState } from '../types'

const THEME_COLORS: Record<TerrainTheme, { fill: string; border: string; top: string }> = {
  grass: { fill: '#4a7c23', border: '#2d4d15', top: '#5a9c33' },
  stone: { fill: '#6b6b6b', border: '#3a3a3a', top: '#8a8a8a' },
  dirt: { fill: '#8b5a2b', border: '#5a3a1a', top: '#a06a3a' },
}

export class GridRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private cellSize: number = 48
  private gridCols: number = 12
  private gridRows: number = 8
  private offsetX: number = 0
  private offsetY: number = 0

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Cannot get 2d context')
    this.ctx = ctx
  }

  setGridSize(cols: number, rows: number) {
    this.gridCols = cols
    this.gridRows = rows
  }

  setCellSize(size: number) {
    this.cellSize = size
  }

  resize(width: number, height: number) {
    this.canvas.width = width
    this.canvas.height = height
    this.recalculateOffset()
  }

  recalculateOffset() {
    const gridWidth = this.gridCols * this.cellSize
    const gridHeight = this.gridRows * this.cellSize
    this.offsetX = (this.canvas.width - gridWidth) / 2
    this.offsetY = (this.canvas.height - gridHeight) / 2
  }

  getCellSize(): number {
    return this.cellSize
  }

  getOffsetX(): number {
    return this.offsetX
  }

  getOffsetY(): number {
    return this.offsetY
  }

  screenToGrid(screenX: number, screenY: number): { col: number; row: number } | null {
    const gridX = screenX - this.offsetX
    const gridY = screenY - this.offsetY

    if (gridX < 0 || gridY < 0 || gridX >= this.gridCols * this.cellSize || gridY >= this.gridRows * this.cellSize) {
      return null
    }

    return {
      col: Math.floor(gridX / this.cellSize),
      row: Math.floor(gridY / this.cellSize),
    }
  }

  gridToScreen(col: number, row: number): { x: number; y: number } {
    return {
      x: this.offsetX + col * this.cellSize,
      y: this.offsetY + row * this.cellSize,
    }
  }

  drawFrame(
    grid: CellValue[][],
    objects: GameObject[],
    terrainTheme: TerrainTheme,
    selectedObjectId: string | null,
    selectedTool: string | null,
    hoverCell: { col: number; row: number } | null,
    isPlaying: boolean,
    playerState: PlayerState | null,
    collectedCoins: string[],
    physicsEngine: any
  ) {
    this.ctx.fillStyle = '#1a1a1a'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    this.drawGridBackground()
    this.drawTerrain(grid, terrainTheme)
    this.drawObjects(objects, selectedObjectId, isPlaying, collectedCoins, physicsEngine)

    if (!isPlaying && hoverCell && selectedTool) {
      this.drawToolPreview(hoverCell.col, hoverCell.row, selectedTool)
    }

    if (!isPlaying && selectedObjectId) {
      this.drawSelectedObjectHighlight(objects, selectedObjectId)
    }

    if (isPlaying && playerState) {
      this.drawPlayer(playerState)
    }

    this.drawGridLines()
  }

  private drawGridBackground() {
    const gridWidth = this.gridCols * this.cellSize
    const gridHeight = this.gridRows * this.cellSize
    this.ctx.fillStyle = '#1e1e1e'
    this.ctx.fillRect(this.offsetX, this.offsetY, gridWidth, gridHeight)
  }

  private drawTerrain(grid: CellValue[][], theme: TerrainTheme) {
    const colors = THEME_COLORS[theme]

    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridCols; col++) {
        if (grid[row] && grid[row][col] === 1) {
          const x = this.offsetX + col * this.cellSize
          const y = this.offsetY + row * this.cellSize

          const hasTop = row > 0 && grid[row - 1] && grid[row - 1][col] === 1

          this.ctx.fillStyle = colors.fill
          this.ctx.fillRect(x, y, this.cellSize, this.cellSize)

          if (!hasTop) {
            this.ctx.fillStyle = colors.top
            this.ctx.fillRect(x, y, this.cellSize, this.cellSize * 0.25)
          }

          this.ctx.strokeStyle = colors.border
          this.ctx.lineWidth = 1
          this.ctx.strokeRect(x + 0.5, y + 0.5, this.cellSize - 1, this.cellSize - 1)
        }
      }
    }
  }

  private drawObjects(
    objects: GameObject[],
    selectedId: string | null,
    isPlaying: boolean,
    collectedCoins: string[],
    physicsEngine: any
  ) {
    for (const obj of objects) {
      if (obj.type === 'coin' && collectedCoins.includes(obj.id)) continue

      let screenX = this.offsetX + obj.gridX * this.cellSize
      let screenY = this.offsetY + obj.gridY * this.cellSize

      if (obj.type === 'movingPlatform' && isPlaying && physicsEngine) {
        const platX = physicsEngine.getMovingPlatformPosition(obj.id)
        screenX = this.offsetX + platX * this.cellSize
      }

      this.drawObject(obj.type, screenX, screenY, obj.id === selectedId && !isPlaying)
    }
  }

  private drawObject(type: string, x: number, y: number, selected: boolean) {
    const size = this.cellSize
    const cx = x + size / 2
    const cy = y + size / 2

    this.ctx.save()

    if (selected) {
      this.ctx.shadowColor = '#00ffff'
      this.ctx.shadowBlur = 8
    }

    switch (type) {
      case 'player':
        this.ctx.fillStyle = '#4fc3f7'
        this.ctx.strokeStyle = '#0288d1'
        this.ctx.lineWidth = 2
        this.ctx.beginPath()
        this.ctx.arc(cx, cy, size * 0.35, 0, Math.PI * 2)
        this.ctx.fill()
        this.ctx.stroke()

        this.ctx.fillStyle = '#fff'
        this.ctx.beginPath()
        this.ctx.arc(cx - size * 0.12, cy - size * 0.05, size * 0.08, 0, Math.PI * 2)
        this.ctx.arc(cx + size * 0.12, cy - size * 0.05, size * 0.08, 0, Math.PI * 2)
        this.ctx.fill()
        break

      case 'spike':
        this.ctx.fillStyle = '#e53935'
        this.ctx.strokeStyle = '#b71c1c'
        this.ctx.lineWidth = 2
        this.ctx.beginPath()
        this.ctx.moveTo(x + size * 0.1, y + size * 0.9)
        this.ctx.lineTo(cx, y + size * 0.15)
        this.ctx.lineTo(x + size * 0.9, y + size * 0.9)
        this.ctx.closePath()
        this.ctx.fill()
        this.ctx.stroke()
        break

      case 'movingPlatform':
        const platH = size / 4
        this.ctx.fillStyle = '#ff9800'
        this.ctx.strokeStyle = '#e65100'
        this.ctx.lineWidth = 2
        this.ctx.fillRect(x, y + size * 0.35, size, platH)
        this.ctx.strokeRect(x, y + size * 0.35, size, platH)

        this.ctx.fillStyle = '#fff'
        this.ctx.beginPath()
        this.ctx.moveTo(x + size * 0.2, y + size * 0.47)
        this.ctx.lineTo(x + size * 0.35, y + size * 0.4)
        this.ctx.lineTo(x + size * 0.35, y + size * 0.55)
        this.ctx.closePath()
        this.ctx.fill()

        this.ctx.beginPath()
        this.ctx.moveTo(x + size * 0.8, y + size * 0.47)
        this.ctx.lineTo(x + size * 0.65, y + size * 0.4)
        this.ctx.lineTo(x + size * 0.65, y + size * 0.55)
        this.ctx.closePath()
        this.ctx.fill()
        break

      case 'coin':
        this.ctx.fillStyle = '#ffd700'
        this.ctx.strokeStyle = '#ff8f00'
        this.ctx.lineWidth = 2
        this.ctx.beginPath()
        this.ctx.arc(cx, cy, size * 0.3, 0, Math.PI * 2)
        this.ctx.fill()
        this.ctx.stroke()

        this.ctx.fillStyle = '#fff8e1'
        this.ctx.beginPath()
        this.ctx.arc(cx - size * 0.08, cy - size * 0.08, size * 0.08, 0, Math.PI * 2)
        this.ctx.fill()
        break
    }

    this.ctx.restore()
  }

  private drawToolPreview(col: number, row: number, toolType: string) {
    const x = this.offsetX + col * this.cellSize
    const y = this.offsetY + row * this.cellSize

    this.ctx.save()
    this.ctx.globalAlpha = 0.5
    this.drawObject(toolType, x, y, false)
    this.ctx.restore()

    this.ctx.strokeStyle = '#00ff00'
    this.ctx.lineWidth = 2
    this.ctx.setLineDash([4, 4])
    this.ctx.strokeRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2)
    this.ctx.setLineDash([])
  }

  private drawSelectedObjectHighlight(objects: GameObject[], selectedId: string) {
    const obj = objects.find((o) => o.id === selectedId)
    if (!obj) return

    const x = this.offsetX + obj.gridX * this.cellSize
    const y = this.offsetY + obj.gridY * this.cellSize

    this.ctx.strokeStyle = '#00ffff'
    this.ctx.lineWidth = 2
    this.ctx.setLineDash([6, 4])
    this.ctx.strokeRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4)
    this.ctx.setLineDash([])
  }

  private drawGridLines() {
    this.ctx.strokeStyle = '#333'
    this.ctx.lineWidth = 1

    for (let col = 0; col <= this.gridCols; col++) {
      const x = this.offsetX + col * this.cellSize + 0.5
      this.ctx.beginPath()
      this.ctx.moveTo(x, this.offsetY)
      this.ctx.lineTo(x, this.offsetY + this.gridRows * this.cellSize)
      this.ctx.stroke()
    }

    for (let row = 0; row <= this.gridRows; row++) {
      const y = this.offsetY + row * this.cellSize + 0.5
      this.ctx.beginPath()
      this.ctx.moveTo(this.offsetX, y)
      this.ctx.lineTo(this.offsetX + this.gridCols * this.cellSize, y)
      this.ctx.stroke()
    }
  }

  private drawPlayer(player: PlayerState) {
    const x = this.offsetX + player.x
    const y = this.offsetY + player.y

    this.ctx.fillStyle = '#4fc3f7'
    this.ctx.strokeStyle = '#0288d1'
    this.ctx.lineWidth = 2
    this.ctx.fillRect(x, y, player.width, player.height)
    this.ctx.strokeRect(x, y, player.width, player.height)

    this.ctx.fillStyle = '#fff'
    const eyeY = y + player.height * 0.3
    this.ctx.fillRect(x + player.width * 0.25, eyeY, player.width * 0.2, player.height * 0.2)
    this.ctx.fillRect(x + player.width * 0.55, eyeY, player.width * 0.2, player.height * 0.2)
  }
}
