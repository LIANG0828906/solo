import { applyForce, ForceFieldParams } from './ForceField'

export interface ParticleEngineOptions {
  count: number
  flowSpeed: number
  colorPalette: string[]
  bounds?: {
    minX: number
    maxX: number
    minY: number
    maxY: number
    minZ: number
    maxZ: number
  }
}

export interface ForceFieldInput {
  x: number
  y: number
  forceX: number
  forceY: number
  strength: number
  radius: number
}

const DEFAULT_BOUNDS = {
  minX: -30,
  maxX: 30,
  minY: -20,
  maxY: 20,
  minZ: -50,
  maxZ: 50
}

export class ParticleEngine {
  count: number
  flowSpeed: number
  colorPalette: string[]
  bounds: typeof DEFAULT_BOUNDS

  positions: Float32Array
  velocities: Float32Array
  colors: Float32Array
  sizes: Float32Array
  phases: Float32Array

  waveAmplitude: number = 0.2
  waveFrequency: number = 0.2
  time: number = 0

  constructor(options: ParticleEngineOptions) {
    this.count = options.count
    this.flowSpeed = options.flowSpeed
    this.colorPalette = options.colorPalette
    this.bounds = options.bounds || DEFAULT_BOUNDS

    this.positions = new Float32Array(this.count * 3)
    this.velocities = new Float32Array(this.count * 3)
    this.colors = new Float32Array(this.count * 3)
    this.sizes = new Float32Array(this.count)
    this.phases = new Float32Array(this.count)

    this.initParticles()
  }

  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? [
          parseInt(result[1], 16) / 255,
          parseInt(result[2], 16) / 255,
          parseInt(result[3], 16) / 255
        ]
      : [1, 1, 1]
  }

  private lerpColor(
    c1: [number, number, number],
    c2: [number, number, number],
    t: number
  ): [number, number, number] {
    return [c1[0] + (c2[0] - c1[0]) * t, c1[1] + (c2[1] - c1[1]) * t, c1[2] + (c2[2] - c1[2]) * t]
  }

  private getGradientColor(t: number): [number, number, number] {
    const palette = this.colorPalette.map((c) => this.hexToRgb(c))
    const segments = palette.length - 1
    const scaledT = t * segments
    const segmentIndex = Math.min(Math.floor(scaledT), segments - 1)
    const localT = scaledT - segmentIndex
    return this.lerpColor(palette[segmentIndex], palette[segmentIndex + 1], localT)
  }

  private initParticle(index: number): void {
    const i3 = index * 3
    const { minX, maxX, minY, maxY, minZ, maxZ } = this.bounds

    this.positions[i3] = minX + Math.random() * (maxX - minX)
    this.positions[i3 + 1] = minY + Math.random() * (maxY - minY)
    this.positions[i3 + 2] = minZ + Math.random() * (maxZ - minZ)

    this.velocities[i3] = 0
    this.velocities[i3 + 1] = 0
    this.velocities[i3 + 2] = this.flowSpeed

    const gradientT = (this.positions[i3 + 2] - minZ) / (maxZ - minZ)
    const color = this.getGradientColor(gradientT)
    this.colors[i3] = color[0]
    this.colors[i3 + 1] = color[1]
    this.colors[i3 + 2] = color[2]

    this.sizes[index] = 2 + Math.random() * 2
    this.phases[index] = Math.random() * Math.PI * 2
  }

  initParticles(): void {
    for (let i = 0; i < this.count; i++) {
      this.initParticle(i)
    }
  }

  setCount(count: number): void {
    if (count === this.count) return

    const oldPositions = this.positions
    const oldVelocities = this.velocities
    const oldColors = this.colors
    const oldSizes = this.sizes
    const oldPhases = this.phases
    const oldCount = this.count

    this.count = count
    this.positions = new Float32Array(count * 3)
    this.velocities = new Float32Array(count * 3)
    this.colors = new Float32Array(count * 3)
    this.sizes = new Float32Array(count)
    this.phases = new Float32Array(count)

    const copyCount = Math.min(oldCount, count)
    for (let i = 0; i < copyCount; i++) {
      const i3 = i * 3
      this.positions[i3] = oldPositions[i3]
      this.positions[i3 + 1] = oldPositions[i3 + 1]
      this.positions[i3 + 2] = oldPositions[i3 + 2]
      this.velocities[i3] = oldVelocities[i3]
      this.velocities[i3 + 1] = oldVelocities[i3 + 1]
      this.velocities[i3 + 2] = oldVelocities[i3 + 2]
      this.colors[i3] = oldColors[i3]
      this.colors[i3 + 1] = oldColors[i3 + 1]
      this.colors[i3 + 2] = oldColors[i3 + 2]
      this.sizes[i] = oldSizes[i]
      this.phases[i] = oldPhases[i]
    }

    for (let i = oldCount; i < count; i++) {
      this.initParticle(i)
    }
  }

  setFlowSpeed(speed: number): void {
    this.flowSpeed = speed
  }

  setColorPalette(palette: string[]): void {
    this.colorPalette = palette
    const { minZ, maxZ } = this.bounds
    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3
      const gradientT = (this.positions[i3 + 2] - minZ) / (maxZ - minZ)
      const color = this.getGradientColor(gradientT)
      this.colors[i3] = color[0]
      this.colors[i3 + 1] = color[1]
      this.colors[i3 + 2] = color[2]
    }
  }

  update(delta: number, forceField?: ForceFieldInput): void {
    this.time += delta

    const { minX, maxX, minY, maxY, minZ, maxZ } = this.bounds
    const waveAmp = this.waveAmplitude
    const waveFreq = this.waveFrequency

    if (forceField && forceField.strength > 0) {
      const params: ForceFieldParams = {
        x: forceField.x,
        y: forceField.y,
        forceX: forceField.forceX,
        forceY: forceField.forceY,
        strength: forceField.strength,
        radius: forceField.radius
      }
      applyForce(this.velocities, this.positions, params)
    }

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3

      const baseVelZ = this.flowSpeed
      const velDamping = 0.98
      this.velocities[i3] *= velDamping
      this.velocities[i3 + 1] *= velDamping
      this.velocities[i3 + 2] = baseVelZ + (this.velocities[i3 + 2] - baseVelZ) * velDamping

      const waveOffset = Math.sin(this.time * waveFreq + this.phases[i]) * waveAmp * delta
      this.positions[i3] += this.velocities[i3] * delta + waveOffset * 0.3
      this.positions[i3 + 1] += this.velocities[i3 + 1] * delta + waveOffset * 0.2
      this.positions[i3 + 2] += this.velocities[i3 + 2] * delta

      if (this.positions[i3 + 2] > maxZ) {
        this.positions[i3] = minX + Math.random() * (maxX - minX)
        this.positions[i3 + 1] = minY + Math.random() * (maxY - minY)
        this.positions[i3 + 2] = minZ

        this.velocities[i3] = 0
        this.velocities[i3 + 1] = 0
        this.velocities[i3 + 2] = this.flowSpeed

        const color = this.getGradientColor(0)
        this.colors[i3] = color[0]
        this.colors[i3 + 1] = color[1]
        this.colors[i3 + 2] = color[2]

        this.phases[i] = Math.random() * Math.PI * 2
      }

      if (this.positions[i3] < minX) this.positions[i3] = maxX
      if (this.positions[i3] > maxX) this.positions[i3] = minX
      if (this.positions[i3 + 1] < minY) this.positions[i3 + 1] = maxY
      if (this.positions[i3 + 1] > maxY) this.positions[i3 + 1] = minY
    }
  }

  getPositions(): Float32Array {
    return this.positions
  }

  getColors(): Float32Array {
    return this.colors
  }

  getSizes(): Float32Array {
    return this.sizes
  }
}
