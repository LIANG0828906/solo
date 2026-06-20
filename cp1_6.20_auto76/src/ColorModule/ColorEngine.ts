import type { WorkerRequest, WorkerResponse, ColorParams } from './types'

const ctx: Worker = self as unknown as Worker

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
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

  return [h * 360, s * 100, l * 100]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360
  s /= 100
  l /= 100
  let r, g, b

  if (s === 0) {
    r = g = b = l
  } else {
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
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0]
}

function analyzeImage(imageData: ImageData): {
  dominantColors: string[]
  histogram: number[]
  rgbAverage: { r: number; g: number; b: number }
} {
  const data = imageData.data
  const colorMap = new Map<string, number>()
  const histogram = new Array(64).fill(0)
  let rSum = 0
  let gSum = 0
  let bSum = 0
  const pixelCount = data.length / 4

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    rSum += r
    gSum += g
    bSum += b

    const bucketR = Math.floor(r / 64)
    const bucketG = Math.floor(g / 64)
    const bucketB = Math.floor(b / 64)
    const bucketIndex = bucketR * 16 + bucketG * 4 + bucketB
    histogram[bucketIndex]++

    const key = `${Math.floor(r / 16)}-${Math.floor(g / 16)}-${Math.floor(b / 16)}`
    colorMap.set(key, (colorMap.get(key) || 0) + 1)
  }

  const sortedColors = Array.from(colorMap.entries()).sort((a, b) => b[1] - a[1])
  const dominantColors: string[] = []

  for (const [key] of sortedColors) {
    if (dominantColors.length >= 5) break
    const [r, g, b] = key.split('-').map((x) => parseInt(x) * 16 + 8)
    dominantColors.push(rgbToHex(Math.min(255, r), Math.min(255, g), Math.min(255, b)))
  }

  while (dominantColors.length < 5) {
    dominantColors.push('#808080')
  }

  return {
    dominantColors,
    histogram,
    rgbAverage: {
      r: Math.round(rSum / pixelCount),
      g: Math.round(gSum / pixelCount),
      b: Math.round(bSum / pixelCount),
    },
  }
}

function applyFilter(imageData: ImageData, params: ColorParams): ImageData {
  const data = imageData.data
  const { hueRotate, saturation, brightness, contrast } = params

  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast))
  const brightnessOffset = brightness * 2.55

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i]
    let g = data[i + 1]
    let b = data[i + 2]

    let [h, s, l] = rgbToHsl(r, g, b)

    h = (h + hueRotate + 360) % 360
    s = Math.max(0, Math.min(100, s + saturation))

    ;[r, g, b] = hslToRgb(h, s, l)

    r = contrastFactor * (r - 128) + 128 + brightnessOffset
    g = contrastFactor * (g - 128) + 128 + brightnessOffset
    b = contrastFactor * (b - 128) + 128 + brightnessOffset

    data[i] = Math.max(0, Math.min(255, r))
    data[i + 1] = Math.max(0, Math.min(255, g))
    data[i + 2] = Math.max(0, Math.min(255, b))
  }

  return imageData
}

function generateColorMatrix(params: ColorParams): number[][] {
  const { hueRotate, saturation, brightness, contrast } = params

  const h = (hueRotate * Math.PI) / 180
  const cos = Math.cos(h)
  const sin = Math.sin(h)

  const lumR = 0.2126
  const lumG = 0.7152
  const lumB = 0.0722

  const hueMatrix: number[][] = [
    [lumR + cos * (1 - lumR) + sin * (-lumR), lumG + cos * (-lumG) + sin * (-lumG), lumB + cos * (-lumB) + sin * (1 - lumB)],
    [lumR + cos * (-lumR) + sin * (0.143), lumG + cos * (1 - lumG) + sin * (0.14), lumB + cos * (-lumB) + sin * (-0.283)],
    [lumR + cos * (-lumR) + sin * (-(1 - lumR)), lumG + cos * (-lumG) + sin * (lumG), lumB + cos * (1 - lumB) + sin * (lumB)],
  ]

  const satFactor = 1 + saturation / 100
  const satMatrix: number[][] = [
    [lumR * (1 - satFactor) + satFactor, lumG * (1 - satFactor), lumB * (1 - satFactor)],
    [lumR * (1 - satFactor), lumG * (1 - satFactor) + satFactor, lumB * (1 - satFactor)],
    [lumR * (1 - satFactor), lumG * (1 - satFactor), lumB * (1 - satFactor) + satFactor],
  ]

  const contFactor = (contrast / 100) + 1
  const brightOffset = brightness / 100

  const result: number[][] = []
  for (let i = 0; i < 3; i++) {
    result[i] = []
    for (let j = 0; j < 3; j++) {
      let val = 0
      for (let k = 0; k < 3; k++) {
        val += hueMatrix[i][k] * satMatrix[k][j]
      }
      result[i][j] = Math.round(val * contFactor * 1000) / 1000
    }
  }

  return result
}

function generateCSSFilter(params: ColorParams): string {
  const filters: string[] = []

  if (params.hueRotate !== 0) {
    filters.push(`hue-rotate(${params.hueRotate}deg)`)
  }
  if (params.saturation !== 0) {
    const satValue = 100 + params.saturation
    filters.push(`saturate(${satValue}%)`)
  }
  if (params.brightness !== 0) {
    const brightValue = 100 + params.brightness
    filters.push(`brightness(${brightValue}%)`)
  }
  if (params.contrast !== 0) {
    const contrastValue = 100 + params.contrast
    filters.push(`contrast(${contrastValue}%)`)
  }

  return filters.length > 0 ? filters.join(' ') : 'none'
}

ctx.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { type, payload } = e.data

  switch (type) {
    case 'analyzeImage': {
      const result = analyzeImage(payload.imageData)
      const response: WorkerResponse = {
        type: 'imageAnalyzed',
        payload: {
          id: payload.id,
          ...result,
        },
      }
      ctx.postMessage(response)
      break
    }

    case 'applyFilter': {
      const processed = applyFilter(payload.imageData, payload.params)
      const response: WorkerResponse = {
        type: 'filterApplied',
        payload: {
          id: payload.id,
          processedData: processed,
        },
      }
      ctx.postMessage(response, [processed.data.buffer])
      break
    }

    case 'generateMatrix': {
      const matrix = generateColorMatrix(payload.params)
      const response: WorkerResponse = {
        type: 'matrixGenerated',
        payload: { matrix },
      }
      ctx.postMessage(response)
      break
    }

    case 'generateCSS': {
      const css = generateCSSFilter(payload.params)
      const response: WorkerResponse = {
        type: 'cssGenerated',
        payload: { css },
      }
      ctx.postMessage(response)
      break
    }
  }
}

export default ctx
