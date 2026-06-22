export interface FlipKeyframe {
  progress: number
  angle: number
  foldPosition: { x: number; y: number }
  shadowIntensity: number
  isDragging: boolean
  velocity: number
}

interface PageFlipEngineOptions {
  pageWidth: number
  pageHeight: number
  flipThreshold?: number
  easeFactor?: number
}

type FlipDirection = 'next' | 'prev' | null

export class PageFlipEngine {
  private pageWidth: number
  private pageHeight: number
  private flipThreshold: number
  private easeFactor: number

  private isDragging = false
  private dragStartX = 0
  private dragStartY = 0
  private currentX = 0
  private currentY = 0
  private velocity = 0
  private lastX = 0
  private lastTime = 0
  private flipDirection: FlipDirection = null
  private flipProgress = 0
  private isAnimating = false
  private animationId: number | null = null
  private listeners: Set<(keyframe: FlipKeyframe) => void> = new Set()

  constructor(options: PageFlipEngineOptions) {
    this.pageWidth = options.pageWidth
    this.pageHeight = options.pageHeight
    this.flipThreshold = options.flipThreshold ?? 0.3
    this.easeFactor = options.easeFactor ?? 0.15
  }

  setPageSize(width: number, height: number): void {
    this.pageWidth = width
    this.pageHeight = height
  }

  subscribe(callback: (keyframe: FlipKeyframe) => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  private emit(keyframe: FlipKeyframe): void {
    this.listeners.forEach((callback) => callback(keyframe))
  }

  handlePointerDown(x: number, y: number): void {
    const cornerRegion = this.pageWidth * 0.3
    const rightCorner = x > this.pageWidth - cornerRegion && y > this.pageHeight * 0.5
    const leftCorner = x < cornerRegion && y > this.pageHeight * 0.5

    if (!rightCorner && !leftCorner) return

    this.isDragging = true
    this.dragStartX = x
    this.dragStartY = y
    this.currentX = x
    this.currentY = y
    this.lastX = x
    this.lastTime = performance.now()
    this.velocity = 0
    this.flipDirection = rightCorner ? 'next' : 'prev'
    this.flipProgress = 0
    this.isAnimating = false

    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }

    this.emitCurrentFrame()
  }

  handlePointerMove(x: number, y: number): void {
    if (!this.isDragging) return

    const now = performance.now()
    const deltaTime = now - this.lastTime
    
    if (deltaTime > 0) {
      this.velocity = (x - this.lastX) / deltaTime
    }
    
    this.lastX = x
    this.lastTime = now
    this.currentX = x
    this.currentY = y

    const dragDistance = this.flipDirection === 'next'
      ? this.dragStartX - x
      : x - this.dragStartX

    this.flipProgress = Math.max(0, Math.min(1, dragDistance / (this.pageWidth * 0.7)))

    this.emitCurrentFrame()
  }

  handlePointerUp(): void {
    if (!this.isDragging) return

    this.isDragging = false

    const willComplete = this.flipProgress > this.flipThreshold || Math.abs(this.velocity) > 0.5
    
    if (willComplete) {
      this.startCompletionAnimation()
    } else {
      this.startReturnAnimation()
    }
  }

  private startCompletionAnimation(): void {
    this.isAnimating = true
    const startProgress = this.flipProgress
    const startVelocity = Math.abs(this.velocity)
    const startTime = performance.now()
    const duration = 400 * (1 - startProgress)

    const animate = () => {
      const elapsed = performance.now() - startTime
      const t = Math.min(1, elapsed / duration)
      const easeT = 1 - Math.pow(1 - t, 3)
      
      this.flipProgress = startProgress + (1 - startProgress) * easeT
      this.velocity = startVelocity * (1 - easeT)

      this.emitCurrentFrame()

      if (t < 1) {
        this.animationId = requestAnimationFrame(animate)
      } else {
        this.flipProgress = 1
        this.emitCurrentFrame()
        this.isAnimating = false
        this.animationId = null
      }
    }

    this.animationId = requestAnimationFrame(animate)
  }

  private startReturnAnimation(): void {
    this.isAnimating = true
    const startProgress = this.flipProgress
    const startTime = performance.now()
    const duration = 300 * startProgress

    const animate = () => {
      const elapsed = performance.now() - startTime
      const t = Math.min(1, elapsed / duration)
      const easeT = 1 - Math.pow(1 - t, 2)
      
      this.flipProgress = startProgress * (1 - easeT)
      this.velocity = 0

      this.emitCurrentFrame()

      if (t < 1) {
        this.animationId = requestAnimationFrame(animate)
      } else {
        this.flipProgress = 0
        this.flipDirection = null
        this.emitCurrentFrame()
        this.isAnimating = false
        this.animationId = null
      }
    }

    this.animationId = requestAnimationFrame(animate)
  }

  private emitCurrentFrame(): void {
    const angle = this.calculateAngle()
    const foldPosition = this.calculateFoldPosition()
    const shadowIntensity = this.calculateShadowIntensity()

    this.emit({
      progress: this.flipProgress,
      angle,
      foldPosition,
      shadowIntensity,
      isDragging: this.isDragging,
      velocity: this.velocity,
    })
  }

  private calculateAngle(): number {
    const maxAngle = 160
    return this.flipProgress * maxAngle
  }

  private calculateFoldPosition(): { x: number; y: number } {
    if (this.flipDirection === 'next') {
      const x = this.pageWidth * (1 - this.flipProgress * 0.85)
      const y = this.pageHeight * (0.5 + this.flipProgress * 0.1)
      return { x, y }
    } else {
      const x = this.pageWidth * this.flipProgress * 0.85
      const y = this.pageHeight * (0.5 + this.flipProgress * 0.1)
      return { x, y }
    }
  }

  private calculateShadowIntensity(): number {
    const peakProgress = 0.5
    const distanceFromPeak = Math.abs(this.flipProgress - peakProgress) / peakProgress
    return Math.max(0.2, 1 - distanceFromPeak * 0.8) * this.flipProgress
  }

  getFlipProgress(): number {
    return this.flipProgress
  }

  getFlipDirection(): FlipDirection {
    return this.flipDirection
  }

  isActive(): boolean {
    return this.isDragging || this.isAnimating
  }

  destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    this.listeners.clear()
  }
}
