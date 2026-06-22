
export interface ColorStop {
  position: number
  color: string
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 0, g: 0, b: 0 }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function interpolateColor(stops: ColorStop[], t: number): { r: number; g: number; b: number } {
  const sorted = [...stops].sort((a, b) => a.position - b.position)

  if (t <= sorted[0].position) return hexToRgb(sorted[0].color)
  if (t >= sorted[sorted.length - 1].position) return hexToRgb(sorted[sorted.length - 1].color)

  for (let i = 0; i < sorted.length - 1; i++) {
    if (t >= sorted[i].position && t <= sorted[i + 1].position) {
      const range = sorted[i + 1].position - sorted[i].position
      const localT = range === 0 ? 0 : (t - sorted[i].position) / range
      const c1 = hexToRgb(sorted[i].color)
      const c2 = hexToRgb(sorted[i + 1].color)
      return {
        r: Math.round(lerp(c1.r, c2.r, localT)),
        g: Math.round(lerp(c1.g, c2.g, localT)),
        b: Math.round(lerp(c1.b, c2.b, localT))
      }
    }
  }
  return hexToRgb(sorted[0].color)
}

export function renderToCanvas(
  canvas: HTMLCanvasElement,
  noiseData: Float32Array,
  colorStops: ColorStop[],
  fadeProgress: number = 1
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const width = canvas.width
  const height = canvas.height
  const imageData = ctx.createImageData(width, height)
  const data = imageData.data

  const whiteR = 255
  const whiteG = 255
  const whiteB = 255

  for (let i = 0; i < noiseData.length; i++) {
    const noiseValue = noiseData[i]
    const color = interpolateColor(colorStops, noiseValue)
    const pixelIndex = i * 4

    const r = Math.round(lerp(whiteR, color.r, fadeProgress))
    const g = Math.round(lerp(whiteG, color.g, fadeProgress))
    const b = Math.round(lerp(whiteB, color.b, fadeProgress))

    data[pixelIndex] = r
    data[pixelIndex + 1] = g
    data[pixelIndex + 2] = b
    data[pixelIndex + 3] = 255
  }

  ctx.putImageData(imageData, 0, 0)
}

export function generateGradientStrip(stops: ColorStop[], width: number, height: number): string {
  const sorted = [...stops].sort((a, b) => a.position - b.position)
  const parts = sorted.map(s => `${s.color} ${s.position * 100}%`)
  return `linear-gradient(to right, ${parts.join(', ')})`
}

export function canvasToSVG(canvas: HTMLCanvasElement): string {
  const dataUrl = canvas.toDataURL('image/png')
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">
  <image width="${canvas.width}" height="${canvas.height}" xlink:href="${dataUrl}"/>
</svg>`
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
