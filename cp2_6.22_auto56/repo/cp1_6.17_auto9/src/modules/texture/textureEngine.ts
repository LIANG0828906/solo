import type { WrinkleStats } from '../../types'

export function computeWrinkleStats(
  imageData: ImageData,
  sensitivity: number
): WrinkleStats {
  const { width, height, data } = imageData
  let sum = 0
  let maxVal = 0
  let maxX = 0
  let maxY = 0
  let count = 0
  const sensFactor = sensitivity / 50

  for (let y = 0; y < height; y += 20) {
    for (let x = 0; x < width; x += 20) {
      const idx = (y * width + x) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]
      const gray = 0.299 * r + 0.587 * g + 0.114 * b
      const intensity = Math.max(0, Math.min(1, (255 - gray) / 255)) * sensFactor
      const clamped = Math.min(1, intensity)
      sum += clamped
      count++
      if (clamped > maxVal) {
        maxVal = clamped
        maxX = x
        maxY = y
      }
    }
  }

  return {
    averageIntensity: count > 0 ? (sum / count) * 100 : 0,
    maxIntensity: maxVal * 100,
    maxPosition: { x: maxX, y: maxY },
  }
}

export function renderHeatmap(
  canvas: HTMLCanvasElement,
  sourceCanvas: HTMLCanvasElement,
  sensitivity: number
): WrinkleStats {
  const ctx = canvas.getContext('2d')!
  const sourceCtx = sourceCanvas.getContext('2d')!
  const width = sourceCanvas.width
  const height = sourceCanvas.height
  canvas.width = width
  canvas.height = height
  ctx.clearRect(0, 0, width, height)

  const imageData = sourceCtx.getImageData(0, 0, width, height)
  const stats = computeWrinkleStats(imageData, sensitivity)
  const sensFactor = sensitivity / 50

  const gridSpacing = 20
  ctx.lineWidth = 1

  for (let y = 0; y < height; y += gridSpacing) {
    for (let x = 0; x < width; x += gridSpacing) {
      const idx = (y * width + x) * 4
      const r = imageData.data[idx]
      const g = imageData.data[idx + 1]
      const b = imageData.data[idx + 2]
      const gray = 0.299 * r + 0.587 * g + 0.114 * b
      let intensity = Math.max(0, Math.min(1, (255 - gray) / 255)) * sensFactor
      intensity = Math.min(1, intensity)

      const red = Math.round(229 * intensity + 30 * (1 - intensity))
      const green = Math.round(57 * intensity + 136 * (1 - intensity))
      const blue = Math.round(53 * intensity + 229 * (1 - intensity))
      const alpha = 0.2 + 0.6 * intensity

      ctx.strokeStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`
      ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha * 0.4})`

      ctx.strokeRect(x, y, gridSpacing, gridSpacing)
      ctx.fillRect(x, y, gridSpacing, gridSpacing)
    }
  }

  return stats
}
