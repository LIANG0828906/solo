import { ParticleSystem } from './ParticleSystem'

export interface ExternalForce {
  position: { x: number; y: number; z: number }
  radius: number
  strength: number
  type: 'attract' | 'repel' | 'burst'
  decay: number
}

export interface BurstPulse {
  position: { x: number; y: number; z: number }
  radius: number
  maxRadius: number
  speed: number
  strength: number
  active: boolean
}

export interface LBMConfig {
  gridSize: number
  containerSize: number
  relaxation: number
  gravity: number
}

export class SimulationEngine {
  particleSystem: ParticleSystem
  containerSize: number
  externalForces: ExternalForce[]
  burstPulses: BurstPulse[]
  gridSize: number
  cellSize: number
  densityGrid: Float32Array
  velocityGrid: Float32Array
  relaxation: number
  gravity: number

  constructor(particleSystem: ParticleSystem, config: Partial<LBMConfig> = {}) {
    this.particleSystem = particleSystem
    this.containerSize = particleSystem.containerSize
    this.externalForces = []
    this.burstPulses = []

    this.gridSize = config.gridSize || 20
    this.cellSize = this.containerSize / this.gridSize
    this.relaxation = config.relaxation || 1.0
    this.gravity = config.gravity || -0.05

    const gridCount = this.gridSize * this.gridSize * this.gridSize
    this.densityGrid = new Float32Array(gridCount)
    this.velocityGrid = new Float32Array(gridCount * 3)
  }

  addExternalForce(force: ExternalForce) {
    this.externalForces.push(force)
  }

  clearExternalForces() {
    this.externalForces = []
  }

  addBurstPulse(position: { x: number; y: number; z: number }) {
    this.burstPulses.push({
      position: { ...position },
      radius: 0,
      maxRadius: 10,
      speed: 5,
      strength: 80,
      active: true
    })
  }

  getGridIndex(x: number, y: number, z: number): number {
    const half = this.gridSize / 2
    const ix = Math.floor(x / this.cellSize + half)
    const iy = Math.floor(y / this.cellSize + half)
    const iz = Math.floor(z / this.cellSize + half)
    const clampedX = Math.max(0, Math.min(this.gridSize - 1, ix))
    const clampedY = Math.max(0, Math.min(this.gridSize - 1, iy))
    const clampedZ = Math.max(0, Math.min(this.gridSize - 1, iz))
    return clampedX + clampedY * this.gridSize + clampedZ * this.gridSize * this.gridSize
  }

  resetGrid() {
    this.densityGrid.fill(0)
    this.velocityGrid.fill(0)
  }

  particlesToGrid() {
    const positions = this.particleSystem.positions
    const velocities = this.particleSystem.velocities
    const count = this.particleSystem.count

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const px = positions[i3]
      const py = positions[i3 + 1]
      const pz = positions[i3 + 2]

      const idx = this.getGridIndex(px, py, pz)
      this.densityGrid[idx] += 1

      const idx3 = idx * 3
      this.velocityGrid[idx3] += velocities[i3]
      this.velocityGrid[idx3 + 1] += velocities[i3 + 1]
      this.velocityGrid[idx3 + 2] += velocities[i3 + 2]
    }

    for (let i = 0; i < this.densityGrid.length; i++) {
      const density = this.densityGrid[i]
      if (density > 0) {
        const i3 = i * 3
        this.velocityGrid[i3] /= density
        this.velocityGrid[i3 + 1] /= density
        this.velocityGrid[i3 + 2] /= density
      }
    }
  }

  collideAndStream() {
    const gridCount = this.densityGrid.length
    
    const tempDensity = new Float32Array(gridCount)
    const tempVelocity = new Float32Array(gridCount * 3)

    for (let z = 0; z < this.gridSize; z++) {
      for (let y = 0; y < this.gridSize; y++) {
        for (let x = 0; x < this.gridSize; x++) {
          const idx = x + y * this.gridSize + z * this.gridSize * this.gridSize
          const idx3 = idx * 3

          let density = this.densityGrid[idx]
          let vx = this.velocityGrid[idx3]
          let vy = this.velocityGrid[idx3 + 1]
          let vz = this.velocityGrid[idx3 + 2]

          const eqDensity = density
          const eqVx = vx * (1 - this.relaxation)
          const eqVy = vy * (1 - this.relaxation)
          const eqVz = vz * (1 - this.relaxation)

          const directions = [
            [0, 0, 0],
            [1, 0, 0], [-1, 0, 0],
            [0, 1, 0], [0, -1, 0],
            [0, 0, 1], [0, 0, -1]
          ]

          for (const [dx, dy, dz] of directions) {
            const srcX = x - dx
            const srcY = y - dy
            const srcZ = z - dz

            if (
              srcX >= 0 && srcX < this.gridSize &&
              srcY >= 0 && srcY < this.gridSize &&
              srcZ >= 0 && srcZ < this.gridSize
            ) {
              const srcIdx = srcX + srcY * this.gridSize + srcZ * this.gridSize * this.gridSize
              const srcIdx3 = srcIdx * 3

              const weight = dx === 0 && dy === 0 && dz === 0 ? 1 / 7 : 1 / 7
              tempDensity[idx] += this.densityGrid[srcIdx] * weight * this.relaxation + eqDensity * (1 - this.relaxation)
              tempVelocity[idx3] += this.velocityGrid[srcIdx3] * weight * this.relaxation + eqVx * (1 - this.relaxation)
              tempVelocity[idx3 + 1] += this.velocityGrid[srcIdx3 + 1] * weight * this.relaxation + eqVy * (1 - this.relaxation)
              tempVelocity[idx3 + 2] += this.velocityGrid[srcIdx3 + 2] * weight * this.relaxation + eqVz * (1 - this.relaxation)
            }
          }
        }
      }
    }

    this.densityGrid.set(tempDensity)
    this.velocityGrid.set(tempVelocity)
  }

  gridToParticles(deltaTime: number) {
    const positions = this.particleSystem.positions
    const velocities = this.particleSystem.velocities
    const count = this.particleSystem.count
    const half = this.containerSize / 2

    for (let i = 0; i < count; i++) {
      const i3 = i * 3

      const idx = this.getGridIndex(positions[i3], positions[i3 + 1], positions[i3 + 2])
      const idx3 = idx * 3

      const gridVx = this.velocityGrid[idx3]
      const gridVy = this.velocityGrid[idx3 + 1]
      const gridVz = this.velocityGrid[idx3 + 2]

      velocities[i3] += (gridVx - velocities[i3]) * 0.1 + this.gravity * 0 * deltaTime * 60
      velocities[i3 + 1] += (gridVy - velocities[i3 + 1]) * 0.1
      velocities[i3 + 2] += (gridVz - velocities[i3 + 2]) * 0.1

      const damping = 0.98
      velocities[i3] *= damping
      velocities[i3 + 1] *= damping
      velocities[i3 + 2] *= damping

      positions[i3] += velocities[i3] * deltaTime * 60
      positions[i3 + 1] += velocities[i3 + 1] * deltaTime * 60
      positions[i3 + 2] += velocities[i3 + 2] * deltaTime * 60

      if (positions[i3] < -half + 0.5) {
        positions[i3] = -half + 0.5
        velocities[i3] *= -0.8
      }
      if (positions[i3] > half - 0.5) {
        positions[i3] = half - 0.5
        velocities[i3] *= -0.8
      }
      if (positions[i3 + 1] < -half + 0.5) {
        positions[i3 + 1] = -half + 0.5
        velocities[i3 + 1] *= -0.8
      }
      if (positions[i3 + 1] > half - 0.5) {
        positions[i3 + 1] = half - 0.5
        velocities[i3 + 1] *= -0.8
      }
      if (positions[i3 + 2] < -half + 0.5) {
        positions[i3 + 2] = -half + 0.5
        velocities[i3 + 2] *= -0.8
      }
      if (positions[i3 + 2] > half - 0.5) {
        positions[i3 + 2] = half - 0.5
        velocities[i3 + 2] *= -0.8
      }
    }
  }

  applyExternalForces(deltaTime: number) {
    const positions = this.particleSystem.positions
    const velocities = this.particleSystem.velocities
    const count = this.particleSystem.count

    for (let f = this.externalForces.length - 1; f >= 0; f--) {
      const force = this.externalForces[f]
      force.decay -= deltaTime

      if (force.decay <= 0) {
        this.externalForces.splice(f, 1)
        continue
      }

      for (let i = 0; i < count; i++) {
        const i3 = i * 3
        const dx = force.position.x - positions[i3]
        const dy = force.position.y - positions[i3 + 1]
        const dz = force.position.z - positions[i3 + 2]

        const distSq = dx * dx + dy * dy + dz * dz
        const radiusSq = force.radius * force.radius

        if (distSq < radiusSq && distSq > 0.01) {
          const dist = Math.sqrt(distSq)
          const influence = 1 - dist / force.radius
          const strength = force.strength * influence * deltaTime * 60

          const nx = dx / dist
          const ny = dy / dist
          const nz = dz / dist

          if (force.type === 'attract') {
            velocities[i3] += nx * strength
            velocities[i3 + 1] += ny * strength
            velocities[i3 + 2] += nz * strength
          } else if (force.type === 'repel') {
            velocities[i3] -= nx * strength
            velocities[i3 + 1] -= ny * strength
            velocities[i3 + 2] -= nz * strength
          }
        }
      }
    }
  }

  updateBurstPulses(deltaTime: number) {
    const positions = this.particleSystem.positions
    const velocities = this.particleSystem.velocities
    const count = this.particleSystem.count

    for (let b = this.burstPulses.length - 1; b >= 0; b--) {
      const pulse = this.burstPulses[b]
      if (!pulse.active) {
        this.burstPulses.splice(b, 1)
        continue
      }

      const prevRadius = pulse.radius
      pulse.radius += pulse.speed * deltaTime

      if (pulse.radius >= pulse.maxRadius) {
        pulse.active = false
      }

      const pulseMin = Math.max(0, prevRadius - 0.5)
      const pulseMax = pulse.radius + 0.5
      const pulseMinSq = pulseMin * pulseMin
      const pulseMaxSq = pulseMax * pulseMax

      for (let i = 0; i < count; i++) {
        const i3 = i * 3
        const dx = positions[i3] - pulse.position.x
        const dy = positions[i3 + 1] - pulse.position.y
        const dz = positions[i3 + 2] - pulse.position.z

        const distSq = dx * dx + dy * dy + dz * dz

        if (distSq >= pulseMinSq && distSq <= pulseMaxSq && distSq > 0.01) {
          const dist = Math.sqrt(distSq)
          const nx = dx / dist
          const ny = dy / dist
          const nz = dz / dist

          const ringThickness = 1
          const distFromRing = Math.abs(dist - pulse.radius)
          const influence = Math.max(0, 1 - distFromRing / ringThickness)

          const strength = pulse.strength * influence * deltaTime * 60

          velocities[i3] += nx * strength
          velocities[i3 + 1] += ny * strength
          velocities[i3 + 2] += nz * strength
        }
      }
    }
  }

  update(deltaTime: number) {
    if (this.particleSystem.isResetting) {
      return
    }

    this.resetGrid()
    this.particlesToGrid()
    this.collideAndStream()
    this.applyExternalForces(deltaTime)
    this.updateBurstPulses(deltaTime)
    this.gridToParticles(deltaTime)
  }
}
