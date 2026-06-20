import type { RGB, PaperType, BrushParams } from './types'
import { PAPER_CONFIGS } from './types'

class QuadTree {
  private capacity: number
  private boundary: { x: number; y: number; w: number; h: number }
  private points: { x: number; y: number; idx: number }[] = []
  private divided = false
  private nw?: QuadTree
  private ne?: QuadTree
  private sw?: QuadTree
  private se?: QuadTree

  constructor(boundary: { x: number; y: number; w: number; h: number }, capacity = 8) {
    this.boundary = boundary
    this.capacity = capacity
  }

  insert(x: number, y: number, idx: number): boolean {
    const b = this.boundary
    if (x < b.x || x >= b.x + b.w || y < b.y || y >= b.y + b.h) return false
    if (this.points.length < this.capacity) {
      this.points.push({ x, y, idx })
      return true
    }
    if (!this.divided) this.subdivide()
    const ok = this.nw!.insert(x, y, idx) || this.ne!.insert(x, y, idx)
          || this.sw!.insert(x, y, idx) || this.se!.insert(x, y, idx)
    return ok
  }

  private subdivide() {
    const { x, y, w, h } = this.boundary
    const hw = w / 2, hh = h / 2
    this.nw = new QuadTree({ x, y, w: hw, h: hh }, this.capacity)
    this.ne = new QuadTree({ x: x + hw, y, w: hw, h: hh }, this.capacity)
    this.sw = new QuadTree({ x, y: y + hh, w: hw, h: hh }, this.capacity)
    this.se = new QuadTree({ x: x + hw, y: y + hh, w: hw, h: hh }, this.capacity)
    this.divided = true
  }

  query(range: { x: number; y: number; w: number; h: number }, out: number[]): number[] {
    const b = this.boundary
    if (range.x > b.x + b.w || range.x + range.w < b.x ||
        range.y > b.y + b.h || range.y + range.h < b.y) return out
    for (const p of this.points) {
      if (p.x >= range.x && p.x < range.x + range.w &&
          p.y >= range.y && p.y < range.y + range.h) {
        out.push(p.idx)
      }
    }
    if (this.divided) {
      this.nw!.query(range, out)
      this.ne!.query(range, out)
      this.sw!.query(range, out)
      this.se!.query(range, out)
    }
    return out
  }
}

export class WatercolorEngine {
  width: number
  height: number
  private data: Uint8ClampedArray
  private quadtree: QuadTree
  private paperAbsorb: Float32Array
  private tempLayer: Uint8ClampedArray
  paperType: PaperType
  textureStrength: number
  waterContent: number
  private finalizeTimer: number | null = null
  private finalizeStart = 0
  private offscreen: HTMLCanvasElement
  private offCtx: CanvasRenderingContext2D
  private pendingStrokes: { x: number; y: number; r: number; c: RGB; alpha: number }[] = []

  constructor(width: number, height: number, paperType: PaperType = 'medium') {
    this.width = width
    this.height = height
    const size = width * height * 4
    this.data = new Uint8ClampedArray(size)
    this.tempLayer = new Uint8ClampedArray(size)
    this.paperAbsorb = new Float32Array(width * height)
    this.paperType = paperType
    this.textureStrength = 50
    this.waterContent = 50
    this.quadtree = new QuadTree({ x: 0, y: 0, w: width, h: height }, 16)

    const absorb = PAPER_CONFIGS[paperType].absorbRate
    for (let i = 0; i < width * height; i++) {
      const noise = (Math.random() - 0.5) * 0.6 + 1
      this.paperAbsorb[i] = absorb * noise
    }
    this.fillPaper()

    this.offscreen = document.createElement('canvas')
    this.offscreen.width = width
    this.offscreen.height = height
    const ctx = this.offscreen.getContext('2d')
    if (!ctx) throw new Error('offscreen canvas context unavailable')
    this.offCtx = ctx
  }

  private fillPaper() {
    const bgR = 245, bgG = 240, bgB = 232
    for (let i = 0; i < this.width * this.height; i++) {
      const n = (Math.random() - 0.5) * 12
      const idx = i * 4
      this.data[idx]     = bgR + n
      this.data[idx + 1] = bgG + n
      this.data[idx + 2] = bgB + n
      this.data[idx + 3] = 255
    }
  }

  setPaper(paperType: PaperType) {
    this.paperType = paperType
    const absorb = PAPER_CONFIGS[paperType].absorbRate
    for (let i = 0; i < this.width * this.height; i++) {
      const noise = (Math.random() - 0.5) * 0.6 + 1
      this.paperAbsorb[i] = absorb * noise
    }
  }

  private blend(base: number[], paint: RGB, alpha: number): [number, number, number] {
    const pa = (paint.a ?? 1) * alpha
    const inv = 1 - pa
    return [
      Math.min(255, base[0] * inv + paint.r * pa),
      Math.min(255, base[1] * inv + paint.g * pa),
      Math.min(255, base[2] * inv + paint.b * pa),
    ]
  }

  stroke(x: number, y: number, speed: number, pressure: number, color: RGB, params: BrushParams) {
    this.waterContent = params.waterContent
    this.textureStrength = params.textureStrength
    const size = params.size
    const concentration = Math.max(0.15, Math.min(1, 1.2 - speed / 2 + pressure * 0.5))
    const baseR = size / 2
    const dynR = Math.min(20, baseR * 0.6 + this.waterContent * 0.12)

    this.applyBrush(x, y, baseR, dynR, color, concentration)
    this.pendingStrokes.push({ x, y, r: dynR, c: color, alpha: concentration * 0.15 })

    if (this.finalizeTimer) {
      cancelAnimationFrame(this.finalizeTimer)
      this.finalizeTimer = null
    }
  }

  private applyBrush(cx: number, cy: number, baseR: number, diffR: number, color: RGB, conc: number) {
    const minX = Math.max(0, Math.floor(cx - diffR - baseR))
    const maxX = Math.min(this.width - 1, Math.ceil(cx + diffR + baseR))
    const minY = Math.max(0, Math.floor(cy - diffR - baseR))
    const maxY = Math.min(this.height - 1, Math.ceil(cy + diffR + baseR))
    const wFrac = this.waterContent / 100
    const tFrac = this.textureStrength / 100
    const absorbMul = 1 + wFrac * 1.5

    for (let yy = minY; yy <= maxY; yy++) {
      for (let xx = minX; xx <= maxX; xx++) {
        const dx = xx - cx, dy = yy - cy
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d > baseR + diffR) continue
        const idx = (yy * this.width + xx) * 4
        const abs = this.paperAbsorb[yy * this.width + xx] * absorbMul
        let alpha = 0
        if (d <= baseR) {
          const core = 1 - d / baseR
          alpha = (0.4 + core * core * 0.6) * conc
        } else {
          const edge = 1 - (d - baseR) / diffR
          alpha = edge * edge * conc * 0.55 * wFrac
        }
        alpha *= 0.4 + abs * 0.8
        if (tFrac > 0.1) {
          const n = (Math.random() - 0.5) * 2
          alpha *= 1 + n * tFrac * 0.35
        }
        if (alpha <= 0) continue
        const base = [this.data[idx], this.data[idx + 1], this.data[idx + 2]]
        const [r, g, b] = this.blend(base, color, Math.min(0.9, alpha))
        this.data[idx] = r
        this.data[idx + 1] = g
        this.data[idx + 2] = b
      }
    }
  }

  lift() {
    this.finalizeStart = performance.now()
    this.runFinalize()
  }

  private runFinalize() {
    const DURATION = 500
    const tick = () => {
      const elapsed = performance.now() - this.finalizeStart
      const t = Math.min(1, elapsed / DURATION)
      const fade = 1 - t
      for (const s of this.pendingStrokes) {
        this.diffuseOnce(s.x, s.y, s.r * (0.5 + t * 0.8), s.c, s.alpha * fade * 0.25)
      }
      if (t < 1) {
        this.finalizeTimer = requestAnimationFrame(tick)
      } else {
        this.pendingStrokes = []
        this.finalizeTimer = null
      }
    }
    this.finalizeTimer = requestAnimationFrame(tick)
  }

  private diffuseOnce(cx: number, cy: number, radius: number, color: RGB, alpha: number) {
    const minX = Math.max(0, Math.floor(cx - radius))
    const maxX = Math.min(this.width - 1, Math.ceil(cx + radius))
    const minY = Math.max(0, Math.floor(cy - radius))
    const maxY = Math.min(this.height - 1, Math.ceil(cy + radius))
    const r2 = radius * radius
    const tFrac = this.textureStrength / 100
    for (let yy = minY; yy <= maxY; yy++) {
      for (let xx = minX; xx <= maxX; xx++) {
        const dx = xx - cx, dy = yy - cy
        const d2 = dx * dx + dy * dy
        if (d2 > r2) continue
        const idx = (yy * this.width + xx) * 4
        const abs = this.paperAbsorb[yy * this.width + xx]
        const falloff = Math.exp(-d2 / (r2 * 0.35))
        let a = alpha * falloff * (0.4 + abs * 0.9)
        if (tFrac > 0.1) a *= 1 + (Math.random() - 0.5) * tFrac * 0.4
        if (a <= 0) continue
        const base = [this.data[idx], this.data[idx + 1], this.data[idx + 2]]
        const [r, g, b] = this.blend(base, color, Math.min(0.6, a))
        this.data[idx] = r
        this.data[idx + 1] = g
        this.data[idx + 2] = b
      }
    }
  }

  renderTo(ctx: CanvasRenderingContext2D, dx = 0, dy = 0) {
    const imgData = ctx.createImageData(this.width, this.height)
    imgData.data.set(this.data)
    ctx.putImageData(imgData, dx, dy)
  }

  getImageData(): ImageData {
    const id = new ImageData(new Uint8ClampedArray(this.data), this.width, this.height)
    return id
  }

  setImageData(id: ImageData) {
    if (id.width === this.width && id.height === this.height) {
      this.data.set(id.data)
    }
  }

  getPixelColor(x: number, y: number): RGB {
    const ix = Math.max(0, Math.min(this.width - 1, Math.round(x)))
    const iy = Math.max(0, Math.min(this.height - 1, Math.round(y)))
    let r = 0, g = 0, b = 0, n = 0
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = ix + dx, ny = iy + dy
        if (nx < 0 || ny < 0 || nx >= this.width || ny >= this.height) continue
        const idx = (ny * this.width + nx) * 4
        r += this.data[idx]; g += this.data[idx + 1]; b += this.data[idx + 2]; n++
      }
    }
    return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) }
  }

  exportBase64(): string {
    const id = this.offCtx.createImageData(this.width, this.height)
    id.data.set(this.data)
    this.offCtx.putImageData(id, 0, 0)
    return this.offscreen.toDataURL('image/png', 0.9)
  }

  exportThumbnail(maxWidth = 220): string {
    const ratio = maxWidth / this.width
    const tw = maxWidth
    const th = Math.round(this.height * ratio)
    const id = this.offCtx.createImageData(this.width, this.height)
    id.data.set(this.data)
    this.offCtx.putImageData(id, 0, 0)
    const tc = document.createElement('canvas')
    tc.width = tw; tc.height = th
    const tctx = tc.getContext('2d')!
    tctx.drawImage(this.offscreen, 0, 0, tw, th)
    return tc.toDataURL('image/png', 0.85)
  }

  destroy() {
    if (this.finalizeTimer) {
      cancelAnimationFrame(this.finalizeTimer)
      this.finalizeTimer = null
    }
  }
}
