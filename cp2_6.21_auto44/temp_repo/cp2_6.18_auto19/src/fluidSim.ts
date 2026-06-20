import EventBus from './eventBus'

export interface ParticleData {
  positions: Float32Array
  colors: Float32Array
  speeds: Float32Array
  trailPositions: Float32Array[]
}

const COLOR_STOPS = [
  { speed: 0, h: 204, s: 0.7, l: 0.52 },
  { speed: 5, h: 145, s: 0.63, l: 0.42 },
  { speed: 15, h: 32, s: 0.85, l: 0.62 },
  { speed: 25, h: 6, s: 0.81, l: 0.63 }
]

const GRID_SIZE = 10

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r, g, b
  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h / 360 + 1/3)
    g = hue2rgb(p, q, h / 360)
    b = hue2rgb(p, q, h / 360 - 1/3)
  }
  return [r, g, b]
}

function lerpColor(speed: number): [number, number, number] {
  if (speed <= COLOR_STOPS[0].speed) {
    const c = COLOR_STOPS[0]
    return hslToRgb(c.h, c.s, c.l)
  }
  if (speed >= COLOR_STOPS[COLOR_STOPS.length - 1].speed) {
    const c = COLOR_STOPS[COLOR_STOPS.length - 1]
    return hslToRgb(c.h, c.s, c.l)
  }
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    const c1 = COLOR_STOPS[i]
    const c2 = COLOR_STOPS[i + 1]
    if (speed >= c1.speed && speed <= c2.speed) {
      const t = (speed - c1.speed) / (c2.speed - c1.speed)
      const h = c1.h + (c2.h - c1.h) * t
      const s = c1.s + (c2.s - c1.s) * t
      const l = c1.l + (c2.l - c1.l) * t
      return hslToRgb(h, s, l)
    }
  }
  return [0.5, 0.5, 0.5]
}

interface WindVector {
  x: number
  y: number
}

export class FluidSim {
  private eventBus: EventBus
  private areaSize: number
  private particleCount: number
  private trailLength: number
  private windStrength: number
  private vortexStrength: number

  private positions: Float32Array
  private colors: Float32Array
  private speeds: Float32Array
  private trailPositions: Float32Array[] = []

  private windGrid: WindVector[][] = []
  private gridCellSize: number

  private time: number = 0

  constructor(eventBus: EventBus, areaSize: number, particleCount: number) {
    this.eventBus = eventBus
    this.areaSize = areaSize
    this.particleCount = particleCount
    this.trailLength = 3
    this.windStrength = 1.0
    this.vortexStrength = 30

    this.gridCellSize = areaSize / GRID_SIZE

    this.positions = new Float32Array(particleCount * 3)
    this.colors = new Float32Array(particleCount * 3)
    this.speeds = new Float32Array(particleCount)

    this.initWindGrid()
    this.initParticles()
    this.initTrails()

    this.eventBus.on('params:scene', (data: any) => {
      if (data.particleCount !== undefined) {
        this.setParticleCount(data.particleCount)
      }
      if (data.trailLength !== undefined) {
        this.setTrailLength(data.trailLength)
      }
    })

    this.eventBus.on('params:wind', (data: any) => {
      if (data.windStrength !== undefined) {
        this.windStrength = data.windStrength
      }
      if (data.vortexStrength !== undefined) {
        this.vortexStrength = data.vortexStrength
      }
    })
  }

  private initWindGrid(): void {
    this.windGrid = []
    for (let i = 0; i <= GRID_SIZE; i++) {
      this.windGrid[i] = []
      for (let j = 0; j <= GRID_SIZE; j++) {
        const x = (i / GRID_SIZE - 0.5) * this.areaSize
        const y = (j / GRID_SIZE - 0.5) * this.areaSize

        const distFromCenter = Math.sqrt(x * x + y * y)
        const angle = Math.atan2(y, x)

        const baseSpeed = 8 + distFromCenter * 0.03
        const windAngle = angle + Math.PI / 2 + Math.sin(distFromCenter * 0.02) * 0.3

        this.windGrid[i][j] = {
          x: Math.cos(windAngle) * baseSpeed,
          y: Math.sin(windAngle) * baseSpeed
        }
      }
    }
  }

  private initParticles(): void {
    for (let i = 0; i < this.particleCount; i++) {
      const x = (Math.random() - 0.5) * this.areaSize
      const z = (Math.random() - 0.5) * this.areaSize
      const y = 0.5 + Math.random() * 2

      this.positions[i * 3] = x
      this.positions[i * 3 + 1] = y
      this.positions[i * 3 + 2] = z
    }
    this.updateColors()
  }

  private initTrails(): void {
    this.trailPositions = []
    for (let t = 0; t < this.trailLength; t++) {
      const trail = new Float32Array(this.particleCount * 3)
      for (let i = 0; i < this.particleCount * 3; i++) {
        trail[i] = this.positions[i]
      }
      this.trailPositions.push(trail)
    }
  }

  private bilinearInterpolation(x: number, z: number): WindVector {
    const halfSize = this.areaSize / 2
    let gx = (x + halfSize) / this.gridCellSize
    let gz = (z + halfSize) / this.gridCellSize

    gx = Math.max(0, Math.min(GRID_SIZE, gx))
    gz = Math.max(0, Math.min(GRID_SIZE, gz))

    const x0 = Math.floor(gx)
    const z0 = Math.floor(gz)
    const x1 = Math.min(GRID_SIZE, x0 + 1)
    const z1 = Math.min(GRID_SIZE, z0 + 1)

    const u = gx - x0
    const v = gz - z0

    const v00 = this.windGrid[x0][z0]
    const v10 = this.windGrid[x1][z0]
    const v01 = this.windGrid[x0][z1]
    const v11 = this.windGrid[x1][z1]

    const vx = (1 - u) * (1 - v) * v00.x + u * (1 - v) * v10.x + (1 - u) * v * v01.x + u * v * v11.x
    const vy = (1 - u) * (1 - v) * v00.y + u * (1 - v) * v10.y + (1 - u) * v * v01.y + u * v * v11.y

    return { x: vx, y: vy }
  }

  private getVortexVelocity(x: number, z: number, time: number): WindVector {
    const frequency = 0.015
    const strength = this.vortexStrength * 0.01

    const distFromCenter = Math.sqrt(x * x + z * z)
    const angle = Math.atan2(z, x)

    const swirl = Math.sin(distFromCenter * frequency + time * 0.5) * strength
    const radial = Math.cos(distFromCenter * frequency * 0.7 + time * 0.3) * strength * 0.5

    const vx = -Math.sin(angle) * swirl + Math.cos(angle) * radial
    const vz = Math.cos(angle) * swirl + Math.sin(angle) * radial

    return { x: vx, y: vz }
  }

  private updateColors(): void {
    for (let i = 0; i < this.particleCount; i++) {
      const speed = this.speeds[i]
      const [r, g, b] = lerpColor(speed)
      this.colors[i * 3] = r
      this.colors[i * 3 + 1] = g
      this.colors[i * 3 + 2] = b
    }
  }

  update(deltaTime: number): void {
    this.time += deltaTime

    const halfSize = this.areaSize / 2

    for (let t = this.trailLength - 1; t > 0; t--) {
      for (let i = 0; i < this.particleCount * 3; i++) {
        this.trailPositions[t][i] = this.trailPositions[t - 1][i]
      }
    }
    if (this.trailLength > 0) {
      for (let i = 0; i < this.particleCount * 3; i++) {
        this.trailPositions[0][i] = this.positions[i]
      }
    }

    for (let i = 0; i < this.particleCount; i++) {
      const x = this.positions[i * 3]
      const z = this.positions[i * 3 + 2]

      const baseWind = this.bilinearInterpolation(x, z)
      const vortex = this.getVortexVelocity(x, z, this.time)

      const speedMultiplier = 1.8
      const vx = (baseWind.x * this.windStrength + vortex.x) * deltaTime * speedMultiplier
      const vz = (baseWind.y * this.windStrength + vortex.y) * deltaTime * speedMultiplier

      const speed = Math.sqrt(vx * vx + vz * vz) / deltaTime
      this.speeds[i] = speed

      let newX = x + vx
      let newZ = z + vz

      if (newX > halfSize) newX = -halfSize + (newX - halfSize)
      if (newX < -halfSize) newX = halfSize + (newX + halfSize)
      if (newZ > halfSize) newZ = -halfSize + (newZ - halfSize)
      if (newZ < -halfSize) newZ = halfSize + (newZ + halfSize)

      this.positions[i * 3] = newX
      this.positions[i * 3 + 2] = newZ

      const vy = Math.sin(this.time * 2 + x * 0.1 + z * 0.1) * deltaTime * 0.5
      let newY = this.positions[i * 3 + 1] + vy
      newY = Math.max(0.2, Math.min(5, newY))
      this.positions[i * 3 + 1] = newY
    }

    this.updateColors()

    this.eventBus.emit('particles:update', {
      positions: this.positions,
      colors: this.colors,
      speeds: this.speeds,
      trailPositions: this.trailPositions,
      particleCount: this.particleCount,
      trailLength: this.trailLength
    } as ParticleData & { particleCount: number; trailLength: number })
  }

  setParticleCount(count: number): void {
    if (count === this.particleCount) return

    const oldCount = this.particleCount
    this.particleCount = count

    const newPositions = new Float32Array(count * 3)
    const newColors = new Float32Array(count * 3)
    const newSpeeds = new Float32Array(count)

    const copyCount = Math.min(oldCount, count)
    for (let i = 0; i < copyCount; i++) {
      newPositions[i * 3] = this.positions[i * 3]
      newPositions[i * 3 + 1] = this.positions[i * 3 + 1]
      newPositions[i * 3 + 2] = this.positions[i * 3 + 2]
      newColors[i * 3] = this.colors[i * 3]
      newColors[i * 3 + 1] = this.colors[i * 3 + 1]
      newColors[i * 3 + 2] = this.colors[i * 3 + 2]
      newSpeeds[i] = this.speeds[i]
    }

    for (let i = copyCount; i < count; i++) {
      newPositions[i * 3] = (Math.random() - 0.5) * this.areaSize
      newPositions[i * 3 + 1] = 0.5 + Math.random() * 2
      newPositions[i * 3 + 2] = (Math.random() - 0.5) * this.areaSize
    }

    this.positions = newPositions
    this.colors = newColors
    this.speeds = newSpeeds

    this.trailPositions = []
    for (let t = 0; t < this.trailLength; t++) {
      const trail = new Float32Array(count * 3)
      for (let i = 0; i < count * 3; i++) {
        trail[i] = this.positions[i]
      }
      this.trailPositions.push(trail)
    }
  }

  setTrailLength(length: number): void {
    if (length === this.trailLength) return
    this.trailLength = length

    const newTrails: Float32Array[] = []
    for (let t = 0; t < length; t++) {
      if (t < this.trailPositions.length) {
        newTrails.push(this.trailPositions[t])
      } else {
        const trail = new Float32Array(this.particleCount * 3)
        for (let i = 0; i < this.particleCount * 3; i++) {
          trail[i] = this.positions[i]
        }
        newTrails.push(trail)
      }
    }
    this.trailPositions = newTrails
  }
}
