import { ProfileData, ClickedPoint } from './store'

export function computeRowProfile(
  heights: Float32Array,
  clickedPoint: ClickedPoint,
  gridSize: number,
  terrainSize: number
): ProfileData {
  const { row, col } = clickedPoint
  const cellSize = terrainSize / (gridSize - 1)
  const distances: number[] = new Array(gridSize)
  const elevations: number[] = new Array(gridSize)

  let minElevation = Infinity
  let maxElevation = -Infinity

  for (let c = 0; c < gridSize; c++) {
    const idx = row * gridSize + c
    const h = heights[idx]
    distances[c] = c * cellSize
    elevations[c] = h
    if (h < minElevation) minElevation = h
    if (h > maxElevation) maxElevation = h
  }

  const pad = (maxElevation - minElevation) * 0.1 || 1
  minElevation -= pad
  maxElevation += pad

  return {
    distances,
    elevations,
    clickIndex: col,
    minElevation,
    maxElevation,
  }
}

export function smoothProfile(
  data: ProfileData,
  windowSize: number = 3
): ProfileData {
  const { elevations } = data
  const n = elevations.length
  const smoothed = new Array(n)

  for (let i = 0; i < n; i++) {
    let sum = 0
    let count = 0
    for (let j = Math.max(0, i - windowSize); j <= Math.min(n - 1, i + windowSize); j++) {
      const weight = 1 - Math.abs(i - j) / (windowSize + 1)
      sum += elevations[j] * weight
      count += weight
    }
    smoothed[i] = sum / count
  }

  return {
    ...data,
    elevations: smoothed,
  }
}
