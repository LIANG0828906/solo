import type { MapData, TerrainCell, TerrainType } from '../../types'

class SeededRandom {
  private seed: number

  constructor(seed: number) {
    this.seed = seed >>> 0
  }

  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0
    return this.seed / 0xffffffff
  }
}

class PerlinNoise {
  private perm: number[] = []
  private gradients: { x: number; y: number }[] = []

  constructor(seed: number) {
    this.initPermutation(seed)
  }

  private initPermutation(seed: number) {
    const rng = new SeededRandom(seed)
    const p: number[] = []
    for (let i = 0; i < 256; i++) {
      p[i] = i
    }
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rng.next() * (i + 1))
      ;[p[i], p[j]] = [p[j], p[i]]
    }
    this.perm = [...p, ...p]

    const gradAngles = [
      { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 },
      { x: 1, y: 1 }, { x: -1, y: 1 }, { x: 1, y: -1 }, { x: -1, y: -1 },
    ]
    for (let i = 0; i < 512; i++) {
      this.gradients[i] = gradAngles[this.perm[i] % 8]
    }
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10)
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a)
  }

  private dot(x: number, y: number, gx: number, gy: number): number {
    return x * gx + y * gy
  }

  noise2D(x: number, y: number): number {
    const X = Math.floor(x) & 255
    const Y = Math.floor(y) & 255
    const xf = x - Math.floor(x)
    const yf = y - Math.floor(y)
    const u = this.fade(xf)
    const v = this.fade(yf)

    const aa = this.perm[X] + Y
    const ab = this.perm[X] + Y + 1
    const ba = this.perm[X + 1] + Y
    const bb = this.perm[X + 1] + Y + 1

    const x1 = this.lerp(
      this.dot(xf, yf, this.gradients[aa].x, this.gradients[aa].y),
      this.dot(xf - 1, yf, this.gradients[ba].x, this.gradients[ba].y),
      u
    )
    const x2 = this.lerp(
      this.dot(xf, yf - 1, this.gradients[ab].x, this.gradients[ab].y),
      this.dot(xf - 1, yf - 1, this.gradients[bb].x, this.gradients[bb].y),
      u
    )
    return this.lerp(x1, x2, v)
  }

  octaveNoise(x: number, y: number, octaves: number, persistence: number): number {
    let total = 0
    let frequency = 1
    let amplitude = 1
    let maxValue = 0
    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude
      maxValue += amplitude
      amplitude *= persistence
      frequency *= 2
    }
    return total / maxValue
  }
}

export class MapGenerator {
  private seed: number
  private width: number
  private height: number

  constructor(seed: number, width: number, height?: number) {
    this.seed = seed
    this.width = width
    this.height = height ?? width
  }

  private getTerrainType(elevation: number, moisture: number): TerrainType {
    if (elevation < 0.32) return 'water' as TerrainType.WATER
    if (elevation < 0.4) return 'grassland' as TerrainType.GRASSLAND
    if (elevation > 0.72) return 'mountain' as TerrainType.MOUNTAIN
    if (moisture > 0.55 || elevation < 0.5) return 'forest' as TerrainType.FOREST
    return 'grassland' as TerrainType.GRASSLAND
  }

  private generateElevations(noise: PerlinNoise): number[][] {
    const elevations: number[][] = []
    const scale = 0.05
    for (let y = 0; y < this.height; y++) {
      elevations[y] = []
      for (let x = 0; x < this.width; x++) {
        const cx = this.width / 2
        const cy = this.height / 2
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
        const maxDist = Math.sqrt(cx ** 2 + cy ** 2)
        const falloff = 1 - (dist / maxDist) * 0.6
        const n = noise.octaveNoise(x * scale, y * scale, 4, 0.5)
        elevations[y][x] = Math.max(0, Math.min(1, (n + 1) / 2 * falloff))
      }
    }
    return elevations
  }

  private generateMoisture(noise: PerlinNoise): number[][] {
    const moistures: number[][] = []
    const scale = 0.08
    for (let y = 0; y < this.height; y++) {
      moistures[y] = []
      for (let x = 0; x < this.width; x++) {
        const n = noise.octaveNoise(x * scale + 1000, y * scale + 1000, 3, 0.6)
        moistures[y][x] = (n + 1) / 2
      }
    }
    return moistures
  }

  private traceRiver(
    cells: TerrainCell[][],
    elevations: number[][],
    startX: number,
    startY: number,
    rng: SeededRandom
  ): void {
    let x = startX
    let y = startY
    const maxSteps = this.width * 2
    const visited = new Set<string>()
    for (let step = 0; step < maxSteps; step++) {
      const key = `${x},${y}`
      if (visited.has(key)) break
      visited.add(key)
      if (x < 0 || x >= this.width || y < 0 || y >= this.height) break
      if (cells[y][x].type === ('water' as TerrainType.WATER)) break
      cells[y][x].isRiver = true
      const neighbors = [
        { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
        { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
        { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
        { dx: -1, dy: 1 }, { dx: 1, dy: 1 },
      ]
      let bestX = x
      let bestY = y
      let bestElev = elevations[y][x]
      for (const n of neighbors) {
        const nx = x + n.dx
        const ny = y + n.dy
        if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) continue
        const e = elevations[ny][nx]
        if (e < bestElev - 0.001) {
          bestElev = e
          bestX = nx
          bestY = ny
        }
      }
      if (bestX === x && bestY === y) {
        const r = rng.next()
        if (r < 0.3) break
        const rand = neighbors[Math.floor(rng.next() * neighbors.length)]
        bestX = x + rand.dx
        bestY = y + rand.dy
      }
      x = bestX
      y = bestY
    }
  }

  private generateRivers(cells: TerrainCell[][], elevations: number[][], rng: SeededRandom): void {
    const riverCount = Math.max(2, Math.floor(Math.min(this.width, this.height) / 32))
    const mountainCells: { x: number; y: number }[] = []
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (elevations[y][x] > 0.75) {
          mountainCells.push({ x, y })
        }
      }
    }
    for (let i = 0; i < riverCount && mountainCells.length > 0; i++) {
      const idx = Math.floor(rng.next() * mountainCells.length)
      const start = mountainCells.splice(idx, 1)[0]
      this.traceRiver(cells, elevations, start.x, start.y, rng)
    }
  }

  generate(): MapData {
    const startTime = performance.now()
    const noise = new PerlinNoise(this.seed)
    const moistureNoise = new PerlinNoise(this.seed + 7919)
    const rng = new SeededRandom(this.seed + 1234)

    const elevations = this.generateElevations(noise)
    const moistures = this.generateMoisture(moistureNoise)

    const cells: TerrainCell[][] = []
    for (let y = 0; y < this.height; y++) {
      cells[y] = []
      for (let x = 0; x < this.width; x++) {
        const type = this.getTerrainType(elevations[y][x], moistures[y][x])
        cells[y][x] = {
          x,
          y,
          type,
          elevation: elevations[y][x],
          isRiver: false,
        }
      }
    }

    this.generateRivers(cells, elevations, rng)

    const elapsed = performance.now() - startTime
    if (elapsed > 200) {
      console.warn(`地图生成耗时 ${elapsed.toFixed(0)}ms，超过200ms目标`)
    }

    return {
      width: this.width,
      height: this.height,
      cells,
      seed: this.seed,
    }
  }
}

export function generateMap(seed: number, size: number): MapData {
  const generator = new MapGenerator(seed, size)
  return generator.generate()
}
