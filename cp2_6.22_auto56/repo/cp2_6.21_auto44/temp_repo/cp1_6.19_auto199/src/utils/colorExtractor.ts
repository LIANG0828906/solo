import type { ColorFilter } from '../store/photoStore'

export interface HSL {
  h: number
  s: number
  l: number
}

export interface DominantColor extends HSL {
  hex: string
  name: ColorFilter
}

const rgbToHsl = (r: number, g: number, b: number): HSL => {
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

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

const hslToHex = (h: number, s: number, l: number): string => {
  s /= 100
  l /= 100

  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0')
  }

  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase()
}

const matchColorFilter = (h: number, s: number, l: number): { name: ColorFilter; hex: string } => {
  if (s < 15 || l < 15 || l > 85) {
    return { name: 'gray', hex: '#616161' }
  }

  if (h >= 345 || h < 15) return { name: 'red', hex: '#D32F2F' }
  if (h >= 15 && h < 45) return { name: 'orange', hex: '#FF6F00' }
  if (h >= 45 && h < 75) return { name: 'yellow', hex: '#FBC02D' }
  if (h >= 75 && h < 160) return { name: 'green', hex: '#388E3C' }
  if (h >= 160 && h < 240) return { name: 'blue', hex: '#1976D2' }
  if (h >= 240 && h < 290) return { name: 'purple', hex: '#7B1FA2' }
  if (h >= 290 && h < 345) return { name: 'pink', hex: '#C2185B' }

  return { name: 'gray', hex: '#616161' }
}

export const extractDominantColor = (imageData: ImageData): DominantColor => {
  const { data, width, height } = imageData
  const pixelCount = width * height
  const bins = new Map<number, { count: number; h: number; s: number; l: number }>()
  const binSize = 15

  for (let i = 0; i < pixelCount; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = data[i + 3]

    if (a < 128) continue

    const hsl = rgbToHsl(r, g, b)

    if (hsl.s < 15 || hsl.l < 10 || hsl.l > 90) continue

    const binIndex = Math.floor(hsl.h / binSize)
    const bin = bins.get(binIndex)

    if (bin) {
      bin.count++
      bin.h += hsl.h
      bin.s += hsl.s
      bin.l += hsl.l
    } else {
      bins.set(binIndex, {
        count: 1,
        h: hsl.h,
        s: hsl.s,
        l: hsl.l,
      })
    }
  }

  if (bins.size === 0) {
    const { name, hex } = matchColorFilter(0, 0, 50)
    return { h: 0, s: 0, l: 50, hex, name }
  }

  let dominantBin = bins.values().next().value!
  for (const bin of bins.values()) {
    if (bin.count > dominantBin.count) {
      dominantBin = bin
    }
  }

  const avgH = Math.round(dominantBin.h / dominantBin.count)
  const avgS = Math.round(dominantBin.s / dominantBin.count)
  const avgL = Math.round(dominantBin.l / dominantBin.count)

  const { name, hex } = matchColorFilter(avgH, avgS, avgL)

  return {
    h: avgH,
    s: avgS,
    l: avgL,
    hex,
    name,
  }
}

export const getImageDataFromImage = (img: HTMLImageElement): ImageData => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!

  const maxSize = 100
  const scale = Math.min(maxSize / img.width, maxSize / img.height, 1)
  canvas.width = Math.max(1, Math.floor(img.width * scale))
  canvas.height = Math.max(1, Math.floor(img.height * scale))

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return ctx.getImageData(0, 0, canvas.width, canvas.height)
}
