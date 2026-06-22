import ColorThief from 'colorthief'

export interface HSL {
  h: number
  s: number
  l: number
}

export interface ColorToken {
  hex: string
  rgb: [number, number, number]
  hsl: HSL
  ratio: number
}

export interface FontToken {
  size: number
  sampleText: string
}

export interface SpacingToken {
  value: number
  label: string
}

export interface DesignTokens {
  primaryColors: ColorToken[]
  secondaryColors: ColorToken[]
  fonts: FontToken[]
  spacings: SpacingToken[]
  thumbnailUrl: string
}

const colorThief = new ColorThief()

export function rgbToHex(rgb: [number, number, number]): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  return `#${toHex(rgb[0])}${toHex(rgb[1])}${toHex(rgb[2])}`.toUpperCase()
}

export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return [102, 126, 234]
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ]
}

export function rgbToHsl(rgb: [number, number, number]): HSL {
  const r = rgb[0] / 255
  const g = rgb[1] / 255
  const b = rgb[2] / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

export function hslToRgb(hsl: HSL): [number, number, number] {
  const h = hsl.h / 360
  const s = hsl.s / 100
  const l = hsl.l / 100

  if (s === 0) {
    const val = Math.round(l * 255)
    return [val, val, val]
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q

  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ]
}

export function hslToHex(hsl: HSL): string {
  return rgbToHex(hslToRgb(hsl))
}

export function sortByHue(colors: ColorToken[]): ColorToken[] {
  return [...colors].sort((a, b) => {
    if (a.hsl.s < 10 && b.hsl.s >= 10) return 1
    if (a.hsl.s >= 10 && b.hsl.s < 10) return -1
    return a.hsl.h - b.hsl.h
  })
}

function colorDistance(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const dr = rgb1[0] - rgb2[0]
  const dg = rgb1[1] - rgb2[1]
  const db = rgb1[2] - rgb2[2]
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

function buildColorToken(
  rgb: [number, number, number],
  ratio: number,
): ColorToken {
  return {
    hex: rgbToHex(rgb),
    rgb,
    hsl: rgbToHsl(rgb),
    ratio,
  }
}

export function extractColors(
  imageData: ImageData,
): { primary: ColorToken[]; secondary: ColorToken[] } {
  const canvas = document.createElement('canvas')
  const maxSize = 400
  const scale = Math.min(maxSize / imageData.width, maxSize / imageData.height, 1)
  const w = Math.round(imageData.width * scale)
  const h = Math.round(imageData.height * scale)
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return { primary: [], secondary: [] }
  }

  const tmpCanvas = document.createElement('canvas')
  tmpCanvas.width = imageData.width
  tmpCanvas.height = imageData.height
  const tmpCtx = tmpCanvas.getContext('2d')
  if (tmpCtx) {
    tmpCtx.putImageData(imageData, 0, 0)
  }
  ctx.drawImage(tmpCanvas, 0, 0, w, h)

  try {
    const palette = colorThief.getPaletteFromImageData(ctx.getImageData(0, 0, w, h), 16, 10) as [number, number, number][]

    const totalPixels = w * h
    const data = ctx.getImageData(0, 0, w, h).data

    const colorCounts = new Map<string, { rgb: [number, number, number]; count: number }>()

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const key = `${Math.floor(r / 10) * 10},${Math.floor(g / 10) * 10},${Math.floor(b / 10) * 10}`
      const existing = colorCounts.get(key)
      if (existing) {
        existing.count++
        existing.rgb = [
          (existing.rgb[0] * (existing.count - 1) + r) / existing.count,
          (existing.rgb[1] * (existing.count - 1) + g) / existing.count,
          (existing.rgb[2] * (existing.count - 1) + b) / existing.count,
        ]
      } else {
        colorCounts.set(key, { rgb: [r, g, b], count: 1 })
      }
    }

    const paletteWithRatio = palette.map((rgb) => {
      let maxCount = 0
      for (const { rgb: bucketRgb, count } of colorCounts.values()) {
        if (colorDistance(rgb, bucketRgb.map(Math.round) as [number, number, number]) < 40) {
          maxCount = Math.max(maxCount, count)
        }
      }
      const ratio = maxCount / totalPixels
      return buildColorToken(rgb.map(Math.round) as [number, number, number], ratio)
    })

    paletteWithRatio.sort((a, b) => b.ratio - a.ratio)

    const uniqueColors: ColorToken[] = []
    for (const color of paletteWithRatio) {
      const isDuplicate = uniqueColors.some(
        (c) => colorDistance(c.rgb, color.rgb) < 35,
      )
      if (!isDuplicate) {
        uniqueColors.push(color)
      }
    }

    const primary = sortByHue(
      uniqueColors.filter((c) => c.ratio > 0.15).slice(0, 6),
    )
    const secondary = sortByHue(
      uniqueColors.filter((c) => c.ratio >= 0.05 && c.ratio <= 0.15).slice(0, 4),
    )

    if (primary.length === 0 && uniqueColors.length > 0) {
      primary.push(...uniqueColors.slice(0, Math.min(6, uniqueColors.length)))
    }
    if (secondary.length === 0 && uniqueColors.length > primary.length) {
      secondary.push(...uniqueColors.slice(primary.length, primary.length + Math.min(4, uniqueColors.length - primary.length)))
    }

    return { primary, secondary }
  } catch {
    const fallbackPrimary = buildColorToken([102, 126, 234], 0.3)
    const fallbackSecondary = buildColorToken([118, 75, 162], 0.1)
    return { primary: [fallbackPrimary], secondary: [fallbackSecondary] }
  }
}

export function extractFontsAndSpacings(
  imageData: ImageData,
): { fonts: FontToken[]; spacings: SpacingToken[] } {
  const w = imageData.width
  const h = imageData.height
  const data = imageData.data

  const edgeMap = new Uint8Array(w * h)
  const grayscale = new Uint8Array(w * h)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]
      grayscale[y * w + x] = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
    }
  }

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const gx =
        -grayscale[(y - 1) * w + (x - 1)] +
        grayscale[(y - 1) * w + (x + 1)] +
        -2 * grayscale[y * w + (x - 1)] +
        2 * grayscale[y * w + (x + 1)] +
        -grayscale[(y + 1) * w + (x - 1)] +
        grayscale[(y + 1) * w + (x + 1)]

      const gy =
        -grayscale[(y - 1) * w + (x - 1)] +
        -2 * grayscale[(y - 1) * w + x] +
        -grayscale[(y - 1) * w + (x + 1)] +
        grayscale[(y + 1) * w + (x - 1)] +
        2 * grayscale[(y + 1) * w + x] +
        grayscale[(y + 1) * w + (x + 1)]

      const magnitude = Math.sqrt(gx * gx + gy * gy)
      edgeMap[y * w + x] = magnitude > 30 ? 1 : 0
    }
  }

  const textHeights: number[] = []
  for (let y = 0; y < h; y++) {
    let edgeCount = 0
    for (let x = 0; x < w; x++) {
      edgeCount += edgeMap[y * w + x]
    }
    if (edgeCount / w > 0.03) {
      let endY = y
      while (endY < h - 1) {
        let nextCount = 0
        for (let x = 0; x < w; x++) {
          nextCount += edgeMap[endY * w + x]
        }
        if (nextCount / w <= 0.02) break
        endY++
      }
      const blockHeight = endY - y + 1
      if (blockHeight >= 8 && blockHeight <= 200) {
        textHeights.push(blockHeight)
      }
      y = endY
    }
  }

  const heightCounts = new Map<number, number>()
  for (const th of textHeights) {
    const bucket = Math.round(th / 4) * 4
    heightCounts.set(bucket, (heightCounts.get(bucket) || 0) + 1)
  }
  const sortedHeights = Array.from(heightCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map((e) => e[0])
    .slice(0, 3)
    .sort((a, b) => a - b)

  const defaultFontSizes = [14, 18, 24]
  const fonts: FontToken[] = (sortedHeights.length > 0 ? sortedHeights : defaultFontSizes).map((size) => ({
    size,
    sampleText: 'Aa',
  }))

  const spacingsList: number[] = []
  for (let y = 0; y < h; y++) {
    let hasEdge = false
    for (let x = 0; x < w; x++) {
      if (edgeMap[y * w + x]) {
        hasEdge = true
        break
      }
    }
    if (!hasEdge) {
      let endY = y
      while (endY < h - 1) {
        let nextEdge = false
        for (let x = 0; x < w; x++) {
          if (edgeMap[endY * w + x]) {
            nextEdge = true
            break
          }
        }
        if (nextEdge) break
        endY++
      }
      const gap = endY - y + 1
      if (gap >= 4 && gap <= 120) {
        spacingsList.push(gap)
      }
      y = endY
    }
  }

  const spacingCounts = new Map<number, number>()
  for (const sp of spacingsList) {
    const bucket = Math.round(sp / 4) * 4
    spacingCounts.set(bucket, (spacingCounts.get(bucket) || 0) + 1)
  }
  const sortedSpacings = Array.from(spacingCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map((e) => e[0])
    .slice(0, 5)
    .sort((a, b) => a - b)

  const defaultSpacings = [8, 12, 16, 24, 32]
  const spacings: SpacingToken[] = (sortedSpacings.length > 0 ? sortedSpacings : defaultSpacings).map(
    (value, i) => ({
      value,
      label: `spacing-${i + 1}`,
    }),
  )

  return { fonts, spacings }
}

export async function extractDesignTokens(
  imageData: ImageData,
  thumbnailUrl: string,
): Promise<DesignTokens> {
  await new Promise((r) => setTimeout(r, 50))

  const { primary, secondary } = extractColors(imageData)
  const { fonts, spacings } = extractFontsAndSpacings(imageData)

  return {
    primaryColors: primary,
    secondaryColors: secondary,
    fonts,
    spacings,
    thumbnailUrl,
  }
}
