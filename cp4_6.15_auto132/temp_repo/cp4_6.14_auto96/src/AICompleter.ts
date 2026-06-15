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

interface ConnectedComponent {
  pixels: PixelData[]
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
  centroid: { x: number; y: number }
  dominantColor: string
  avgSize: number
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
    const components = this.findConnectedComponents(pixelData, selectionRect)
    const strokeDirections = this.analyzeStrokeDirections(existingStrokes, selectionRect)
    const density = this.calculateStrokeDensity(existingStrokes, selectionRect)

    const newStrokes: Stroke[] = []

    if (components.length > 0) {
      components.forEach(comp => {
        const extensionStrokes = this.generateExtensionStrokes(
          comp,
          selectionRect,
          strokeDirections,
          activeLayerId
        )
        newStrokes.push(...extensionStrokes)
      })
    }

    const numFillerStrokes = Math.floor(density * 6) + 2
    for (let i = 0; i < Math.min(numFillerStrokes, 10); i++) {
      const color = dominantColors[i % dominantColors.length] || '#555555'
      const stroke = this.generateFillerStroke(
        selectionRect,
        color,
        strokeDirections,
        pixelData,
        activeLayerId
      )
      if (stroke) newStrokes.push(stroke)
    }

    return newStrokes.slice(0, 15)
  }

  private analyzePixelData(strokes: Stroke[], rect: Rect): PixelData[] {
    const scale = 0.5
    const w = Math.max(1, Math.floor(rect.width * scale))
    const h = Math.max(1, Math.floor(rect.height * scale))

    this.canvas.width = w
    this.canvas.height = h
    this.ctx.clearRect(0, 0, w, h)

    this.ctx.save()
    this.ctx.translate(-rect.x * scale, -rect.y * scale)
    this.ctx.scale(scale, scale)

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

    const imageData = this.ctx.getImageData(0, 0, w, h)
    const pixels: PixelData[] = []

    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x += 2) {
        const idx = (y * w + x) * 4
        if (imageData.data[idx + 3] > 40) {
          pixels.push({
            x: x / scale + rect.x,
            y: y / scale + rect.y,
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
    if (pixels.length === 0) return ['#555555', '#888888', '#333333', '#777777', '#999999']

    const k = Math.min(5, pixels.length > 20 ? 5 : 3)
    return this.kMeansColors(pixels, k)
  }

  private kMeansColors(pixels: PixelData[], k: number): string[] {
    if (pixels.length <= k) {
      return pixels.map(p => `#${p.r.toString(16).padStart(2, '0')}${p.g.toString(16).padStart(2, '0')}${p.b.toString(16).padStart(2, '0')}`)
    }

    const centroids: { r: number; g: number; b: number }[] = []
    const step = Math.floor(pixels.length / k)
    for (let i = 0; i < k; i++) {
      const p = pixels[i * step]
      centroids.push({ r: p.r, g: p.g, b: p.b })
    }

    for (let iter = 0; iter < 8; iter++) {
      const clusters: { r: number; g: number; b: number; count: number }[] = centroids.map(() => ({
        r: 0, g: 0, b: 0, count: 0
      }))

      pixels.forEach(pixel => {
        let minDist = Infinity
        let minIdx = 0
        centroids.forEach((cent, idx) => {
          const dr = pixel.r - cent.r
          const dg = pixel.g - cent.g
          const db = pixel.b - cent.b
          const dist = dr * dr + dg * dg + db * db
          if (dist < minDist) {
            minDist = dist
            minIdx = idx
          }
        })
        clusters[minIdx].r += pixel.r
        clusters[minIdx].g += pixel.g
        clusters[minIdx].b += pixel.b
        clusters[minIdx].count++
      })

      clusters.forEach((cluster, idx) => {
        if (cluster.count > 0) {
          centroids[idx] = {
            r: Math.floor(cluster.r / cluster.count),
            g: Math.floor(cluster.g / cluster.count),
            b: Math.floor(cluster.b / cluster.count)
          }
        }
      })
    }

    return centroids
      .sort((a, b) => {
        const aLum = 0.299 * a.r + 0.587 * a.g + 0.114 * a.b
        const bLum = 0.299 * b.r + 0.587 * b.g + 0.114 * b.b
        return aLum - bLum
      })
      .map(c => `#${c.r.toString(16).padStart(2, '0')}${c.g.toString(16).padStart(2, '0')}${c.b.toString(16).padStart(2, '0')}`)
  }

  private findConnectedComponents(pixels: PixelData[], rect: Rect): ConnectedComponent[] {
    if (pixels.length === 0) return []

    const pixelMap = new Map<string, PixelData>()
    const gridSize = 8

    pixels.forEach(p => {
      const key = `${Math.floor(p.x / gridSize)},${Math.floor(p.y / gridSize)}`
      if (!pixelMap.has(key)) {
        pixelMap.set(key, p)
      }
    })

    const visited = new Set<string>()
    const components: ConnectedComponent[] = []

    const floodFill = (startKey: string): ConnectedComponent | null => {
      const queue: string[] = [startKey]
      const compPixels: PixelData[] = []
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      let sumX = 0, sumY = 0
      let sumR = 0, sumG = 0, sumB = 0

      while (queue.length > 0) {
        const key = queue.shift()!
        if (visited.has(key)) continue
        visited.add(key)

        const pixel = pixelMap.get(key)
        if (!pixel) continue

        compPixels.push(pixel)
        minX = Math.min(minX, pixel.x)
        minY = Math.min(minY, pixel.y)
        maxX = Math.max(maxX, pixel.x)
        maxY = Math.max(maxY, pixel.y)
        sumX += pixel.x
        sumY += pixel.y
        sumR += pixel.r
        sumG += pixel.g
        sumB += pixel.b

        const [kx, ky] = key.split(',').map(Number)
        const neighbors = [
          `${kx + 1},${ky}`,
          `${kx - 1},${ky}`,
          `${kx},${ky + 1}`,
          `${kx},${ky - 1}`,
          `${kx + 1},${ky + 1}`,
          `${kx - 1},${ky - 1}`
        ]

        neighbors.forEach(nKey => {
          if (!visited.has(nKey) && pixelMap.has(nKey)) {
            queue.push(nKey)
          }
        })
      }

      if (compPixels.length < 3) return null

      const count = compPixels.length
      const avgR = Math.floor(sumR / count)
      const avgG = Math.floor(sumG / count)
      const avgB = Math.floor(sumB / count)

      return {
        pixels: compPixels,
        bounds: { minX, minY, maxX, maxY },
        centroid: { x: sumX / count, y: sumY / count },
        dominantColor: `#${avgR.toString(16).padStart(2, '0')}${avgG.toString(16).padStart(2, '0')}${avgB.toString(16).padStart(2, '0')}`,
        avgSize: Math.max(maxX - minX, maxY - minY) / Math.max(1, Math.sqrt(count))
      }
    }

    pixelMap.forEach((_, key) => {
      if (!visited.has(key)) {
        const comp = floodFill(key)
        if (comp) components.push(comp)
      }
    })

    return components.sort((a, b) => b.pixels.length - a.pixels.length)
  }

  private analyzeStrokeDirections(strokes: Stroke[], rect: Rect): number[] {
    const directions: number[] = []

    strokes.forEach(stroke => {
      const relevantPoints = stroke.points.filter(
        p => p.x >= rect.x - 50 && p.x <= rect.x + rect.width + 50 &&
             p.y >= rect.y - 50 && p.y <= rect.y + rect.height + 50
      )

      if (relevantPoints.length >= 2) {
        for (let i = 1; i < relevantPoints.length; i++) {
          const dx = relevantPoints[i].x - relevantPoints[i - 1].x
          const dy = relevantPoints[i].y - relevantPoints[i - 1].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist > 3) {
            directions.push(Math.atan2(dy, dx))
          }
        }
      }
    })

    if (directions.length === 0) {
      return [0, Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2]
    }

    return directions
  }

  private calculateStrokeDensity(strokes: Stroke[], rect: Rect): number {
    let totalLength = 0

    strokes.forEach(stroke => {
      const relevantPoints = stroke.points.filter(
        p => p.x >= rect.x - 30 && p.x <= rect.x + rect.width + 30 &&
             p.y >= rect.y - 30 && p.y <= rect.y + rect.height + 30
      )

      for (let i = 1; i < relevantPoints.length; i++) {
        const dx = relevantPoints[i].x - relevantPoints[i - 1].x
        const dy = relevantPoints[i].y - relevantPoints[i - 1].y
        totalLength += Math.sqrt(dx * dx + dy * dy)
      }
    })

    const area = rect.width * rect.height
    return Math.min(totalLength / area * 80, 1)
  }

  private generateExtensionStrokes(
    component: ConnectedComponent,
    selectionRect: Rect,
    directions: number[],
    layerId: string
  ): Stroke[] {
    const strokes: Stroke[] = []
    const { bounds, centroid, dominantColor } = component

    const insideSelection =
      bounds.minX >= selectionRect.x &&
      bounds.maxX <= selectionRect.x + selectionRect.width &&
      bounds.minY >= selectionRect.y &&
      bounds.maxY <= selectionRect.y + selectionRect.height

    if (!insideSelection) return strokes

    const avgDirection = directions.length > 0
      ? directions[Math.floor(Math.random() * directions.length)]
      : Math.random() * Math.PI * 2

    const extensions = [
      { angle: avgDirection, length: 0.8 },
      { angle: avgDirection + Math.PI, length: 0.8 },
      { angle: avgDirection + 0.3, length: 0.5 },
      { angle: avgDirection - 0.3, length: 0.5 }
    ]

    extensions.forEach(({ angle, length }) => {
      const startX = centroid.x + Math.cos(angle + Math.PI) * 10
      const startY = centroid.y + Math.sin(angle + Math.PI) * 10
      const dist = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) * length

      const endX = centroid.x + Math.cos(angle) * dist
      const endY = centroid.y + Math.sin(angle) * dist

      const numPoints = 6 + Math.floor(Math.random() * 6)
      const points: Point[] = []
      const now = Date.now()

      for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints
        const x = startX + (endX - startX) * t + (Math.random() - 0.5) * dist * 0.15
        const y = startY + (endY - startY) * t + (Math.random() - 0.5) * dist * 0.15
        points.push({ x, y, timestamp: now + i * 15 })
      }

      strokes.push({
        id: uuidv4(),
        tool: 'pencil',
        color: dominantColor,
        baseSize: 8 + Math.random() * 12,
        points,
        layerId,
        opacity: 0.75,
        createdAt: Date.now()
      })
    })

    return strokes
  }

  private generateFillerStroke(
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
      return dx * dx + dy * dy < 15000
    })

    if (nearPixels.length === 0 && pixels.length > 0) {
      nearPixels = pixels.slice(0, Math.min(5, pixels.length))
    }

    let targetX: number, targetY: number
    if (nearPixels.length > 0) {
      const targetPixel = nearPixels[Math.floor(Math.random() * nearPixels.length)]
      targetX = targetPixel.x + (Math.random() - 0.5) * 40
      targetY = targetPixel.y + (Math.random() - 0.5) * 40
    } else {
      targetX = centerX + (Math.random() - 0.5) * rect.width * 0.7
      targetY = centerY + (Math.random() - 0.5) * rect.height * 0.7
    }

    const baseDirection = directions.length > 0
      ? directions[Math.floor(Math.random() * directions.length)]
      : Math.atan2(targetY - startY, targetX - startX)

    const midX = (startX + targetX) / 2 + Math.cos(baseDirection + Math.PI / 2) * (Math.random() - 0.5) * rect.width * 0.2
    const midY = (startY + targetY) / 2 + Math.sin(baseDirection + Math.PI / 2) * (Math.random() - 0.5) * rect.height * 0.2

    const numPoints = 10 + Math.floor(Math.random() * 10)
    const points: Point[] = []
    const now = Date.now()

    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints
      const x = this.quadraticBezier(startX, midX, targetX, t) + (Math.random() - 0.5) * rect.width * 0.08
      const y = this.quadraticBezier(startY, midY, targetY, t) + (Math.random() - 0.5) * rect.height * 0.08
      points.push({ x, y, timestamp: now + i * 12 })
    }

    return {
      id: uuidv4(),
      tool: 'pencil',
      color,
      baseSize: 10 + Math.random() * 18,
      points,
      layerId,
      opacity: 0.7 + Math.random() * 0.25,
      createdAt: Date.now()
    }
  }

  private quadraticBezier(p0: number, p1: number, p2: number, t: number): number {
    const oneMinusT = 1 - t
    return oneMinusT * oneMinusT * p0 + 2 * oneMinusT * t * p1 + t * t * p2
  }
}

export const aiCompleter = new AICompleter()
