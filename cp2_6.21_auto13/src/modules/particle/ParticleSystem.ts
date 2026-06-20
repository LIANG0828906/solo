import type { ColorMapName } from '@/store/useStore'

export interface VectorFieldGrid {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  cols: number
  rows: number
  data: Float32Array
}

export interface Particle {
  x: number
  y: number
  life: number
  maxLife: number
}

export function buildGrid(raw: { x: number; y: number; u: number; v: number }[]): VectorFieldGrid | null {
  if (raw.length === 0) return null

  const xs = [...new Set(raw.map((d) => d.x))].sort((a, b) => a - b)
  const ys = [...new Set(raw.map((d) => d.y))].sort((a, b) => a - b)

  const cols = xs.length
  const rows = ys.length
  if (cols < 2 || rows < 2) return null

  const xMin = xs[0]
  const xMax = xs[xs.length - 1]
  const yMin = ys[0]
  const yMax = ys[ys.length - 1]

  const gridData = new Float32Array(cols * rows * 2)
  const lookup = new Map<string, { u: number; v: number }>()
  for (const d of raw) {
    lookup.set(`${d.x},${d.y}`, { u: d.u, v: d.v })
  }

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const idx = (j * cols + i) * 2
      const key = `${xs[i]},${ys[j]}`
      const val = lookup.get(key)
      gridData[idx] = val ? val.u : 0
      gridData[idx + 1] = val ? val.v : 0
    }
  }

  return { xMin, xMax, yMin, yMax, cols, rows, data: gridData }
}

export function interpolate(grid: VectorFieldGrid, x: number, y: number): [number, number] {
  const { xMin, xMax, yMin, yMax, cols, rows, data } = grid
  const dx = xMax - xMin
  const dy = yMax - yMin
  if (dx === 0 || dy === 0) return [0, 0]

  const gx = ((x - xMin) / dx) * (cols - 1)
  const gy = ((y - yMin) / dy) * (rows - 1)

  const gxClamped = Math.max(0, Math.min(cols - 1.001, gx))
  const gyClamped = Math.max(0, Math.min(rows - 1.001, gy))

  const i = Math.floor(gxClamped)
  const j = Math.floor(gyClamped)
  const fx = gxClamped - i
  const fy = gyClamped - j

  const i1 = Math.min(i + 1, cols - 1)
  const j1 = Math.min(j + 1, rows - 1)

  const idx00 = (j * cols + i) * 2
  const idx10 = (j * cols + i1) * 2
  const idx01 = (j1 * cols + i) * 2
  const idx11 = (j1 * cols + i1) * 2

  const u =
    (1 - fx) * (1 - fy) * data[idx00] +
    fx * (1 - fy) * data[idx10] +
    (1 - fx) * fy * data[idx01] +
    fx * fy * data[idx11]

  const v =
    (1 - fx) * (1 - fy) * data[idx00 + 1] +
    fx * (1 - fy) * data[idx10 + 1] +
    (1 - fx) * fy * data[idx01 + 1] +
    fx * fy * data[idx11 + 1]

  return [u, v]
}

export function rk4Step(grid: VectorFieldGrid, x: number, y: number, dt: number): [number, number] {
  const [u1, v1] = interpolate(grid, x, y)
  const [u2, v2] = interpolate(grid, x + u1 * dt * 0.5, y + v1 * dt * 0.5)
  const [u3, v3] = interpolate(grid, x + u2 * dt * 0.5, y + v2 * dt * 0.5)
  const [u4, v4] = interpolate(grid, x + u3 * dt, y + v3 * dt)

  return [
    x + (u1 + 2 * u2 + 2 * u3 + u4) * dt / 6,
    y + (v1 + 2 * v2 + 2 * v3 + v4) * dt / 6,
  ]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1))
  const m = l - c / 2
  let r = 0
  let g = 0
  let b = 0
  if (h < 1 / 6) {
    r = c; g = x
  } else if (h < 2 / 6) {
    r = x; g = c
  } else if (h < 3 / 6) {
    g = c; b = x
  } else if (h < 4 / 6) {
    g = x; b = c
  } else if (h < 5 / 6) {
    r = x; b = c
  } else {
    r = c; b = x
  }
  return [r + m, g + m, b + m]
}

export function getColor(t: number, mapName: ColorMapName): [number, number, number] {
  t = Math.max(0, Math.min(1, t))
  switch (mapName) {
    case 'rainbow': {
      const h = (1 - t) * 0.667
      return hslToRgb(h, 1, 0.5)
    }
    case 'heatmap': {
      if (t < 0.25) return [0, t * 4, 1]
      if (t < 0.5) return [0, 1, 1 - (t - 0.25) * 4]
      if (t < 0.75) return [(t - 0.5) * 4, 1, 0]
      return [1, 1 - (t - 0.75) * 4, 0]
    }
    case 'blueCyan': {
      return [0.05, 0.3 + t * 0.7, 0.8 + t * 0.2]
    }
    case 'redGreen': {
      return [1 - t, t, 0.1]
    }
    case 'grayscale': {
      return [t, t, t]
    }
  }
}

export function computeMaxMagnitude(grid: VectorFieldGrid): number {
  let maxMag = 0
  for (let j = 0; j < grid.rows; j++) {
    for (let i = 0; i < grid.cols; i++) {
      const idx = (j * grid.cols + i) * 2
      const u = grid.data[idx]
      const v = grid.data[idx + 1]
      const mag = Math.sqrt(u * u + v * v)
      if (mag > maxMag) maxMag = mag
    }
  }
  return maxMag || 1
}

export class ParticleEngine {
  grid: VectorFieldGrid | null = null
  particles: Particle[] = []
  maxParticles = 10000
  private emitAccumulator = 0

  setGrid(grid: VectorFieldGrid | null) {
    this.grid = grid
    this.particles = []
    this.emitAccumulator = 0
  }

  emit(density: number, dt: number) {
    if (!this.grid) return
    const { cols, rows, xMin, xMax, yMin, yMax } = this.grid

    const totalGridPoints = cols * rows
    const rate = totalGridPoints * density * 0.8
    this.emitAccumulator += rate * dt

    const toEmit = Math.floor(this.emitAccumulator)
    this.emitAccumulator -= toEmit

    const emitCount = Math.min(toEmit, this.maxParticles - this.particles.length)
    for (let i = 0; i < emitCount; i++) {
      const ci = Math.floor(Math.random() * cols)
      const ri = Math.floor(Math.random() * rows)

      const x = xMin + (ci / (cols - 1)) * (xMax - xMin)
      const y = yMin + (ri / (rows - 1)) * (yMax - yMin)

      this.particles.push({
        x,
        y,
        life: 0,
        maxLife: 1.0,
      })
    }
  }

  update(dt: number, timeStep: number) {
    if (!this.grid) return

    const alive: Particle[] = []
    for (const p of this.particles) {
      p.life += dt
      if (p.life >= p.maxLife) continue

      const [nx, ny] = rk4Step(this.grid, p.x, p.y, timeStep)

      if (nx < this.grid.xMin || nx > this.grid.xMax || ny < this.grid.yMin || ny > this.grid.yMax) continue

      p.x = nx
      p.y = ny
      alive.push(p)
    }

    this.particles = alive
  }

  getGeometryData(colorMap: ColorMapName): { positions: Float32Array; colors: Float32Array; count: number } {
    const count = this.particles.length
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)

    if (!this.grid) return { positions, colors, count }

    const maxMag = computeMaxMagnitude(this.grid)

    for (let i = 0; i < count; i++) {
      const p = this.particles[i]
      const [u, v] = interpolate(this.grid, p.x, p.y)
      const mag = Math.sqrt(u * u + v * v)
      const t = mag / maxMag
      const [r, g, b] = getColor(t, colorMap)

      const nx = ((p.x - this.grid.xMin) / (this.grid.xMax - this.grid.xMin)) * 2 - 1
      const ny = ((p.y - this.grid.yMin) / (this.grid.yMax - this.grid.yMin)) * 2 - 1

      positions[i * 3] = nx
      positions[i * 3 + 1] = ny
      positions[i * 3 + 2] = 0.02

      const alpha = 1 - p.life / p.maxLife
      colors[i * 3] = r * alpha
      colors[i * 3 + 1] = g * alpha
      colors[i * 3 + 2] = b * alpha
    }

    return { positions, colors, count }
  }

  reset() {
    this.particles = []
    this.emitAccumulator = 0
  }
}
