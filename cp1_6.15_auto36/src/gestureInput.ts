import type { Point } from '../shared/types'

export type TrajectoryCallback = (trajectory: Point[]) => void
export type DrawingUpdateCallback = (trajectory: Point[], isComplete: boolean) => void

interface GestureInputOptions {
  canvas: HTMLCanvasElement
  onTrajectoryComplete?: TrajectoryCallback
  onDrawingUpdate?: DrawingUpdateCallback
}

export class GestureInput {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private trajectory: Point[] = []
  private isDrawing: boolean = false
  private startTime: number = 0
  private onTrajectoryComplete?: TrajectoryCallback
  private onDrawingUpdate?: DrawingUpdateCallback
  private lastPoint: Point | null = null
  private lastSmoothedPoint: Point | null = null
  private trailCanvas: HTMLCanvasElement | null = null
  private trailCtx: CanvasRenderingContext2D | null = null

  private readonly minTrajectoryLength: number = 30
  private readonly minPointCount: number = 5
  private readonly minPointDistance: number = 4
  private readonly smoothingAlpha: number = 0.3

  constructor(options: GestureInputOptions) {
    this.canvas = options.canvas
    this.onTrajectoryComplete = options.onTrajectoryComplete
    this.onDrawingUpdate = options.onDrawingUpdate

    const ctx = this.canvas.getContext('2d')
    if (!ctx) {
      throw new Error('无法获取Canvas 2D上下文')
    }
    this.ctx = ctx

    this.trailCanvas = document.createElement('canvas')
    this.trailCanvas.width = this.canvas.width
    this.trailCanvas.height = this.canvas.height
    this.trailCtx = this.trailCanvas.getContext('2d')

    this.bindEvents()
  }

  private bindEvents(): void {
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this))
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this))
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this))
    this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this))

    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false })
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false })
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this))

    window.addEventListener('resize', this.handleResize.bind(this))
  }

  private handleResize(): void {
    if (this.trailCanvas && this.trailCtx) {
      this.trailCanvas.width = this.canvas.width
      this.trailCanvas.height = this.canvas.height
    }
  }

  private getCanvasPoint(clientX: number, clientY: number): Point {
    const rect = this.canvas.getBoundingClientRect()
    const scaleX = this.canvas.width / rect.width
    const scaleY = this.canvas.height / rect.height
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
      timestamp: Date.now() - this.startTime,
    }
  }

  private handleMouseDown(e: MouseEvent): void {
    e.preventDefault()
    if (e.button !== 0) return
    this.startDrawing(e.clientX, e.clientY)
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.isDrawing) return
    this.addPoint(e.clientX, e.clientY)
  }

  private handleMouseUp(_e: MouseEvent): void {
    if (!this.isDrawing) return
    this.endDrawing()
  }

  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault()
    if (e.touches.length !== 1) return
    const touch = e.touches[0]
    this.startDrawing(touch.clientX, touch.clientY)
  }

  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault()
    if (!this.isDrawing || e.touches.length === 0) return
    const touch = e.touches[0]
    this.addPoint(touch.clientX, touch.clientY)
  }

  private handleTouchEnd(e: TouchEvent): void {
    e.preventDefault()
    if (!this.isDrawing) return
    this.endDrawing()
  }

  private startDrawing(clientX: number, clientY: number): void {
    this.isDrawing = true
    this.startTime = Date.now()
    this.trajectory = []
    this.lastPoint = null
    this.lastSmoothedPoint = null
    this.clearTrail()

    const point = this.getCanvasPoint(clientX, clientY)
    this.trajectory.push(point)
    this.lastPoint = point
    this.lastSmoothedPoint = point

    this.onDrawingUpdate?.(this.trajectory, false)
  }

  private addPoint(clientX: number, clientY: number): void {
    const point = this.getCanvasPoint(clientX, clientY)

    if (this.lastPoint) {
      const dx = point.x - this.lastPoint.x
      const dy = point.y - this.lastPoint.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < this.minPointDistance) return
    }

    let smoothedPoint = point
    if (this.lastSmoothedPoint) {
      const smoothedX = this.smoothingAlpha * point.x + (1 - this.smoothingAlpha) * this.lastSmoothedPoint.x
      const smoothedY = this.smoothingAlpha * point.y + (1 - this.smoothingAlpha) * this.lastSmoothedPoint.y
      smoothedPoint = { ...point, x: smoothedX, y: smoothedY }
    }

    this.trajectory.push(smoothedPoint)
    this.lastPoint = point
    this.lastSmoothedPoint = smoothedPoint

    this.onDrawingUpdate?.(this.trajectory, false)
  }

  private getTrajectoryLength(points: Point[]): number {
    let length = 0
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x
      const dy = points[i].y - points[i - 1].y
      length += Math.sqrt(dx * dx + dy * dy)
    }
    return length
  }

  private endDrawing(): void {
    this.isDrawing = false
    this.onDrawingUpdate?.(this.trajectory, true)

    const trajectoryLength = this.getTrajectoryLength(this.trajectory)
    if (trajectoryLength < this.minTrajectoryLength || this.trajectory.length < this.minPointCount) {
      return
    }

    this.onTrajectoryComplete?.([...this.trajectory])
  }

  private clearTrail(): void {
    if (this.trailCtx && this.trailCanvas) {
      this.trailCtx.clearRect(0, 0, this.trailCanvas.width, this.trailCanvas.height)
    }
  }

  public clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.clearTrail()
  }

  public setTrajectoryCallback(callback: TrajectoryCallback): void {
    this.onTrajectoryComplete = callback
  }

  public setDrawingUpdateCallback(callback: DrawingUpdateCallback): void {
    this.onDrawingUpdate = callback
  }

  public getCurrentTrajectory(): Point[] {
    return [...this.trajectory]
  }

  public getIsDrawing(): boolean {
    return this.isDrawing
  }

  public destroy(): void {
    this.canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this))
    this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this))
    this.canvas.removeEventListener('mouseup', this.handleMouseUp.bind(this))
    this.canvas.removeEventListener('mouseleave', this.handleMouseUp.bind(this))
    this.canvas.removeEventListener('touchstart', this.handleTouchStart.bind(this))
    this.canvas.removeEventListener('touchmove', this.handleTouchMove.bind(this))
    this.canvas.removeEventListener('touchend', this.handleTouchEnd.bind(this))
    window.removeEventListener('resize', this.handleResize.bind(this))
  }
}
