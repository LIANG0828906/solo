export interface RGB {
  r: number
  g: number
  b: number
}

export interface StyleEntry {
  id: string
  hex: string
  rgb: RGB
  fontName: string
  fontSize: number
  timestamp: number
  pixelX: number
  pixelY: number
}

export interface ZoomData {
  pixels: ImageData
  centerColor: RGB
  sourceX: number
  sourceY: number
}

export type SupportedFont = 'Arial' | 'Helvetica' | 'Source Han Sans' | 'Noto Sans SC'

const SUPPORTED_FONTS: SupportedFont[] = ['Arial', 'Helvetica', 'Source Han Sans', 'Noto Sans SC']
const ZOOM_REGION = 10
const FONT_ANALYSIS_SIZE = 20

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const s = Math.max(0, Math.min(255, Math.round(n))).toString(16)
    return s.length === 1 ? '0' + s : s
  }
  return ('#' + toHex(r) + toHex(g) + toHex(b)).toUpperCase()
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function generateId(): string {
  return 'entry_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8)
}

export function sampleColorAt(canvas: HTMLCanvasElement, x: number, y: number): RGB {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return { r: 0, g: 0, b: 0 }
  const cx = clamp(Math.round(x), 0, canvas.width - 1)
  const cy = clamp(Math.round(y), 0, canvas.height - 1)
  const data = ctx.getImageData(cx, cy, 1, 1).data
  return { r: data[0], g: data[1], b: data[2] }
}

export function getZoomData(canvas: HTMLCanvasElement, x: number, y: number): ZoomData {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    return {
      pixels: new ImageData(1, 1),
      centerColor: { r: 0, g: 0, b: 0 },
      sourceX: 0,
      sourceY: 0
    }
  }
  const cx = clamp(Math.round(x), 0, canvas.width - 1)
  const cy = clamp(Math.round(y), 0, canvas.height - 1)
  const sx = clamp(cx - ZOOM_REGION, 0, canvas.width - ZOOM_REGION * 2 - 1)
  const sy = clamp(cy - ZOOM_REGION, 0, canvas.height - ZOOM_REGION * 2 - 1)
  const w = Math.min(ZOOM_REGION * 2 + 1, canvas.width - sx)
  const h = Math.min(ZOOM_REGION * 2 + 1, canvas.height - sy)
  const pixels = ctx.getImageData(sx, sy, w, h)
  const center = sampleColorAt(canvas, cx, cy)
  return {
    pixels,
    centerColor: center,
    sourceX: cx,
    sourceY: cy
  }
}

function buildFontSignatureCache(): Map<SupportedFont, ImageData> {
  const cache = new Map<SupportedFont, ImageData>()
  const size = FONT_ANALYSIS_SIZE
  const offscreen = document.createElement('canvas')
  offscreen.width = size
  offscreen.height = size
  const octx = offscreen.getContext('2d', { willReadFrequently: true })
  if (!octx) return cache
  for (const font of SUPPORTED_FONTS) {
    octx.clearRect(0, 0, size, size)
    octx.fillStyle = '#ffffff'
    octx.fillRect(0, 0, size, size)
    octx.fillStyle = '#000000'
    octx.textBaseline = 'middle'
    octx.textAlign = 'center'
    const fontSize = Math.round(size * 0.55)
    octx.font = `${fontSize}px "${font}", sans-serif`
    octx.fillText('aA永', size / 2, size / 2)
    const img = octx.getImageData(0, 0, size, size)
    cache.set(font, img)
  }
  return cache
}

let _fontSigCache: Map<SupportedFont, ImageData> | null = null
function getFontSigCache(): Map<SupportedFont, ImageData> {
  if (!_fontSigCache) {
    _fontSigCache = buildFontSignatureCache()
  }
  return _fontSigCache
}

function computeBrightnessHistogram(imgData: ImageData): number[] {
  const hist = new Array(16).fill(0)
  const d = imgData.data
  const total = imgData.width * imgData.height
  for (let i = 0; i < total; i++) {
    const idx = i * 4
    const r = d[idx], g = d[idx + 1], b = d[idx + 2]
    const lum = Math.round((0.299 * r + 0.587 * g + 0.114 * b) / 16)
    hist[clamp(lum, 0, 15)]++
  }
  return hist
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0
  const len = Math.min(a.length, b.length)
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }
  if (magA === 0 || magB === 0) return 0
  return dot / (Math.sqrt(magA) * Math.sqrt(magB))
}

function identifyFont(regionImg: ImageData): SupportedFont {
  const cache = getFontSigCache()
  const targetHist = computeBrightnessHistogram(regionImg)
  let bestFont: SupportedFont = 'Source Han Sans'
  let bestScore = -1
  for (const font of SUPPORTED_FONTS) {
    const sig = cache.get(font)
    if (!sig) continue
    const sigHist = computeBrightnessHistogram(sig)
    const score = cosineSimilarity(targetHist, sigHist)
    if (score > bestScore) {
      bestScore = score
      bestFont = font
    }
  }
  return bestFont
}

function sobelEdgeDensity(imgData: ImageData): { density: number; avgVerticalSpacing: number } {
  const w = imgData.width
  const h = imgData.height
  const gray = new Float32Array(w * h)
  const d = imgData.data
  for (let i = 0; i < w * h; i++) {
    const idx = i * 4
    gray[i] = 0.299 * d[idx] + 0.587 * d[idx + 1] + 0.114 * d[idx + 2]
  }
  const edges: boolean[] = new Array(w * h).fill(false)
  let edgeCount = 0
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const tl = gray[(y - 1) * w + (x - 1)]
      const tc = gray[(y - 1) * w + x]
      const tr = gray[(y - 1) * w + (x + 1)]
      const ml = gray[y * w + (x - 1)]
      const mr = gray[y * w + (x + 1)]
      const bl = gray[(y + 1) * w + (x - 1)]
      const bc = gray[(y + 1) * w + x]
      const br = gray[(y + 1) * w + (x + 1)]
      const gx = -tl - 2 * ml - bl + tr + 2 * mr + br
      const gy = -tl - 2 * tc - tr + bl + 2 * bc + br
      const mag = Math.sqrt(gx * gx + gy * gy)
      if (mag > 50) {
        edges[y * w + x] = true
        edgeCount++
      }
    }
  }
  const total = (w - 2) * (h - 2)
  const density = total > 0 ? edgeCount / total : 0

  const verticalSpacings: number[] = []
  for (let y = 1; y < h - 1; y++) {
    let lastEdge = -1
    for (let x = 1; x < w - 1; x++) {
      if (edges[y * w + x]) {
        if (lastEdge >= 0) {
          const spacing = x - lastEdge
          if (spacing >= 1 && spacing <= 15) {
            verticalSpacings.push(spacing)
          }
        }
        lastEdge = x
      }
    }
  }
  let avgVerticalSpacing = 0
  if (verticalSpacings.length > 0) {
    avgVerticalSpacing = verticalSpacings.reduce((s, v) => s + v, 0) / verticalSpacings.length
  }
  return { density, avgVerticalSpacing }
}

function estimateFontSize(imgData: ImageData): number {
  const { density, avgVerticalSpacing } = sobelEdgeDensity(imgData)
  if (density < 0.02) return 14
  const strokeWidth = avgVerticalSpacing > 0 ? avgVerticalSpacing : 1.5
  let fontSize = Math.round(strokeWidth * 8 + 4)
  if (density > 0.15) fontSize += 2
  if (density < 0.05) fontSize = Math.max(10, fontSize - 2)
  return clamp(fontSize, 10, 72)
}

function getRegionImageData(canvas: HTMLCanvasElement, x: number, y: number): ImageData {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return new ImageData(FONT_ANALYSIS_SIZE, FONT_ANALYSIS_SIZE)
  const half = Math.floor(FONT_ANALYSIS_SIZE / 2)
  const sx = clamp(Math.round(x) - half, 0, canvas.width - FONT_ANALYSIS_SIZE)
  const sy = clamp(Math.round(y) - half, 0, canvas.height - FONT_ANALYSIS_SIZE)
  return ctx.getImageData(sx, sy, FONT_ANALYSIS_SIZE, FONT_ANALYSIS_SIZE)
}

export function extractStyle(canvas: HTMLCanvasElement, x: number, y: number): StyleEntry {
  const cx = clamp(Math.round(x), 0, canvas.width - 1)
  const cy = clamp(Math.round(y), 0, canvas.height - 1)
  const rgb = sampleColorAt(canvas, cx, cy)
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b)
  const regionImg = getRegionImageData(canvas, cx, cy)
  const fontName = identifyFont(regionImg)
  const fontSize = estimateFontSize(regionImg)
  return {
    id: generateId(),
    hex,
    rgb,
    fontName,
    fontSize,
    timestamp: Date.now(),
    pixelX: cx,
    pixelY: cy
  }
}
