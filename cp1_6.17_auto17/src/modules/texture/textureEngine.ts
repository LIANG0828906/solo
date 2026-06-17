import type { WrinkleStats, WrinkleGridPoint } from '../../types'
import { loadImage } from '../camera/cameraUtils'

const GRID_SPACING = 20

export function getGrayscale(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

export function mapIntensityToColor(
  grayscale: number,
  sensitivity: number
): { r: number; g: number; b: number; a: number } {
  const sensitivityFactor = 0.5 + sensitivity / 100
  const normalized = grayscale / 255
  const adjusted = Math.pow(normalized, sensitivityFactor)

  const wrinkleStrength = 1 - adjusted

  if (wrinkleStrength > 0.6) {
    const t = (wrinkleStrength - 0.6) / 0.4
    return {
      r: 229,
      g: Math.round(57 * (1 - t)),
      b: Math.round(53 * (1 - t)),
      a: 0.3 + 0.5 * t,
    }
  } else if (wrinkleStrength > 0.3) {
    const t = (wrinkleStrength - 0.3) / 0.3
    return {
      r: Math.round(30 + (229 - 30) * t),
      g: Math.round(136 + (57 - 136) * t),
      b: Math.round(229 + (53 - 229) * t),
      a: 0.2 + 0.2 * t,
    }
  } else {
    const t = wrinkleStrength / 0.3
    return {
      r: 30,
      g: 136,
      b: 229,
      a: 0.2 * t,
    }
  }
}

export async function calculateWrinkleData(
  imageSrc: string,
  sensitivity: number
): Promise<{ points: WrinkleGridPoint[]; stats: WrinkleStats }> {
  const sensitivityFactor = 0.5 + sensitivity / 100
  const img = await loadImage(imageSrc)
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建Canvas上下文')
  ctx.drawImage(img, 0, 0)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  const points: WrinkleGridPoint[] = []
  let totalIntensity = 0
  let pointCount = 0
  let maxIntensity = 0
  let maxX = 0
  let maxY = 0

  for (let y = GRID_SPACING; y < canvas.height; y += GRID_SPACING) {
    for (let x = GRID_SPACING; x < canvas.width; x += GRID_SPACING) {
      const idx = (y * canvas.width + x) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]
      const gray = getGrayscale(r, g, b)
      const normalizedGray = gray / 255
      const adjustedGray = Math.pow(normalizedGray, sensitivityFactor)
      const intensity = 1 - adjustedGray

      points.push({ x, y, intensity })

      totalIntensity += intensity
      pointCount++

      if (intensity > maxIntensity) {
        maxIntensity = intensity
        maxX = x
        maxY = y
      }
    }
  }

  const stats: WrinkleStats = {
    averageIntensity: pointCount > 0 ? (totalIntensity / pointCount) * 100 : 0,
    maxIntensity: maxIntensity * 100,
    maxWrinkleX: maxX,
    maxWrinkleY: maxY,
  }

  return { points, stats }
}

export function drawHeatmap(
  canvas: HTMLCanvasElement,
  imageSrc: string,
  sensitivity: number
): Promise<WrinkleStats> {
  return new Promise(async (resolve, reject) => {
    try {
      const { points, stats } = await calculateWrinkleData(imageSrc, sensitivity)
      const img = await loadImage(imageSrc)

      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('无法创建Canvas上下文'))
        return
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)

      for (const point of points) {
        const color = mapIntensityToColor((1 - point.intensity) * 255, sensitivity)
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`
        ctx.fillRect(point.x - GRID_SPACING / 2, point.y - GRID_SPACING / 2, GRID_SPACING, GRID_SPACING)
      }

      ctx.strokeStyle = 'rgba(229, 57, 53, 0.3)'
      ctx.lineWidth = 1
      for (let x = 0; x <= canvas.width; x += GRID_SPACING) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }
      for (let y = 0; y <= canvas.height; y += GRID_SPACING) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      resolve(stats)
    } catch (e) {
      reject(e)
    }
  })
}

export async function exportTextureImage(
  imageSrc: string,
  sensitivity: number,
  exportWidth = 1024,
  exportHeight = 768
): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = exportWidth
  canvas.height = exportHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建Canvas上下文')

  const img = await loadImage(imageSrc)
  const { points } = await calculateWrinkleData(imageSrc, sensitivity)

  ctx.fillStyle = '#F5F5F5'
  ctx.fillRect(0, 0, exportWidth, exportHeight)

  const scaleX = exportWidth / img.width
  const scaleY = exportHeight / img.height

  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = img.width
  tempCanvas.height = img.height
  const tempCtx = tempCanvas.getContext('2d')
  if (tempCtx) {
    tempCtx.drawImage(img, 0, 0)
  }

  ctx.drawImage(tempCanvas, 0, 0, exportWidth, exportHeight)

  const scaledSpacing = GRID_SPACING * Math.min(scaleX, scaleY)
  for (const point of points) {
    const px = point.x * scaleX
    const py = point.y * scaleY
    const color = mapIntensityToColor((1 - point.intensity) * 255, sensitivity)
    ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`
    ctx.fillRect(px - scaledSpacing / 2, py - scaledSpacing / 2, scaledSpacing, scaledSpacing)
  }

  ctx.strokeStyle = 'rgba(229, 57, 53, 0.3)'
  ctx.lineWidth = 1
  for (let x = 0; x <= exportWidth; x += scaledSpacing) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, exportHeight)
    ctx.stroke()
  }
  for (let y = 0; y <= exportHeight; y += scaledSpacing) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(exportWidth, y)
    ctx.stroke()
  }

  return canvas.toDataURL('image/png')
}
