import type { EmitterConfig, PhysicsConfig, GradientMode } from '../store/useSimulationStore'

const MAX_PARTICLES = 15000

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.substring(0, 2), 16) / 255,
    parseInt(h.substring(2, 4), 16) / 255,
    parseInt(h.substring(4, 6), 16) / 255,
  ]
}

function applyGradient(t: number, mode: GradientMode): number {
  if (mode === 'exponential') {
    return t * t
  }
  return t
}

export class ParticleSystem {
  private posX: Float32Array
  private posY: Float32Array
  private posZ: Float32Array
  private velX: Float32Array
  private velY: Float32Array
  private velZ: Float32Array
  private age: Float32Array
  private lifetime: Float32Array
  private colR0: Float32Array
  private colG0: Float32Array
  private colB0: Float32Array
  private colR1: Float32Array
  private colG1: Float32Array
  private colB1: Float32Array
  private sizeArr: Float32Array
  private alive: Uint8Array
  private gradientMode: Uint8Array

  renderPositions: Float32Array
  renderColors: Float32Array
  renderSizes: Float32Array
  aliveCount: number = 0

  private emitAccumulators: Map<string, number> = new Map()
  private time: number = 0

  constructor() {
    this.posX = new Float32Array(MAX_PARTICLES)
    this.posY = new Float32Array(MAX_PARTICLES)
    this.posZ = new Float32Array(MAX_PARTICLES)
    this.velX = new Float32Array(MAX_PARTICLES)
    this.velY = new Float32Array(MAX_PARTICLES)
    this.velZ = new Float32Array(MAX_PARTICLES)
    this.age = new Float32Array(MAX_PARTICLES)
    this.lifetime = new Float32Array(MAX_PARTICLES)
    this.colR0 = new Float32Array(MAX_PARTICLES)
    this.colG0 = new Float32Array(MAX_PARTICLES)
    this.colB0 = new Float32Array(MAX_PARTICLES)
    this.colR1 = new Float32Array(MAX_PARTICLES)
    this.colG1 = new Float32Array(MAX_PARTICLES)
    this.colB1 = new Float32Array(MAX_PARTICLES)
    this.sizeArr = new Float32Array(MAX_PARTICLES)
    this.alive = new Uint8Array(MAX_PARTICLES)
    this.gradientMode = new Uint8Array(MAX_PARTICLES)

    this.renderPositions = new Float32Array(MAX_PARTICLES * 3)
    this.renderColors = new Float32Array(MAX_PARTICLES * 4)
    this.renderSizes = new Float32Array(MAX_PARTICLES)
  }

  private findDeadSlot(): number {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (!this.alive[i]) return i
    }
    return -1
  }

  private spawnParticle(emitter: EmitterConfig, slot: number) {
    const spread = 0.15
    this.posX[slot] = emitter.position[0] + (Math.random() - 0.5) * spread
    this.posY[slot] = emitter.position[1] + (Math.random() - 0.5) * spread
    this.posZ[slot] = emitter.position[2] + (Math.random() - 0.5) * spread

    const vSpread = 0.3
    this.velX[slot] = emitter.velocity[0] + (Math.random() - 0.5) * vSpread
    this.velY[slot] = emitter.velocity[1] + (Math.random() - 0.5) * vSpread
    this.velZ[slot] = emitter.velocity[2] + (Math.random() - 0.5) * vSpread

    this.age[slot] = 0
    this.lifetime[slot] = emitter.lifetime + (Math.random() - 0.5) * 1.0

    const c0 = hexToRgb(emitter.colorStart)
    const c1 = hexToRgb(emitter.colorEnd)
    this.colR0[slot] = c0[0]
    this.colG0[slot] = c0[1]
    this.colB0[slot] = c0[2]
    this.colR1[slot] = c1[0]
    this.colG1[slot] = c1[1]
    this.colB1[slot] = c1[2]

    this.sizeArr[slot] = emitter.particleSize
    this.gradientMode[slot] = emitter.gradientMode === 'exponential' ? 1 : 0
    this.alive[slot] = 1
  }

  emit(emitter: EmitterConfig, dt: number) {
    if (!emitter.active) return
    if (this.aliveCount >= MAX_PARTICLES) return

    let acc = this.emitAccumulators.get(emitter.id) || 0
    acc += emitter.emitRate * dt
    const count = Math.floor(acc)
    acc -= count
    this.emitAccumulators.set(emitter.id, acc)

    for (let i = 0; i < count; i++) {
      if (this.aliveCount >= MAX_PARTICLES) break
      const slot = this.findDeadSlot()
      if (slot === -1) break
      this.spawnParticle(emitter, slot)
      this.aliveCount++
    }
  }

  update(physics: PhysicsConfig, dt: number): void {
    this.time += dt
    const t = this.time

    let alive = 0
    const freq = physics.vortexFrequency
    const amp = physics.vortexAmplitude

    const wDir = physics.windDirection
    const wLen = Math.sqrt(wDir[0] * wDir[0] + wDir[1] * wDir[1] + wDir[2] * wDir[2])
    const wNormX = wLen > 0.001 ? wDir[0] / wLen : 0
    const wNormY = wLen > 0.001 ? wDir[1] / wLen : 0
    const wNormZ = wLen > 0.001 ? wDir[2] / wLen : 0
    const wStr = physics.windStrength

    const gravity = physics.gravity
    const damp = Math.max(0, 1 - physics.viscosity * dt * 3)

    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (!this.alive[i]) continue

      this.age[i] += dt
      if (this.age[i] >= this.lifetime[i]) {
        this.alive[i] = 0
        continue
      }

      const px = this.posX[i]
      const py = this.posY[i]
      const pz = this.posZ[i]

      let fx = wNormX * wStr
      let fy = gravity + wNormY * wStr
      let fz = wNormZ * wStr

      fx += amp * Math.sin(freq * pz + t * 1.1) * Math.cos(freq * py * 0.7 + t * 0.8)
      fy += amp * Math.sin(freq * px * 0.9 + t * 0.9) * Math.cos(freq * pz * 0.8 + t * 0.7)
      fz += amp * Math.sin(freq * py * 0.8 + t * 1.0) * Math.cos(freq * px * 0.7 + t * 0.6)

      this.velX[i] = (this.velX[i] + fx * dt) * damp
      this.velY[i] = (this.velY[i] + fy * dt) * damp
      this.velZ[i] = (this.velZ[i] + fz * dt) * damp

      this.posX[i] += this.velX[i] * dt
      this.posY[i] += this.velY[i] * dt
      this.posZ[i] += this.velZ[i] * dt

      const tRatio = this.age[i] / this.lifetime[i]
      const fadeAlpha = 1.0 - tRatio * tRatio
      const colorT = this.gradientMode[i] === 1 ? tRatio * tRatio : tRatio

      this.renderPositions[alive * 3] = this.posX[i]
      this.renderPositions[alive * 3 + 1] = this.posY[i]
      this.renderPositions[alive * 3 + 2] = this.posZ[i]

      this.renderColors[alive * 4] = this.colR0[i] + (this.colR1[i] - this.colR0[i]) * colorT
      this.renderColors[alive * 4 + 1] = this.colG0[i] + (this.colG1[i] - this.colG0[i]) * colorT
      this.renderColors[alive * 4 + 2] = this.colB0[i] + (this.colB1[i] - this.colB0[i]) * colorT
      this.renderColors[alive * 4 + 3] = fadeAlpha * 0.85

      this.renderSizes[alive] = this.sizeArr[i] * (1.0 - tRatio * 0.4)

      alive++
    }

    this.aliveCount = alive
  }

  reset() {
    this.alive.fill(0)
    this.aliveCount = 0
    this.emitAccumulators.clear()
    this.time = 0
  }
}

export function computeParticleTrajectory(
  system: ParticleSystem,
  emitters: EmitterConfig[],
  physics: PhysicsConfig,
  dt: number
): void {
  for (const emitter of emitters) {
    system.emit(emitter, dt)
  }
  system.update(physics, dt)
}
