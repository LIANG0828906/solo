import type { MapData, PathPoint, EncounterEvent, RippleEffect } from '../../types'
import { TerrainType, EncounterType } from '../../types'

const CELL_SIZE = 4
const TERRAIN_COLORS: Record<TerrainType, string> = {
  [TerrainType.GRASSLAND]: '#4CAF50',
  [TerrainType.FOREST]: '#388E3C',
  [TerrainType.MOUNTAIN]: '#795548',
  [TerrainType.WATER]: '#1565C0',
}
const RIVER_COLOR = '#4FC3F7'
const ENCOUNTER_COLORS: Record<EncounterType, string> = {
  [EncounterType.COMBAT]: '#E53935',
  [EncounterType.TRADE]: '#1976D2',
  [EncounterType.DISCOVERY]: '#2E7D32',
}

export interface MapRendererOptions {
  canvas: HTMLCanvasElement
  onCellClick?: (x: number, y: number, canvasX: number, canvasY: number) => void
  onCellHover?: (x: number, y: number | null, canvasX: number, canvasY: number) => void
}

export class MapRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private mapData: MapData | null = null
  private scale: number = 1
  private offsetX: number = 0
  private offsetY: number = 0
  private route: PathPoint[] = []
  private encounters: EncounterEvent[] = []
  private ripples: RippleEffect[] = []
  private animatedPoints: { x: number; y: number; startTime: number }[] = []
  private isDragging: boolean = false
  private dragStartX: number = 0
  private dragStartY: number = 0
  private dragOffsetX: number = 0
  private dragOffsetY: number = 0
  private onCellClick?: (x: number, y: number, canvasX: number, canvasY: number) => void
  private onCellHover?: (x: number, y: number | null, canvasX: number, canvasY: number) => void
  private animationFrameId: number | null = null
  private imageDataCache: ImageData | null = null
  private lastCacheKey: string = ''

  constructor(options: MapRendererOptions) {
    this.canvas = options.canvas
    const ctx = this.canvas.getContext('2d')
    if (!ctx) throw new Error('无法获取Canvas上下文')
    this.ctx = ctx
    this.ctx.imageSmoothingEnabled = false
    this.onCellClick = options.onCellClick
    this.onCellHover = options.onCellHover
    this.bindEvents()
  }

  private bindEvents(): void {
    this.canvas.addEventListener('mousedown', this.handleMouseDown)
    this.canvas.addEventListener('mousemove', this.handleMouseMove)
    this.canvas.addEventListener('mouseup', this.handleMouseUp)
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave)
    this.canvas.addEventListener('wheel', this.handleWheel, { passive: false })
    this.canvas.addEventListener('click', this.handleClick)
  }

  destroy(): void {
    this.canvas.removeEventListener('mousedown', this.handleMouseDown)
    this.canvas.removeEventListener('mousemove', this.handleMouseMove)
    this.canvas.removeEventListener('mouseup', this.handleMouseUp)
    this.canvas.removeEventListener('mouseleave', this.handleMouseLeave)
    this.canvas.removeEventListener('wheel', this.handleWheel)
    this.canvas.removeEventListener('click', this.handleClick)
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
    }
  }

  private screenToCell(screenX: number, screenY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect()
    const localX = screenX - rect.left - this.offsetX
    const localY = screenY - rect.top - this.offsetY
    const cellSize = CELL_SIZE * this.scale
    return {
      x: Math.floor(localX / cellSize),
      y: Math.floor(localY / cellSize),
    }
  }

  private cellToScreen(cellX: number, cellY: number): { x: number; y: number } {
    const cellSize = CELL_SIZE * this.scale
    return {
      x: cellX * cellSize + this.offsetX,
      y: cellY * cellSize + this.offsetY,
    }
  }

  private handleMouseDown = (e: MouseEvent): void => {
    if (e.button !== 0) return
    this.isDragging = true
    this.dragStartX = e.clientX
    this.dragStartY = e.clientY
    this.dragOffsetX = this.offsetX
    this.dragOffsetY = this.offsetY
  }

  private handleMouseMove = (e: MouseEvent): void => {
    if (this.isDragging) {
      const dx = e.clientX - this.dragStartX
      const dy = e.clientY - this.dragStartY
      this.offsetX = this.dragOffsetX + dx
      this.offsetY = this.dragOffsetY + dy
      this.render()
    } else {
      const rect = this.canvas.getBoundingClientRect()
      const canvasX = e.clientX - rect.left
      const canvasY = e.clientY - rect.top
      const cell = this.screenToCell(e.clientX, e.clientY)
      if (
        this.mapData &&
        cell.x >= 0 &&
        cell.x < this.mapData.width &&
        cell.y >= 0 &&
        cell.y < this.mapData.height
      ) {
        this.onCellHover?.(cell.x, cell.y, canvasX, canvasY)
      } else {
        this.onCellHover?.(-1, null, canvasX, canvasY)
      }
    }
  }

  private handleMouseUp = (e: MouseEvent): void => {
    if (Math.abs(e.clientX - this.dragStartX) > 3 || Math.abs(e.clientY - this.dragStartY) > 3) {
      this.isDragging = false
    }
    setTimeout(() => { this.isDragging = false }, 10)
  }

  private handleMouseLeave = (): void => {
    this.isDragging = false
    this.onCellHover?.(-1, null, 0, 0)
  }

  private handleWheel = (e: WheelEvent): void => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const rect = this.canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const worldX = (mouseX - this.offsetX) / this.scale
    const worldY = (mouseY - this.offsetY) / this.scale
    this.scale = Math.max(0.5, Math.min(2, this.scale * delta))
    this.offsetX = mouseX - worldX * this.scale
    this.offsetY = mouseY - worldY * this.scale
    this.imageDataCache = null
    this.render()
  }

  private handleClick = (e: MouseEvent): void => {
    if (this.isDragging || !this.mapData) return
    const cell = this.screenToCell(e.clientX, e.clientY)
    if (
      cell.x >= 0 &&
      cell.x < this.mapData.width &&
      cell.y >= 0 &&
      cell.y < this.mapData.height
    ) {
      const rect = this.canvas.getBoundingClientRect()
      this.onCellClick?.(cell.x, cell.y, e.clientX - rect.left, e.clientY - rect.top)
    }
  }

  getScale(): number {
    return this.scale
  }

  getOffset(): { x: number; y: number } {
    return { x: this.offsetX, y: this.offsetY }
  }

  setScale(scale: number): void {
    this.scale = Math.max(0.5, Math.min(2, scale))
    this.imageDataCache = null
    this.render()
  }

  setOffset(x: number, y: number): void {
    this.offsetX = x
    this.offsetY = y
    this.render()
  }

  setMapData(data: MapData): void {
    this.mapData = data
    this.imageDataCache = null
    this.lastCacheKey = ''
    this.render()
  }

  setRoute(route: PathPoint[]): void {
    this.route = route
    this.animatedPoints = route.map((p) => ({ ...p, startTime: performance.now() }))
    this.render()
  }

  setEncounters(encounters: EncounterEvent[]): void {
    this.encounters = encounters
    this.render()
  }

  setRipples(ripples: RippleEffect[]): void {
    this.ripples = ripples
  }

  private renderTerrainFast(): void {
    if (!this.mapData) return
    const { width, height, cells } = this.mapData
    const cs = CELL_SIZE * this.scale
    const cacheKey = `${this.scale}_${width}x${height}_${this.mapData.seed}`
    if (this.imageDataCache && this.lastCacheKey === cacheKey) {
      this.ctx.putImageData(this.imageDataCache, this.offsetX, this.offsetY)
      return
    }
    const pxW = width * CELL_SIZE
    const pxH = height * CELL_SIZE
    const offCanvas = document.createElement('canvas')
    offCanvas.width = pxW
    offCanvas.height = pxH
    const offCtx = offCanvas.getContext('2d')
    if (!offCtx) return
    offCtx.imageSmoothingEnabled = false
    const imgData = offCtx.createImageData(pxW, pxH)
    const data = imgData.data
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = cells[y][x]
        let color = TERRAIN_COLORS[cell.type]
        if (cell.isRiver) color = RIVER_COLOR
        const r = parseInt(color.slice(1, 3), 16)
        const g = parseInt(color.slice(3, 5), 16)
        const b = parseInt(color.slice(5, 7), 16)
        for (let py = 0; py < CELL_SIZE; py++) {
          for (let px = 0; px < CELL_SIZE; px++) {
            const idx = ((y * CELL_SIZE + py) * pxW + (x * CELL_SIZE + px)) * 4
            data[idx] = r
            data[idx + 1] = g
            data[idx + 2] = b
            data[idx + 3] = 255
          }
        }
      }
    }
    offCtx.putImageData(imgData, 0, 0)
    this.ctx.imageSmoothingEnabled = false
    this.ctx.drawImage(offCanvas, 0, 0, pxW, pxH, this.offsetX, this.offsetY, pxW * this.scale, pxH * this.scale)
    void cs
  }

  private renderTerrain(): void {
    if (!this.mapData) return
    const { width, height, cells } = this.mapData
    const cs = CELL_SIZE * this.scale
    const { width: cw, height: ch } = this.canvas
    const startCellX = Math.max(0, Math.floor(-this.offsetX / cs))
    const startCellY = Math.max(0, Math.floor(-this.offsetY / cs))
    const endCellX = Math.min(width, Math.ceil((cw - this.offsetX) / cs))
    const endCellY = Math.min(height, Math.ceil((ch - this.offsetY) / cs))
    for (let y = startCellY; y < endCellY; y++) {
      for (let x = startCellX; x < endCellX; x++) {
        const cell = cells[y][x]
        const sx = x * cs + this.offsetX
        const sy = y * cs + this.offsetY
        this.ctx.fillStyle = cell.isRiver ? RIVER_COLOR : TERRAIN_COLORS[cell.type]
        this.ctx.fillRect(Math.floor(sx), Math.floor(sy), Math.ceil(cs) + 1, Math.ceil(cs) + 1)
      }
    }
  }

  private renderRoute(): void {
    if (this.route.length < 2) return
    const cs = CELL_SIZE * this.scale
    this.ctx.save()
    this.ctx.strokeStyle = '#FFFFFF'
    this.ctx.lineWidth = Math.max(1, 1.5 * this.scale)
    this.ctx.setLineDash([6 * this.scale, 4 * this.scale])
    this.ctx.lineCap = 'round'
    this.ctx.lineJoin = 'round'
    this.ctx.beginPath()
    const first = this.cellToScreen(this.route[0].x, this.route[0].y)
    this.ctx.moveTo(first.x + cs / 2, first.y + cs / 2)
    for (let i = 1; i < this.route.length; i++) {
      const p = this.cellToScreen(this.route[i].x, this.route[i].y)
      this.ctx.lineTo(p.x + cs / 2, p.y + cs / 2)
    }
    this.ctx.stroke()
    this.ctx.restore()
    const now = performance.now()
    for (const ap of this.animatedPoints) {
      const elapsed = now - ap.startTime
      const t = Math.min(1, elapsed / 500)
      const scaleFactor = 1 + (1 - t) * 1.5
      const alpha = t
      const p = this.cellToScreen(ap.x, ap.y)
      this.ctx.save()
      this.ctx.globalAlpha = alpha
      this.ctx.fillStyle = '#FFD700'
      this.ctx.beginPath()
      this.ctx.arc(
        p.x + cs / 2,
        p.y + cs / 2,
        3 * this.scale * scaleFactor,
        0,
        Math.PI * 2
      )
      this.ctx.fill()
      this.ctx.restore()
    }
  }

  private renderEncounters(): void {
    const cs = CELL_SIZE * this.scale
    for (const enc of this.encounters) {
      const p = this.cellToScreen(enc.x, enc.y)
      const cx = p.x + cs / 2
      const cy = p.y + cs / 2
      this.ctx.save()
      this.ctx.fillStyle = ENCOUNTER_COLORS[enc.type]
      this.ctx.beginPath()
      const size = 4 * this.scale
      this.ctx.arc(cx, cy, size, 0, Math.PI * 2)
      this.ctx.fill()
      this.ctx.strokeStyle = '#FFFFFF'
      this.ctx.lineWidth = 1 * this.scale
      this.ctx.stroke()
      this.ctx.fillStyle = '#FFFFFF'
      this.ctx.font = `${Math.floor(7 * this.scale)}px sans-serif`
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'
      const icon = enc.type === EncounterType.COMBAT ? '⚔' : enc.type === EncounterType.TRADE ? '¥' : '★'
      this.ctx.fillText(icon, cx, cy + 0.5)
      this.ctx.restore()
    }
  }

  private renderRipples(): void {
    const now = performance.now()
    for (const ripple of this.ripples) {
      const elapsed = now - ripple.startTime
      if (elapsed > 600) continue
      const t = elapsed / 600
      const radius = 10 + t * 50
      const alpha = 1 - t
      this.ctx.save()
      this.ctx.strokeStyle = `rgba(212, 175, 55, ${alpha * 0.7})`
      this.ctx.lineWidth = 2
      this.ctx.beginPath()
      this.ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2)
      this.ctx.stroke()
      this.ctx.strokeStyle = `rgba(255, 215, 0, ${alpha * 0.3})`
      this.ctx.lineWidth = 1
      this.ctx.beginPath()
      this.ctx.arc(ripple.x, ripple.y, radius * 0.6, 0, Math.PI * 2)
      this.ctx.stroke()
      this.ctx.restore()
    }
  }

  render(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    if (this.scale === 1) {
      this.renderTerrainFast()
    } else {
      this.renderTerrain()
    }
    this.renderRoute()
    this.renderEncounters()
    this.renderRipples()
  }

  startAnimationLoop(): void {
    const loop = () => {
      this.render()
      this.animationFrameId = requestAnimationFrame(loop)
    }
    this.animationFrameId = requestAnimationFrame(loop)
  }

  resize(width: number, height: number): void {
    this.canvas.width = width
    this.canvas.height = height
    this.ctx.imageSmoothingEnabled = false
    this.imageDataCache = null
    this.render()
  }
}
