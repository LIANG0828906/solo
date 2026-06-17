export const GRID_SIZE = 100
export const TIME_STEPS = 3
export const SENSOR_COUNT = 50
export const PARTICLE_COUNT = 2000

export const TEMP_MIN = 10
export const TEMP_MAX = 45
export const ELEVATION_MIN = -5
export const ELEVATION_MAX = 15
export const HUMIDITY_MIN = 0
export const HUMIDITY_MAX = 100

export interface GridCell {
  x: number
  z: number
  elevation: number
  temperature: number[]
  humidity: number[]
  windU: number[]
  windV: number[]
  pressure: number[]
}

export interface SensorPoint {
  id: number
  gridX: number
  gridZ: number
  temperature: number[]
  humidity: number[]
  windSpeed: number[]
  pressure: number[]
}

class SimplexNoiseLite {
  private perm: number[]
  constructor(seed = 1337) {
    const p: number[] = []
    for (let i = 0; i < 256; i++) p[i] = i
    let s = seed
    for (let i = 255; i > 0; i--) {
      s = (s * 9301 + 49297) % 233280
      const j = Math.floor((s / 233280) * (i + 1))
      ;[p[i], p[j]] = [p[j], p[i]]
    }
    this.perm = new Array(512)
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255]
  }
  noise2D(x: number, y: number): number {
    const X = Math.floor(x) & 255
    const Y = Math.floor(y) & 255
    x -= Math.floor(x)
    y -= Math.floor(y)
    const u = this.fade(x)
    const v = this.fade(y)
    const A = this.perm[X] + Y
    const B = this.perm[X + 1] + Y
    return this.lerp(
      v,
      this.lerp(u, this.grad(this.perm[A], x, y), this.grad(this.perm[B], x - 1, y)),
      this.lerp(u, this.grad(this.perm[A + 1], x, y - 1), this.grad(this.perm[B + 1], x - 1, y - 1)),
    )
  }
  private fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10) }
  private lerp(t: number, a: number, b: number) { return a + t * (b - a) }
  private grad(hash: number, x: number, y: number) {
    const h = hash & 3
    const u = h < 2 ? x : y
    const v = h < 2 ? y : x
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v)
  }
}

export class GeoDataSource {
  grid: GridCell[][] = []
  sensors: SensorPoint[] = []
  private noise: SimplexNoiseLite

  constructor() {
    this.noise = new SimplexNoiseLite(42)
    this.generateGrid()
    this.generateSensors()
  }

  private generateGrid(): void {
    for (let z = 0; z < GRID_SIZE; z++) {
      this.grid[z] = []
      for (let x = 0; x < GRID_SIZE; x++) {
        const nx = x / GRID_SIZE
        const nz = z / GRID_SIZE
        const centerDist = Math.sqrt((nx - 0.5) ** 2 + (nz - 0.5) ** 2)
        const elevationBase =
          this.noise.noise2D(x * 0.08, z * 0.08) * 6 +
          this.noise.noise2D(x * 0.2, z * 0.2) * 3
        const elevation = Math.max(
          ELEVATION_MIN,
          Math.min(ELEVATION_MAX, elevationBase + (0.5 - centerDist) * 8),
        )
        const tempCenter = 38 - centerDist * 14
        const temperature: number[] = []
        const humidity: number[] = []
        const windU: number[] = []
        const windV: number[] = []
        const pressure: number[] = []
        for (let t = 0; t < TIME_STEPS; t++) {
          const tPhase = t * 0.5
          const tempNoise = this.noise.noise2D(x * 0.1 + tPhase, z * 0.1 - tPhase) * 5
          temperature.push(
            Math.max(TEMP_MIN, Math.min(TEMP_MAX, tempCenter + tempNoise + t * 2.5)),
          )
          const humBase = 80 - (temperature[t] - TEMP_MIN) * 1.3
          humidity.push(
            Math.max(HUMIDITY_MIN, Math.min(HUMIDITY_MAX, humBase + this.noise.noise2D(x * 0.15, z * 0.15 + t * 0.7) * 10)),
          )
          windU.push(
            Math.sin(x * 0.1 + t * 0.3) * 2 + this.noise.noise2D(x * 0.2, z * 0.2 + t) * 3,
          )
          windV.push(
            Math.cos(z * 0.1 + t * 0.2) * 2 + this.noise.noise2D(x * 0.2 + t, z * 0.2) * 3,
          )
          pressure.push(1005 + this.noise.noise2D(x * 0.05 + t, z * 0.05) * 15 - (elevation / 15) * 8)
        }
        this.grid[z][x] = { x, z, elevation, temperature, humidity, windU, windV, pressure }
      }
    }
  }

  private generateSensors(): void {
    const used = new Set<string>()
    let id = 0
    while (this.sensors.length < SENSOR_COUNT) {
      const gx = Math.floor(Math.random() * GRID_SIZE)
      const gz = Math.floor(Math.random() * GRID_SIZE)
      const key = `${gx},${gz}`
      if (used.has(key)) continue
      used.add(key)
      const cell = this.grid[gz][gx]
      const windSpeed = cell.windU.map((u, t) => Math.sqrt(u ** 2 + cell.windV[t] ** 2))
      this.sensors.push({
        id: id++,
        gridX: gx,
        gridZ: gz,
        temperature: [...cell.temperature],
        humidity: [...cell.humidity],
        windSpeed,
        pressure: [...cell.pressure],
      })
    }
  }

  getCell(x: number, z: number): GridCell | null {
    if (x < 0 || z < 0 || x >= GRID_SIZE || z >= GRID_SIZE) return null
    return this.grid[z][x]
  }

  toJSON(): string {
    return JSON.stringify({ grid: this.grid, sensors: this.sensors }, null, 2)
  }
}
