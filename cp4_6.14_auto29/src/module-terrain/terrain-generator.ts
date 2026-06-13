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
  private permutation: number[] = []
  private gradP: { x: number; y: number }[] = []

  private static grad3: { x: number; y: number }[] = [
    { x: 1, y: 1 }, { x: -1, y: 1 }, { x: 1, y: -1 }, { x: -1, y: -1 },
    { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }
  ]

  constructor(seed: number = 0) {
    this.seed(seed)
  }

  seed(seed: number): void {
    const random = seededRandom(Math.abs(seed) >>> 0)
    const p: number[] = []
    for (let i = 0; i < 256; i++) {
      p[i] = i
    }
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[p[i], p[j]] = [p[j], p[i]]
    }
    for (let i = 0; i < 512; i++) {
      this.permutation[i] = p[i & 255]
      this.gradP[i] = PerlinNoise.grad3[this.permutation[i] % 8]
    }
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10)
  }

  private lerp(a: number, b: number, t: number): number {
    return (1 - t) * a + t * b
  }

  private dot(g: { x: number; y: number }, x: number, y: number): number {
    return g.x * x + g.y * y
  }

  noise2D(x: number, y: number): number {
    let X = Math.floor(x)
    let Y = Math.floor(y)

    x = x - X
    y = y - Y

    X = X & 255
    Y = Y & 255

    const n00 = this.dot(this.gradP[X + this.permutation[Y]], x, y)
    const n01 = this.dot(this.gradP[X + this.permutation[Y + 1]], x, y - 1)
    const n10 = this.dot(this.gradP[X + 1 + this.permutation[Y]], x - 1, y)
    const n11 = this.dot(this.gradP[X + 1 + this.permutation[Y + 1]], x - 1, y - 1)

    const u = this.fade(x)
    const v = this.fade(y)

    const nx0 = this.lerp(n00, n10, u)
    const nx1 = this.lerp(n01, n11, u)

    return this.lerp(nx0, nx1, v)
  }
}

const noiseCache = new Map<number, PerlinNoise>()

function getNoise(seed: number): PerlinNoise {
  if (!noiseCache.has(seed)) {
    noiseCache.set(seed, new PerlinNoise(seed))
  }
  return noiseCache.get(seed)!
}

function octaveNoise(x: number, y: number, octaves: number = 4, persistence: number = 0.5, seed: number = 0): number {
  const noise = getNoise(seed)
  let total = 0
  let frequency = 1
  let amplitude = 1
  let maxValue = 0

  for (let i = 0; i < octaves; i++) {
    total += noise.noise2D(x * frequency, y * frequency) * amplitude
    maxValue += amplitude
    amplitude *= persistence
    frequency *= 2
  }

  return total / maxValue
}

export function generateTerrain(chunkX: number, chunkZ: number, size: number = 20): TerrainData {
  const seed = chunkX * 1000 + chunkZ
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

      let height = octaveNoise(worldX * 0.08, worldZ * 0.08, 4, 0.5, seed) * 2.5
      height += octaveNoise(worldX * 0.02, worldZ * 0.02, 2, 0.6, seed + 100) * 4
      height += octaveNoise(worldX * 0.15, worldZ * 0.15, 3, 0.4, seed + 200) * 0.8
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
    const start = performance.now()
    setTimeout(() => {
      const terrain = generateTerrain(chunkX, chunkZ, size)
      const resources = generateResourcePoints(terrain, chunkX, chunkZ)
      const elapsed = performance.now() - start
      if (elapsed < 16) {
        setTimeout(() => resolve({ terrain, resources }), 16 - elapsed)
      } else {
        resolve({ terrain, resources })
      }
    }, 0)
  })
}
