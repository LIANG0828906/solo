import { TerrainData, ResourcePoint, ResourceType } from '../types'
import { v4 as uuidv4 } from 'uuid'

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

class PerlinNoise {
  private perm: number[] = []
  private gradP: { x: number; y: number }[] = []

  private static readonly GRAD3: { x: number; y: number }[] = [
    { x: 1, y: 1 }, { x: -1, y: 1 }, { x: 1, y: -1 }, { x: -1, y: -1 },
    { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }
  ]

  constructor(seed: number = 0) {
    const random = seededRandom(Math.abs(seed) >>> 0)
    const p: number[] = []
    for (let i = 0; i < 256; i++) p[i] = i
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[p[i], p[j]] = [p[j], p[i]]
    }
    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255]
      this.gradP[i] = PerlinNoise.GRAD3[this.perm[i] % 8]
    }
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10)
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a)
  }

  private dot2(g: { x: number; y: number }, x: number, y: number): number {
    return g.x * x + g.y * y
  }

  noise2D(xin: number, yin: number): number {
    const X0 = Math.floor(xin)
    const Y0 = Math.floor(yin)
    const X1 = X0 + 1
    const Y1 = Y0 + 1

    const xf = xin - X0
    const yf = yin - Y0

    const xi = X0 & 255
    const yi = Y0 & 255

    const g00 = this.gradP[xi + this.perm[yi]]
    const g10 = this.gradP[xi + 1 + this.perm[yi]]
    const g01 = this.gradP[xi + this.perm[yi + 1]]
    const g11 = this.gradP[xi + 1 + this.perm[yi + 1]]

    const n00 = this.dot2(g00, xf, yf)
    const n10 = this.dot2(g10, xf - 1, yf)
    const n01 = this.dot2(g01, xf, yf - 1)
    const n11 = this.dot2(g11, xf - 1, yf - 1)

    const u = this.fade(xf)
    const v = this.fade(yf)

    const nx0 = this.lerp(n00, n10, u)
    const nx1 = this.lerp(n01, n11, u)

    return this.lerp(nx0, nx1, v)
  }
}

const globalNoise = new PerlinNoise(42)
const globalNoise2 = new PerlinNoise(137)
const globalNoise3 = new PerlinNoise(256)

function fbm(x: number, y: number, octaves: number, persistence: number, lacunarity: number, noise: PerlinNoise): number {
  let total = 0
  let amplitude = 1
  let frequency = 1
  let maxValue = 0

  for (let i = 0; i < octaves; i++) {
    total += noise.noise2D(x * frequency, y * frequency) * amplitude
    maxValue += amplitude
    amplitude *= persistence
    frequency *= lacunarity
  }

  return total / maxValue
}

export function generateTerrain(chunkX: number, chunkZ: number, size: number = 20): TerrainData {
  const vertices: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  const heights: number[][] = []
  const segments = size
  const worldOffsetX = chunkX * size
  const worldOffsetZ = chunkZ * size

  for (let z = 0; z <= segments; z++) {
    heights[z] = []
    for (let x = 0; x <= segments; x++) {
      const localX = x - segments / 2
      const localZ = z - segments / 2
      const worldX = localX + worldOffsetX
      const worldZ = localZ + worldOffsetZ

      const scale1 = 0.06
      const scale2 = 0.02
      const scale3 = 0.12

      let height = fbm(worldX * scale1, worldZ * scale1, 5, 0.5, 2.0, globalNoise) * 3.0
      height += fbm(worldX * scale2, worldZ * scale2, 3, 0.6, 2.0, globalNoise2) * 5.0
      height += fbm(worldX * scale3, worldZ * scale3, 3, 0.35, 2.2, globalNoise3) * 1.0

      height = (height + 4) * 0.6
      height = Math.max(0, height)

      heights[z][x] = height

      vertices.push(localX, height, localZ)
      uvs.push(x / segments, z / segments)
    }
  }

  for (let z = 0; z < segments; z++) {
    for (let x = 0; x < segments; x++) {
      const topLeft = z * (segments + 1) + x
      const topRight = topLeft + 1
      const bottomLeft = (z + 1) * (segments + 1) + x
      const bottomRight = bottomLeft + 1

      indices.push(topLeft, bottomLeft, topRight)
      indices.push(topRight, bottomLeft, bottomRight)
    }
  }

  return { vertices, uvs, indices, heights, size }
}

export function generateResourcePoints(
  terrainData: TerrainData,
  chunkX: number,
  chunkZ: number
): ResourcePoint[] {
  const seed = chunkX * 7777 + chunkZ * 3333 + 9999
  const random = seededRandom(Math.abs(seed) >>> 0)

  const resourceCount = Math.floor(random() * 5) + 8
  const resourceTypes: ResourceType[] = ['wood', 'stone', 'metal', 'food']
  const points: ResourcePoint[] = []
  const size = terrainData.size

  for (let i = 0; i < resourceCount; i++) {
    const gridX = Math.floor(random() * (size - 2)) + 1
    const gridZ = Math.floor(random() * (size - 2)) + 1

    if (gridZ >= terrainData.heights.length || gridX >= terrainData.heights[0].length) {
      continue
    }

    const height = terrainData.heights[gridZ][gridX]
    const type = resourceTypes[Math.floor(random() * resourceTypes.length)]

    const offsetX = random() - 0.5
    const offsetZ = random() - 0.5

    points.push({
      id: uuidv4(),
      type,
      position: {
        x: gridX - size / 2 + offsetX,
        y: height + 0.3,
        z: gridZ - size / 2 + offsetZ
      },
      collected: false
    })
  }

  return points
}

export function generateTerrainAsync(
  chunkX: number,
  chunkZ: number,
  size: number = 20
): Promise<{ terrain: TerrainData; resources: ResourcePoint[] }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const terrain = generateTerrain(chunkX, chunkZ, size)
      const resources = generateResourcePoints(terrain, chunkX, chunkZ)
      resolve({ terrain, resources })
    }, 0)
  })
}
