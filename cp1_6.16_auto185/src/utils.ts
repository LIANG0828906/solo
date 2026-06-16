export interface DataPoint {
  id: string
  values: number[]
  label?: string
}

export interface Point3D {
  x: number
  y: number
  z: number
}

export const parseCSV = (csvText: string): DataPoint[] => {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return []

  const dataLines = lines.slice(1).filter(line => line.trim().length > 0)
  const maxRows = Math.min(dataLines.length, 500)

  const dataPoints: DataPoint[] = []

  for (let i = 0; i < maxRows; i++) {
    const values = dataLines[i]
      .split(',')
      .map(v => parseFloat(v.trim()))
      .filter(v => !isNaN(v))

    if (values.length > 0) {
      const limitedValues = values.slice(0, 10)
      dataPoints.push({
        id: `point-${i}-${Math.random().toString(36).substr(2, 9)}`,
        values: limitedValues
      })
    }
  }

  return dataPoints
}

export const zScoreNormalize = (data: DataPoint[]): number[][] => {
  if (data.length === 0) return []

  const numFeatures = data[0].values.length
  const means: number[] = new Array(numFeatures).fill(0)
  const stds: number[] = new Array(numFeatures).fill(0)

  for (let j = 0; j < numFeatures; j++) {
    let sum = 0
    for (let i = 0; i < data.length; i++) {
      sum += data[i].values[j] || 0
    }
    means[j] = sum / data.length
  }

  for (let j = 0; j < numFeatures; j++) {
    let sumSq = 0
    for (let i = 0; i < data.length; i++) {
      const diff = (data[i].values[j] || 0) - means[j]
      sumSq += diff * diff
    }
    stds[j] = Math.sqrt(sumSq / data.length) || 1
  }

  return data.map(point => {
    return point.values.map((v, j) => ((v || 0) - means[j]) / stds[j])
  })
}

export const simplifiedTSNE = (
  normalizedData: number[][],
  dimensions: number = 3,
  perplexity: number = 30,
  maxIterations: number = 200,
  onProgress?: (progress: number) => void
): Point3D[] => {
  const n = normalizedData.length
  if (n === 0) return []

  const points: Point3D[] = []
  const spread = 2

  for (let i = 0; i < n; i++) {
    points.push({
      x: (Math.random() - 0.5) * spread,
      y: (Math.random() - 0.5) * spread,
      z: (Math.random() - 0.5) * spread
    })
  }

  const distances: number[][] = []
  for (let i = 0; i < n; i++) {
    distances[i] = []
    for (let j = 0; j < n; j++) {
      if (i === j) {
        distances[i][j] = 0
      } else {
        let dist = 0
        const len = Math.min(normalizedData[i].length, normalizedData[j].length)
        for (let k = 0; k < len; k++) {
          const diff = normalizedData[i][k] - normalizedData[j][k]
          dist += diff * diff
        }
        distances[i][j] = Math.sqrt(dist)
      }
    }
  }

  const P: number[][] = []
  for (let i = 0; i < n; i++) {
    P[i] = new Array(n).fill(0)
  }

  for (let i = 0; i < n; i++) {
    const sortedIndices = distances[i]
      .map((d, idx) => ({ d, idx }))
      .sort((a, b) => a.d - b.d)
      .slice(1, Math.min(perplexity + 1, n))
      .map(item => item.idx)

    const sigma = distances[i][sortedIndices[sortedIndices.length - 1]] || 1
    let sumP = 0

    for (const j of sortedIndices) {
      P[i][j] = Math.exp(-distances[i][j] * distances[i][j] / (2 * sigma * sigma))
      sumP += P[i][j]
    }

    if (sumP > 0) {
      for (const j of sortedIndices) {
        P[i][j] /= sumP
      }
    }
  }

  const learningRate = Math.max(50, n / 12)
  const momentum = 0.8
  const finalMomentum = 0.9

  const velocity: Point3D[] = points.map(() => ({ x: 0, y: 0, z: 0 }))
  const gain: Point3D[] = points.map(() => ({ x: 1, y: 1, z: 1 }))

  for (let iter = 0; iter < maxIterations; iter++) {
    if (onProgress) {
      onProgress(iter / maxIterations)
    }

    const Q: number[][] = []
    const QPoints: Point3D[][] = []
    let sumQ = 0

    for (let i = 0; i < n; i++) {
      Q[i] = new Array(n).fill(0)
      QPoints[i] = []
      for (let j = 0; j < n; j++) {
        QPoints[i][j] = { x: 0, y: 0, z: 0 }
        if (i !== j) {
          const dx = points[i].x - points[j].x
          const dy = points[i].y - points[j].y
          const dz = points[i].z - points[j].z
          const distSq = dx * dx + dy * dy + dz * dz
          Q[i][j] = 1 / (1 + distSq)
          sumQ += Q[i][j]
          QPoints[i][j] = { x: dx, y: dy, z: dz }
        }
      }
    }

    if (sumQ === 0) sumQ = 1

    for (let i = 0; i < n; i++) {
      let gradX = 0, gradY = 0, gradZ = 0

      for (let j = 0; j < n; j++) {
        if (i === j) continue

        const pij = P[i][j] || 0
        const pji = P[j][i] || 0
        const qij = Q[i][j] / sumQ

        const factor = (pij + pji - qij) * Q[i][j]

        gradX += factor * QPoints[i][j].x
        gradY += factor * QPoints[i][j].y
        gradZ += factor * QPoints[i][j].z
      }

      gradX *= 4
      gradY *= 4
      gradZ *= 4

      const currentMomentum = iter < 20 ? momentum : finalMomentum

      gain[i].x = (gradX > 0) === (velocity[i].x > 0) ? gain[i].x * 0.8 : gain[i].x + 0.2
      gain[i].y = (gradY > 0) === (velocity[i].y > 0) ? gain[i].y * 0.8 : gain[i].y + 0.2
      gain[i].z = (gradZ > 0) === (velocity[i].z > 0) ? gain[i].z * 0.8 : gain[i].z + 0.2

      gain[i].x = Math.max(gain[i].x, 0.01)
      gain[i].y = Math.max(gain[i].y, 0.01)
      gain[i].z = Math.max(gain[i].z, 0.01)

      velocity[i].x = currentMomentum * velocity[i].x - learningRate * gain[i].x * gradX
      velocity[i].y = currentMomentum * velocity[i].y - learningRate * gain[i].y * gradY
      velocity[i].z = currentMomentum * velocity[i].z - learningRate * gain[i].z * gradZ

      points[i].x += velocity[i].x
      points[i].y += velocity[i].y
      points[i].z += velocity[i].z
    }
  }

  if (onProgress) {
    onProgress(1)
  }

  let maxAbs = 0
  for (const p of points) {
    maxAbs = Math.max(maxAbs, Math.abs(p.x), Math.abs(p.y), Math.abs(p.z))
  }
  if (maxAbs > 0) {
    const scale = 3 / maxAbs
    for (const p of points) {
      p.x *= scale
      p.y *= scale
      p.z *= scale
    }
  }

  return points
}

export const getHSLColor = (index: number, total: number): string => {
  const hue = (index / Math.max(total, 1)) * 360
  return `hsl(${hue}, 70%, 60%)`
}

export const getLabelColor = (label?: string): string => {
  switch (label) {
    case '正常':
      return '#00FF88'
    case '异常':
      return '#FF4500'
    default:
      return ''
  }
}

export const pointInPolygon = (
  px: number,
  py: number,
  polygon: { x: number; y: number }[]
): boolean => {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y
    const xj = polygon[j].x, yj = polygon[j].y

    if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
      inside = !inside
    }
  }
  return inside
}

export const pointInRectangle = (
  px: number,
  py: number,
  rect: { x1: number; y1: number; x2: number; y2: number }
): boolean => {
  const minX = Math.min(rect.x1, rect.x2)
  const maxX = Math.max(rect.x1, rect.x2)
  const minY = Math.min(rect.y1, rect.y2)
  const maxY = Math.max(rect.y1, rect.y2)
  return px >= minX && px <= maxX && py >= minY && py <= maxY
}
