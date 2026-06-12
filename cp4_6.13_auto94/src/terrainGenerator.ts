import { TerrainParams } from './store'

class PerlinNoise {
  private permutation: number[]

  constructor(seed: number = 12345) {
    this.permutation = this.generatePermutation(seed)
  }

  private generatePermutation(seed: number): number[] {
    const p: number[] = []
    for (let i = 0; i < 256; i++) p[i] = i
    let s = seed
    for (let i = 255; i > 0; i--) {
      s = (s * 9301 + 49297) % 233280
      const j = Math.floor((s / 233280) * (i + 1))
      ;[p[i], p[j]] = [p[j], p[i]]
    }
    return [...p, ...p]
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10)
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a)
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 3
    const u = h < 2 ? x : y
    const v = h < 2 ? y : x
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v)
  }

  noise2D(x: number, y: number): number {
    const X = Math.floor(x) & 255
    const Y = Math.floor(y) & 255
    x -= Math.floor(x)
    y -= Math.floor(y)
    const u = this.fade(x)
    const v = this.fade(y)
    const A = this.permutation[X] + Y
    const B = this.permutation[X + 1] + Y
    return this.lerp(
      this.lerp(this.grad(this.permutation[A], x, y), this.grad(this.permutation[B], x - 1, y), u),
      this.lerp(this.grad(this.permutation[A + 1], x, y - 1), this.grad(this.permutation[B + 1], x - 1, y - 1), u),
      v
    )
  }
}

const COLOR_STOPS = [
  { ratio: 0.0, r: 0x2d / 255, g: 0x5a / 255, b: 0x27 / 255 },
  { ratio: 0.2, r: 0x2d / 255, g: 0x5a / 255, b: 0x27 / 255 },
  { ratio: 0.2, r: 0x5a / 255, g: 0x8f / 255, b: 0x4c / 255 },
  { ratio: 0.4, r: 0x5a / 255, g: 0x8f / 255, b: 0x4c / 255 },
  { ratio: 0.4, r: 0xb8 / 255, g: 0xa5 / 255, b: 0x63 / 255 },
  { ratio: 0.6, r: 0xb8 / 255, g: 0xa5 / 255, b: 0x63 / 255 },
  { ratio: 0.6, r: 0x9e / 255, g: 0x9e / 255, b: 0x9e / 255 },
  { ratio: 0.8, r: 0x9e / 255, g: 0x9e / 255, b: 0x9e / 255 },
  { ratio: 0.8, r: 0xf0 / 255, g: 0xf0 / 255, b: 0xf0 / 255 },
  { ratio: 1.0, r: 0xf0 / 255, g: 0xf0 / 255, b: 0xf0 / 255 },
]

function interpolateColor(ratio: number): [number, number, number] {
  ratio = Math.max(0, Math.min(1, ratio))
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    const s1 = COLOR_STOPS[i]
    const s2 = COLOR_STOPS[i + 1]
    if (ratio >= s1.ratio && ratio <= s2.ratio) {
      const t = (ratio - s1.ratio) / (s2.ratio - s1.ratio || 1)
      const smoothT = t * t * (3 - 2 * t)
      return [
        s1.r + (s2.r - s1.r) * smoothT,
        s1.g + (s2.g - s1.g) * smoothT,
        s1.b + (s2.b - s1.b) * smoothT,
      ]
    }
  }
  return [1, 1, 1]
}

export interface TerrainResult {
  heights: Float32Array
  colors: Float32Array
  normals: Float32Array
  minHeight: number
  maxHeight: number
  gridSize: number
  terrainSize: number
}

export function generateTerrain(
  params: TerrainParams,
  gridSize: number = 128,
  terrainSize: number = 50
): TerrainResult {
  const { roughness, peakDensity, smoothness } = params
  const perlin = new PerlinNoise(42)
  const heights = new Float32Array(gridSize * gridSize)

  const amplitude = (roughness / 100) * 15
  const baseScale = 0.08 + (peakDensity / 10) * 0.15
  const octaves = Math.max(2, 6 - Math.floor(smoothness))
  const persistence = 0.4 + (1 - smoothness / 5) * 0.2
  const lacunarity = 2.0 + (smoothness / 5) * 0.5

  let minH = Infinity
  let maxH = -Infinity

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const idx = row * gridSize + col
      let h = 0
      let freq = baseScale
      let amp = 1
      let maxAmp = 0

      for (let o = 0; o < octaves; o++) {
        const x = col * freq * (gridSize / 128)
        const y = row * freq * (gridSize / 128)
        h += perlin.noise2D(x + o * 100, y + o * 200) * amp
        maxAmp += amp
        amp *= persistence
        freq *= lacunarity
      }

      h = (h / maxAmp) * amplitude

      const ridgeNoise = Math.abs(perlin.noise2D(col * 0.05, row * 0.05))
      h += ridgeNoise * (peakDensity / 10) * 5

      const centerDist = Math.sqrt(
        Math.pow((col - gridSize / 2) / (gridSize / 2), 2) +
        Math.pow((row - gridSize / 2) / (gridSize / 2), 2)
      )
      const falloff = Math.max(0, 1 - centerDist * 0.8)
      h *= 0.5 + falloff * 0.5

      heights[idx] = h
      if (h < minH) minH = h
      if (h > maxH) maxH = h
    }
  }

  const colors = new Float32Array(gridSize * gridSize * 3)
  const heightRange = maxH - minH || 1

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const idx = row * gridSize + col
      const h = heights[idx]
      const ratio = (h - minH) / heightRange
      const [r, g, b] = interpolateColor(ratio)
      const colorIdx = idx * 3
      colors[colorIdx] = r
      colors[colorIdx + 1] = g
      colors[colorIdx + 2] = b
    }
  }

  const normals = new Float32Array(gridSize * gridSize * 3)
  const cellSize = terrainSize / (gridSize - 1)

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const idx = row * gridSize + col
      const c = heights[idx]
      const l = col > 0 ? heights[idx - 1] : c
      const r = col < gridSize - 1 ? heights[idx + 1] : c
      const u = row > 0 ? heights[idx - gridSize] : c
      const d = row < gridSize - 1 ? heights[idx + gridSize] : c

      const dx = (r - l) / (2 * cellSize)
      const dy = (d - u) / (2 * cellSize)

      const nx = -dx
      const ny = -dy
      const nz = 1
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz)

      const normalIdx = idx * 3
      normals[normalIdx] = nx / len
      normals[normalIdx + 1] = nz / len
      normals[normalIdx + 2] = ny / len
    }
  }

  return {
    heights,
    colors,
    normals,
    minHeight: minH,
    maxHeight: maxH,
    gridSize,
    terrainSize,
  }
}

export function calculateSlopeAt(
  heights: Float32Array,
  row: number,
  col: number,
  gridSize: number,
  cellSize: number
): number {
  const idx = row * gridSize + col
  const c = heights[idx]
  const l = col > 0 ? heights[idx - 1] : c
  const r = col < gridSize - 1 ? heights[idx + 1] : c
  const u = row > 0 ? heights[idx - gridSize] : c
  const d = row < gridSize - 1 ? heights[idx + gridSize] : c

  const dx = (r - l) / (2 * cellSize)
  const dy = (d - u) / (2 * cellSize)

  const slopeRad = Math.atan(Math.sqrt(dx * dx + dy * dy))
  return slopeRad * (180 / Math.PI)
}
