import { v4 as uuidv4 } from 'uuid'
import type { Stroke, Point } from './store'

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

interface PixelData {
  x: number
  y: number
  r: number
  g: number
  b: number
  a: number
}

export class AICompleter {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  constructor() {
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')!
  }

  generateCompletionStrokes(
    existingStrokes: Stroke[],
    selectionRect: Rect,
    activeLayerId: string
  ): Stroke[] {
    if (selectionRect.width < 10 || selectionRect.height < 10) return []

    const pixelData = this.analyzePixelData(existingStrokes, selectionRect)
    const dominantColors = this.clusterColors(pixelData)
    const strokeDirections = this.analyzeStrokeDirections(existingStrokes, selectionRect)
    const density = this.calculateStrokeDensity(existingStrokes, selectionRect)

    const newStrokes: Stroke[] = []
    const numStrokes = Math.floor(density * 8) + 3

    for (let i = 0; i < Math.min(numStrokes, 15); i++) {
      const color = dominantColors[i % dominantColors.length] || '#333333'
      const stroke = this.generateStroke(
        selectionRect,
        color,
        strokeDirections,
        pixelData,
        activeLayerId
      )
      if (stroke) newStrokes.push(stroke)
    }

    return newStrokes
  }

  private analyzePixelData(strokes: Stroke[], rect: Rect): PixelData[] {
    this.canvas.width = Math.max(1, Math.floor(rect.width))
    this.canvas.height = Math.max(1, Math.floor(rect.height))
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    this.ctx.save()
    this.ctx.translate(-rect.x, -rect.y)

    strokes.forEach(stroke => {
      if (stroke.points.length < 2) return
      this.ctx.beginPath()
      this.ctx.strokeStyle = stroke.color
      this.ctx.lineWidth = stroke.baseSize
      this.ctx.lineCap = 'round'
      this.ctx.lineJoin = 'round'

      stroke.points.forEach((pt, idx) => {
        if (idx === 0) this.ctx.moveTo(pt.x, pt.y)
        else this.ctx.lineTo(pt.x, pt.y)
      })
      this.ctx.stroke()
    })

    this.ctx.restore()

    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
    const pixels: PixelData[] = []

    for (let y = 0; y < this.canvas.height; y += 4) {
      for (let x = 0; x < this.canvas.width; x += 4) {
        const idx = (y * this.canvas.width + x) * 4
        if (imageData.data[idx + 3] > 50) {
          pixels.push({
            x: x + rect.x,
            y: y + rect.y,
            r: imageData.data[idx],
            g: imageData.data[idx + 1],
            b: imageData.data[idx + 2],
            a: imageData.data[idx + 3]
          })
        }
      }
    }

    return pixels
  }

  private clusterColors(pixels: PixelData[]): string[] {
    if (pixels.length === 0) return ['#555555', '#888888', '#333333']

    const colorBuckets: Map<string, { count: number; r: number; g: number; b: number }> = new Map()

    pixels.forEach(pixel => {
      const key = `${Math.floor(pixel.r / 32)}-${Math.floor(pixel.g / 32)}-${Math.floor(pixel.b / 32)}`
      const existing = colorBuckets.get(key)
      if (existing) {
        existing.count++
        existing.r += pixel.r
        existing.g += pixel.g
        existing.b += pixel.b
      } else {
        colorBuckets.set(key, { count: 1, r: pixel.r, g: pixel.g, b: pixel.b })
      }
    })

    const sorted = Array.from(colorBuckets.entries())
      .map(([, data]) => ({
        r: Math.floor(data.r / data.count),
        g: Math.floor(data.g / data.count),
        b: Math.floor(data.b / data.count),
        count: data.count
      }))
      .sort((a, b) => b.count - a.count)

    return sorted
      .slice(0, 5)
      .map(c => `#${c.r.toString(16).padStart(2, '0')}${c.g.toString(16).padStart(2, '0')}${c.b.toString(16).padStart(2, '0')}`)
  }

  private analyzeStrokeDirections(strokes: Stroke[], rect: Rect): number[] {
    const directions: number[] = []

    strokes.forEach(stroke => {
      const relevantPoints = stroke.points.filter(
        p => p.x >= rect.x && p.x <= rect.x + rect.width &&
             p.y >= rect.y && p.y <= rect.y + rect.height
      )

      if (relevantPoints.length >= 2) {
        for (let i = 1; i < relevantPoints.length; i++) {
          const dx = relevantPoints[i].x - relevantPoints[i - 1].x
          const dy = relevantPoints[i].y - relevantPoints[i - 1].y
          if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
            directions.push(Math.atan2(dy, dx))
          }
        }
      }
    })

    if (directions.length === 0) {
      return [0, Math.PI / 4, -Math.PI / 4, Math.PI / 2]
    }

    return directions
  }

  private calculateStrokeDensity(strokes: Stroke[], rect: Rect): number {
    let totalLength = 0

    strokes.forEach(stroke => {
      const relevantPoints = stroke.points.filter(
        p => p.x >= rect.x - 50 && p.x <= rect.x + rect.width + 50 &&
             p.y >= rect.y - 50 && p.y <= rect.y + rect.height + 50
      )

      for (let i = 1; i < relevantPoints.length; i++) {
        const dx = relevantPoints[i].x - relevantPoints[i - 1].x
        const dy = relevantPoints[i].y - relevantPoints[i - 1].y
        totalLength += Math.sqrt(dx * dx + dy * dy)
      }
    })

    const area = rect.width * rect.height
    return Math.min(totalLength / area * 100, 1)
  }

  private generateStroke(
    rect: Rect,
    color: string,
    directions: number[],
    pixels: PixelData[],
    layerId: string
  ): Stroke | null {
    const centerX = rect.x + rect.width / 2
    const centerY = rect.y + rect.height / 2

    const startEdge = Math.floor(Math.random() * 4)
    let startX: number, startY: number

    switch (startEdge) {
      case 0:
        startX = rect.x + Math.random() * rect.width
        startY = rect.y
        break
      case 1:
        startX = rect.x + rect.width
        startY = rect.y + Math.random() * rect.height
        break
      case 2:
        startX = rect.x + Math.random() * rect.width
        startY = rect.y + rect.height
        break
      default:
        startX = rect.x
        startY = rect.y + Math.random() * rect.height
    }

    let nearPixels = pixels.filter(p => {
      const dx = p.x - startX
      const dy = p.y - startY
      return dx * dx + dy * dy < 10000
    })

    if (nearPixels.length === 0 && pixels.length > 0) {
      nearPixels = pixels.slice(0, 5)
    }

    let targetX: number, targetY: number
    if (nearPixels.length > 0) {
      const targetPixel = nearPixels[Math.floor(Math.random() * nearPixels.length)]
      targetX = targetPixel.x + (Math.random() - 0.5) * 30
      targetY = targetPixel.y + (Math.random() - 0.5) * 30
    } else {
      targetX = centerX + (Math.random() - 0.5) * rect.width * 0.6
      targetY = centerY + (Math.random() - 0.5) * rect.height * 0.6
    }

    const baseDirection = directions.length > 0
      ? directions[Math.floor(Math.random() * directions.length)]
      : Math.atan2(targetY - startY, targetX - startX)

    const numPoints = 8 + Math.floor(Math.random() * 8)
    const points: Point[] = []
    const now = Date.now()

    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints
      const x = startX + (targetX - startX) * t + (Math.random() - 0.5) * rect.width * 0.15
      const y = startY + (targetY - startY) * t + (Math.random() - 0.5) * rect.height * 0.15
      points.push({ x, y, timestamp: now + i * 10 })
    }

    return {
      id: uuidv4(),
      tool: 'pencil',
      color,
      baseSize: 10 + Math.random() * 15,
      points,
      layerId,
      opacity: 0.8,
      createdAt: Date.now()
    }
  }
}

export const aiCompleter = new AICompleter()
