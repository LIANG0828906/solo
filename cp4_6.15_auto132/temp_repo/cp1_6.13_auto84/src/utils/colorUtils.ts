export interface RGB {
  r: number
  g: number
  b: number
}

export interface HSL {
  h: number
  s: number
  l: number
}

export function rgbToHsl(r: number, g: number, b: number): HSL {
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

  return { h: h * 360, s: s * 100, l: l * 100 }
}

export function hslToRgb(h: number, s: number, l: number): RGB {
  h /= 360
  s /= 100
  l /= 100

  let r: number, g: number, b: number

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

  return { r: r * 255, g: g * 255, b: b * 255 }
}

export function getBrightness(r: number, g: number, b: number): number {
  return (r * 299 + g * 587 + b * 114) / 1000
}

export function mixColors(
  color1: RGB,
  color2: RGB,
  alpha: number
): RGB {
  return {
    r: Math.round(color1.r * alpha + color2.r * (1 - alpha)),
    g: Math.round(color1.g * alpha + color2.g * (1 - alpha)),
    b: Math.round(color1.b * alpha + color2.b * (1 - alpha)),
  }
}

export function rgbToString(rgb: RGB): string {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
}

export function extractMainColor(imageData: ImageData): RGB {
  const pixels = imageData.data
  const colorCount: Record<string, number> = {}
  let maxCount = 0
  let mainColor = { r: 0, g: 0, b: 0 }

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]
    const key = `${r},${g},${b}`

    colorCount[key] = (colorCount[key] || 0) + 1

    if (colorCount[key] > maxCount) {
      maxCount = colorCount[key]
      mainColor = { r, g, b }
    }
  }

  return mainColor
}

export function getPixelBrightness(imageData: ImageData, x: number, y: number): number {
  const index = (y * imageData.width + x) * 4
  return getBrightness(
    imageData.data[index],
    imageData.data[index + 1],
    imageData.data[index + 2]
  )
}

export function getAverageBrightness(
  imageData: ImageData,
  startX: number,
  startY: number,
  width: number,
  height: number
): number {
  let totalBrightness = 0
  let count = 0

  for (let y = startY; y < startY + height && y < imageData.height; y++) {
    for (let x = startX; x < startX + width && x < imageData.width; x++) {
      totalBrightness += getPixelBrightness(imageData, x, y)
      count++
    }
  }

  return count > 0 ? totalBrightness / count : 0
}
