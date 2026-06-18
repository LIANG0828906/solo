import type { FlipKeyframe } from './pageFlipEngine'

export interface PageData {
  image: HTMLImageElement | null
  isLoaded: boolean
  backgroundColor: string
}

interface RenderEngineOptions {
  canvas: HTMLCanvasElement
  pageWidth: number
  pageHeight: number
}

export class RenderEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private pageWidth: number
  private pageHeight: number
  private dpr: number

  private currentPage: PageData = { image: null, isLoaded: false, backgroundColor: '#FFFEF9' }
  private nextPage: PageData | null = null
  private prevPage: PageData | null = null
  private currentKeyframe: FlipKeyframe | null = null
  private flipDirection: 'next' | 'prev' | null = null

  private animationId: number | null = null
  private isRendering = false

  constructor(options: RenderEngineOptions) {
    this.canvas = options.canvas
    const ctx = this.canvas.getContext('2d')
    if (!ctx) throw new Error('Failed to get 2D context')
    this.ctx = ctx
    this.pageWidth = options.pageWidth
    this.pageHeight = options.pageHeight
    this.dpr = window.devicePixelRatio || 1

    this.setupCanvas()
  }

  private setupCanvas(): void {
    this.canvas.width = this.pageWidth * this.dpr
    this.canvas.height = this.pageHeight * this.dpr
    this.canvas.style.width = `${this.pageWidth}px`
    this.canvas.style.height = `${this.pageHeight}px`
    this.ctx.scale(this.dpr, this.dpr)
  }

  setPageSize(width: number, height: number): void {
    this.pageWidth = width
    this.pageHeight = height
    this.setupCanvas()
    this.requestRender()
  }

  setCurrentPage(page: PageData): void {
    this.currentPage = page
    this.requestRender()
  }

  setNextPage(page: PageData | null): void {
    this.nextPage = page
    this.requestRender()
  }

  setPrevPage(page: PageData | null): void {
    this.prevPage = page
    this.requestRender()
  }

  updateFlip(keyframe: FlipKeyframe, direction: 'next' | 'prev' | null): void {
    this.currentKeyframe = keyframe
    this.flipDirection = direction
    this.requestRender()
  }

  private requestRender(): void {
    if (this.isRendering) return
    this.isRendering = true
    this.animationId = requestAnimationFrame(() => this.render())
  }

  private render(): void {
    this.isRendering = false

    const ctx = this.ctx
    const w = this.pageWidth
    const h = this.pageHeight

    ctx.clearRect(0, 0, w, h)

    if (!this.currentKeyframe || this.currentKeyframe.progress === 0) {
      this.renderPage(ctx, this.currentPage, 0, 0, w, h, 1)
      return
    }

    const { progress, shadowIntensity, foldPosition } = this.currentKeyframe
    
    if (this.flipDirection === 'next' && this.nextPage) {
      this.renderPage(ctx, this.nextPage, 0, 0, w, h, 1)
      this.renderFlippingPage(ctx, this.currentPage, progress, shadowIntensity, foldPosition, 'next')
    } else if (this.flipDirection === 'prev' && this.prevPage) {
      this.renderPage(ctx, this.prevPage, 0, 0, w, h, 1)
      this.renderFlippingPage(ctx, this.currentPage, progress, shadowIntensity, foldPosition, 'prev')
    } else {
      this.renderPage(ctx, this.currentPage, 0, 0, w, h, 1)
    }
  }

  private renderPage(
    ctx: CanvasRenderingContext2D,
    page: PageData,
    x: number,
    y: number,
    w: number,
    h: number,
    alpha: number
  ): void {
    ctx.save()
    ctx.globalAlpha = alpha

    ctx.fillStyle = page.backgroundColor
    this.roundRect(ctx, x, y, w, h, 8)
    ctx.fill()

    if (page.image && page.isLoaded) {
      const imgRatio = page.image.width / page.image.height
      const pageRatio = w / h
      
      let drawWidth: number
      let drawHeight: number
      let offsetX: number
      let offsetY: number

      const padding = 20
      const contentW = w - padding * 2
      const contentH = h - padding * 2

      if (imgRatio > contentW / contentH) {
        drawWidth = contentW
        drawHeight = contentW / imgRatio
        offsetX = x + padding
        offsetY = y + padding + (contentH - drawHeight) / 2
      } else {
        drawHeight = contentH
        drawWidth = contentH * imgRatio
        offsetX = x + padding + (contentW - drawWidth) / 2
        offsetY = y + padding
      }

      ctx.save()
      ctx.beginPath()
      this.roundRect(ctx, offsetX, offsetY, drawWidth, drawHeight, 4)
      ctx.clip()
      ctx.drawImage(page.image, offsetX, offsetY, drawWidth, drawHeight)
      ctx.restore()
    } else if (!page.isLoaded) {
      const loadingSize = Math.min(w, h) * 0.3
      const loadingX = x + (w - loadingSize) / 2
      const loadingY = y + (h - loadingSize) / 2

      ctx.fillStyle = '#E0E0E0'
      this.roundRect(ctx, loadingX, loadingY, loadingSize, loadingSize, 8)
      ctx.fill()

      this.renderSpinner(ctx, x + w / 2, y + h / 2, 20)
    }

    ctx.restore()
  }

  private renderFlippingPage(
    ctx: CanvasRenderingContext2D,
    page: PageData,
    progress: number,
    shadowIntensity: number,
    foldPosition: { x: number; y: number },
    direction: 'next' | 'prev'
  ): void {
    const w = this.pageWidth
    const h = this.pageHeight

    const isNext = direction === 'next'
    const foldX = isNext ? w * (1 - progress * 0.85) : w * progress * 0.85
    const foldAngle = progress * Math.PI * 0.85

    ctx.save()

    const remainingWidth = isNext ? foldX : w - foldX
    if (remainingWidth > 0) {
      ctx.save()
      ctx.beginPath()
      if (isNext) {
        ctx.rect(0, 0, foldX, h)
      } else {
        ctx.rect(foldX, 0, w - foldX, h)
      }
      ctx.clip()
      this.renderPage(ctx, page, 0, 0, w, h, 1)
      ctx.restore()
    }

    const flapWidth = isNext ? w - foldX : foldX
    if (flapWidth > 0) {
      ctx.save()

      if (isNext) {
        ctx.translate(foldX, 0)
        ctx.transform(Math.cos(foldAngle), 0, Math.sin(foldAngle) * 0.3, 1, 0, 0)
        
        ctx.save()
        ctx.scale(-1, 1)
        const backGradient = ctx.createLinearGradient(-flapWidth, 0, 0, 0)
        backGradient.addColorStop(0, 'rgba(200, 190, 180, 0.9)')
        backGradient.addColorStop(0.5, 'rgba(240, 235, 225, 0.95)')
        backGradient.addColorStop(1, 'rgba(255, 253, 245, 1)')
        ctx.fillStyle = backGradient
        this.roundRect(ctx, -flapWidth, 0, flapWidth, h, 8)
        ctx.fill()
        ctx.restore()

        ctx.save()
        ctx.globalCompositeOperation = 'source-over'
        const shadowGradient = ctx.createLinearGradient(0, 0, 30, 0)
        shadowGradient.addColorStop(0, `rgba(0, 0, 0, ${0.3 * shadowIntensity})`)
        shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = shadowGradient
        ctx.fillRect(0, 0, 30, h)
        ctx.restore()

      } else {
        ctx.translate(foldX, 0)
        ctx.transform(Math.cos(Math.PI - foldAngle), 0, -Math.sin(foldAngle) * 0.3, 1, 0, 0)
        
        ctx.save()
        const backGradient = ctx.createLinearGradient(0, 0, flapWidth, 0)
        backGradient.addColorStop(0, 'rgba(255, 253, 245, 1)')
        backGradient.addColorStop(0.5, 'rgba(240, 235, 225, 0.95)')
        backGradient.addColorStop(1, 'rgba(200, 190, 180, 0.9)')
        ctx.fillStyle = backGradient
        this.roundRect(ctx, 0, 0, flapWidth, h, 8)
        ctx.fill()
        ctx.restore()

        ctx.save()
        ctx.globalCompositeOperation = 'source-over'
        const shadowGradient = ctx.createLinearGradient(-30, 0, 0, 0)
        shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
        shadowGradient.addColorStop(1, `rgba(0, 0, 0, ${0.3 * shadowIntensity})`)
        ctx.fillStyle = shadowGradient
        ctx.fillRect(-30, 0, 30, h)
        ctx.restore()
      }

      ctx.restore()
    }

    ctx.restore()

    this.renderBottomShadow(ctx, progress, shadowIntensity, direction)
  }

  private renderBottomShadow(
    ctx: CanvasRenderingContext2D,
    progress: number,
    shadowIntensity: number,
    direction: 'next' | 'prev'
  ): void {
    const w = this.pageWidth
    const h = this.pageHeight

    const shadowWidth = 40 + progress * 30
    const shadowHeight = 8 + progress * 12
    const isNext = direction === 'next'
    const shadowX = isNext ? w - shadowWidth * progress : shadowWidth * progress - shadowWidth

    ctx.save()
    ctx.globalAlpha = shadowIntensity * 0.5
    
    const gradient = ctx.createRadialGradient(
      isNext ? w : 0, h, 0,
      isNext ? w : 0, h, shadowWidth
    )
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.25)')
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
    
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.ellipse(
      isNext ? w - 10 : 10,
      h - 5,
      shadowWidth * 0.8,
      shadowHeight,
      0, 0, Math.PI * 2
    )
    ctx.fill()
    
    ctx.restore()
  }

  private renderSpinner(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number): void {
    const time = performance.now() / 1000
    const rotation = time * 2

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rotation)

    const bars = 8
    for (let i = 0; i < bars; i++) {
      const angle = (i / bars) * Math.PI * 2
      const alpha = 0.3 + (i / bars) * 0.7
      
      ctx.save()
      ctx.rotate(angle)
      ctx.fillStyle = `rgba(150, 150, 150, ${alpha})`
      ctx.fillRect(-2, -radius + 2, 4, radius * 0.5)
      ctx.restore()
    }

    ctx.restore()
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    const radius = Math.min(r, w / 2, h / 2)
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + w - radius, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
    ctx.lineTo(x + w, y + h - radius)
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
    ctx.lineTo(x + radius, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas
  }

  destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
  }
}
