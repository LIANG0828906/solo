import {
  Vehicle,
  Pedestrian,
  CrossroadSignal,
  GRID_SIZE,
  BLOCK_SIZE,
  ROAD_WIDTH,
  CROSSROAD_SIZE,
  CANVAS_PADDING,
  getCrossroadCenter,
  getTotalMapSize,
} from '../types'

const VEHICLE_COLORS = {
  red: '#FF0055',
  yellow: '#FFAA00',
  blue: '#00D4FF',
}

const SIGNAL_COLORS = {
  red: '#FF0055',
  yellow: '#FFAA00',
  green: '#00FFAA',
}

export interface RendererView {
  offsetX: number
  offsetY: number
  scale: number
}

export class Renderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private view: RendererView = { offsetX: 0, offsetY: 0, scale: 1 }
  private isDragging = false
  private lastMouseX = 0
  private lastMouseY = 0
  private onCrossroadClick: ((crossroadId: string) => void) | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Failed to get 2D context')
    this.ctx = ctx
    this.attachEventListeners()
  }

  public setOnCrossroadClick(callback: (crossroadId: string) => void) {
    this.onCrossroadClick = callback
  }

  public resize(width: number, height: number) {
    this.canvas.width = width
    this.canvas.height = height
  }

  public getView(): RendererView {
    return this.view
  }

  private attachEventListeners() {
    this.canvas.addEventListener('wheel', this.handleWheel, { passive: false })
    this.canvas.addEventListener('mousedown', this.handleMouseDown)
    this.canvas.addEventListener('mousemove', this.handleMouseMove)
    this.canvas.addEventListener('mouseup', this.handleMouseUp)
    this.canvas.addEventListener('mouseleave', this.handleMouseUp)
    this.canvas.addEventListener('click', this.handleClick)
  }

  public destroy() {
    this.canvas.removeEventListener('wheel', this.handleWheel)
    this.canvas.removeEventListener('mousedown', this.handleMouseDown)
    this.canvas.removeEventListener('mousemove', this.handleMouseMove)
    this.canvas.removeEventListener('mouseup', this.handleMouseUp)
    this.canvas.removeEventListener('mouseleave', this.handleMouseUp)
    this.canvas.removeEventListener('click', this.handleClick)
  }

  private screenToWorld(sx: number, sy: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect()
    const cx = sx - rect.left
    const cy = sy - rect.top
    return {
      x: (cx - this.view.offsetX) / this.view.scale,
      y: (cy - this.view.offsetY) / this.view.scale,
    }
  }

  private handleWheel = (e: WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    this.view.scale = Math.max(0.5, Math.min(2.0, this.view.scale * delta))
  }

  private handleMouseDown = (e: MouseEvent) => {
    this.isDragging = true
    this.lastMouseX = e.clientX
    this.lastMouseY = e.clientY
  }

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.isDragging) return
    const dx = e.clientX - this.lastMouseX
    const dy = e.clientY - this.lastMouseY
    this.view.offsetX += dx
    this.view.offsetY += dy
    this.lastMouseX = e.clientX
    this.lastMouseY = e.clientY
  }

  private handleMouseUp = () => {
    this.isDragging = false
  }

  private handleClick = (e: MouseEvent) => {
    if (this.isDragging) return
    const { x, y } = this.screenToWorld(e.clientX, e.clientY)
    for (let gy = 0; gy < GRID_SIZE; gy++) {
      for (let gx = 0; gx < GRID_SIZE; gx++) {
        const center = getCrossroadCenter(gx, gy)
        const dx = x - center.x
        const dy = y - center.y
        if (Math.abs(dx) < CROSSROAD_SIZE / 2 && Math.abs(dy) < CROSSROAD_SIZE / 2) {
          if (this.onCrossroadClick) {
            this.onCrossroadClick(`crossroad_${gx}_${gy}`)
          }
          return
        }
      }
    }
  }

  public render(
    vehicles: Vehicle[],
    pedestrians: Pedestrian[],
    crossroads: Map<string, CrossroadSignal>,
    selectedCrossroadId: string | null
  ) {
    const { ctx, canvas } = this
    ctx.fillStyle = '#0A0E27'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.save()
    ctx.translate(this.view.offsetX, this.view.offsetY)
    ctx.scale(this.view.scale, this.view.scale)

    this.drawCityBlocks()
    this.drawRoads()
    this.drawCrosswalks()
    this.drawSignals(crossroads, selectedCrossroadId)
    this.drawVehicleTrails(vehicles)
    this.drawVehicles(vehicles)
    this.drawPedestrianTrails(pedestrians)
    this.drawPedestrians(pedestrians)

    ctx.restore()
  }

  private drawCityBlocks() {
    const { ctx } = this
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const bx = CANVAS_PADDING + ROAD_WIDTH + x * (BLOCK_SIZE + ROAD_WIDTH)
        const by = CANVAS_PADDING + ROAD_WIDTH + y * (BLOCK_SIZE + ROAD_WIDTH)
        ctx.fillStyle = '#2A2D3E'
        ctx.fillRect(bx, by, BLOCK_SIZE, BLOCK_SIZE)
        ctx.strokeStyle = '#3A3D4E'
        ctx.lineWidth = 1
        ctx.strokeRect(bx + 0.5, by + 0.5, BLOCK_SIZE - 1, BLOCK_SIZE - 1)
      }
    }
  }

  private drawRoads() {
    const { ctx } = this
    const mapSize = getTotalMapSize()

    ctx.fillStyle = '#1A1D2E'
    for (let i = 0; i <= GRID_SIZE; i++) {
      const hx = CANVAS_PADDING
      const hy = CANVAS_PADDING + i * (BLOCK_SIZE + ROAD_WIDTH)
      ctx.fillRect(hx, hy, mapSize, ROAD_WIDTH)

      const vx = CANVAS_PADDING + i * (BLOCK_SIZE + ROAD_WIDTH)
      const vy = CANVAS_PADDING
      ctx.fillRect(vx, vy, ROAD_WIDTH, mapSize)
    }

    ctx.strokeStyle = '#3A3F55'
    ctx.lineWidth = 1
    ctx.setLineDash([6, 6])
    for (let i = 0; i <= GRID_SIZE; i++) {
      const hy = CANVAS_PADDING + i * (BLOCK_SIZE + ROAD_WIDTH) + ROAD_WIDTH / 2
      ctx.beginPath()
      ctx.moveTo(CANVAS_PADDING, hy)
      ctx.lineTo(CANVAS_PADDING + mapSize, hy)
      ctx.stroke()

      const vx = CANVAS_PADDING + i * (BLOCK_SIZE + ROAD_WIDTH) + ROAD_WIDTH / 2
      ctx.beginPath()
      ctx.moveTo(vx, CANVAS_PADDING)
      ctx.lineTo(vx, CANVAS_PADDING + mapSize)
      ctx.stroke()
    }
    ctx.setLineDash([])
  }

  private drawCrosswalks() {
    const { ctx } = this
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const center = getCrossroadCenter(x, y)
        const crosswalkSize = ROAD_WIDTH
        const stripeWidth = 3
        const stripeGap = 4

        ctx.fillStyle = '#FFFFFF40'
        for (let sx = -crosswalkSize / 2; sx < crosswalkSize / 2; sx += stripeWidth + stripeGap) {
          ctx.fillRect(center.x + sx, center.y - ROAD_WIDTH / 2 - 4, stripeWidth, 4)
          ctx.fillRect(center.x + sx, center.y + ROAD_WIDTH / 2, stripeWidth, 4)
        }
        for (let sy = -crosswalkSize / 2; sy < crosswalkSize / 2; sy += stripeWidth + stripeGap) {
          ctx.fillRect(center.x - ROAD_WIDTH / 2 - 4, center.y + sy, 4, stripeWidth)
          ctx.fillRect(center.x + ROAD_WIDTH / 2, center.y + sy, 4, stripeWidth)
        }
      }
    }
  }

  private drawSignals(crossroads: Map<string, CrossroadSignal>, selectedCrossroadId: string | null) {
    const { ctx } = this

    for (const crossroad of crossroads.values()) {
      const center = getCrossroadCenter(crossroad.gridX, crossroad.gridY)
      const size = CROSSROAD_SIZE

      if (crossroad.id === selectedCrossroadId) {
        ctx.strokeStyle = '#00D4FF'
        ctx.lineWidth = 3
        ctx.shadowColor = '#00D4FF'
        ctx.shadowBlur = 20
        ctx.strokeRect(center.x - size / 2, center.y - size / 2, size, size)
        ctx.shadowBlur = 0
      }

      const signalColors: Array<'red' | 'yellow' | 'green'> = ['red', 'yellow', 'green']
      const lightRadius = 4
      const lightGap = 10

      for (let i = 0; i < signalColors.length; i++) {
        const color = signalColors[i]
        const lx = center.x - (lightGap * 1) + i * lightGap
        const ly = center.y - size / 2 - 10
        const isActive = crossroad.currentColor === color

        ctx.beginPath()
        ctx.arc(lx, ly, lightRadius, 0, Math.PI * 2)
        ctx.fillStyle = isActive ? SIGNAL_COLORS[color] : '#33333380'
        if (isActive) {
          ctx.shadowColor = SIGNAL_COLORS[color]
          ctx.shadowBlur = 15
        }
        ctx.fill()
        ctx.shadowBlur = 0
      }
    }
  }

  private drawVehicleTrails(vehicles: Vehicle[]) {
    const { ctx } = this
    for (const vehicle of vehicles) {
      if (!vehicle.active) continue
      for (let i = 0; i < vehicle.trail.length; i++) {
        const t = vehicle.trail[i]
        const color = VEHICLE_COLORS[vehicle.color]
        ctx.beginPath()
        ctx.arc(t.x, t.y, 2, 0, Math.PI * 2)
        const jitter = Math.floor((Math.sin(i * 12.9898 + vehicle.trail.length * 78.233) * 43758.5453) % 100)
        const hueShift = (jitter / 100 - 0.5) * 30
        ctx.fillStyle = this.shiftColor(color, hueShift, t.alpha * 0.6)
        ctx.fill()
      }
    }
  }

  private drawVehicles(vehicles: Vehicle[]) {
    const { ctx } = this
    for (const vehicle of vehicles) {
      if (!vehicle.active) continue

      ctx.save()
      ctx.translate(vehicle.x, vehicle.y)
      ctx.rotate(vehicle.angle)

      const color = VEHICLE_COLORS[vehicle.color]
      ctx.shadowColor = color
      ctx.shadowBlur = 8
      ctx.fillStyle = color
      ctx.fillRect(-vehicle.width / 2, -vehicle.height / 2, vehicle.width, vehicle.height)
      ctx.shadowBlur = 0

      ctx.strokeStyle = '#FFFFFF80'
      ctx.lineWidth = 1
      ctx.strokeRect(-vehicle.width / 2, -vehicle.height / 2, vehicle.width, vehicle.height)

      ctx.restore()
    }
  }

  private drawPedestrianTrails(pedestrians: Pedestrian[]) {
    const { ctx } = this
    for (const pedestrian of pedestrians) {
      if (!pedestrian.active) continue
      for (let i = 0; i < pedestrian.trail.length; i++) {
        const t = pedestrian.trail[i]
        ctx.beginPath()
        ctx.arc(t.x, t.y, 2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${t.alpha * 0.5})`
        ctx.fill()
      }
    }
  }

  private drawPedestrians(pedestrians: Pedestrian[]) {
    const { ctx } = this
    for (const pedestrian of pedestrians) {
      if (!pedestrian.active) continue

      ctx.beginPath()
      ctx.arc(pedestrian.x, pedestrian.y, pedestrian.radius, 0, Math.PI * 2)
      ctx.shadowColor = '#FFFFFF'
      ctx.shadowBlur = 6
      ctx.fillStyle = '#FFFFFF'
      ctx.fill()
      ctx.shadowBlur = 0
    }
  }

  private shiftColor(hex: string, hueShift: number, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    const shift = Math.floor(hueShift)
    const nr = Math.max(0, Math.min(255, r + shift))
    const ng = Math.max(0, Math.min(255, g + shift))
    const nb = Math.max(0, Math.min(255, b + shift))
    return `rgba(${nr}, ${ng}, ${nb}, ${alpha})`
  }
}
