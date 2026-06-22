import * as THREE from 'three'
import { Particle, DynamicMode, EngineConfig } from './types'

const DEFAULT_CONFIG: EngineConfig = {
  particleCount: 200,
  connectionDistance: 80,
  rotationPeriod: 30,
  gravityRadius: 200,
  trailLength: 8,
  cellSize: 80,
}

export class ParticleEngine {
  private particles: Particle[] = []
  private config: EngineConfig
  private sceneBound: number = 300
  private spaceHash: Map<string, number[]> = new Map()
  private transitionTime: number = 0
  private transitionDuration: number = 2
  private isTransitioning: boolean = false
  private transitionStartPositions: THREE.Vector3[] = []
  private transitionEndPositions: THREE.Vector3[] = []
  private transitionProgress: number = 0
  public dynamicMode: DynamicMode = 'free'
  public mouseWorldPos: THREE.Vector3 = new THREE.Vector3()
  private modeTransitionTime: number = 0
  private modeTransitionDuration: number = 0.8
  private isModeTransitioning: boolean = false
  private prevMode: DynamicMode = 'free'
  private nextMode: DynamicMode = 'free'
  private constellationParticlesMap: Map<number, number> = new Map()

  constructor(config?: Partial<EngineConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.initParticles()
  }

  private initParticles() {
    for (let i = 0; i < this.config.particleCount; i++) {
      const position = new THREE.Vector3(
        (Math.random() - 0.5) * this.sceneBound * 2,
        (Math.random() - 0.5) * this.sceneBound * 2,
        (Math.random() - 0.5) * this.sceneBound * 2
      )
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3
      )
      this.particles.push({
        id: i,
        position,
        velocity,
        color: new THREE.Color(0xffffff),
        radius: 3 + Math.random() * 2,
        state: 'normal',
        trail: [],
        isDragging: false,
      })
    }
  }

  public getParticles(): Particle[] {
    return this.particles
  }

  public getConfig(): EngineConfig {
    return this.config
  }

  private buildSpaceHash() {
    this.spaceHash.clear()
    const cellSize = this.config.cellSize

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i]
      const key = this.getHashKey(p.position, cellSize)
      if (!this.spaceHash.has(key)) {
        this.spaceHash.set(key, [])
      }
      this.spaceHash.get(key)!.push(i)
    }
  }

  private getHashKey(pos: THREE.Vector3, cellSize: number): string {
    const cx = Math.floor(pos.x / cellSize)
    const cy = Math.floor(pos.y / cellSize)
    const cz = Math.floor(pos.z / cellSize)
    return `${cx},${cy},${cz}`
  }

  private getNeighborParticles(index: number): number[] {
    const neighbors: number[] = []
    const p = this.particles[index]
    const cellSize = this.config.cellSize
    const cx = Math.floor(p.position.x / cellSize)
    const cy = Math.floor(p.position.y / cellSize)
    const cz = Math.floor(p.position.z / cellSize)

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const key = `${cx + dx},${cy + dy},${cz + dz}`
          const cell = this.spaceHash.get(key)
          if (cell) {
            for (const j of cell) {
              if (j !== index) {
                neighbors.push(j)
              }
            }
          }
        }
      }
    }
    return neighbors
  }

  public startTransition(targetPoints: THREE.Vector3[]) {
    this.isTransitioning = true
    this.transitionProgress = 0
    this.constellationParticlesMap.clear()

    const shuffled = [...Array(this.particles.length).keys()].sort(() => Math.random() - 0.5)
    
    this.transitionStartPositions = this.particles.map(p => p.position.clone())
    this.transitionEndPositions = new Array(this.particles.length)

    for (let i = 0; i < this.particles.length; i++) {
      const particleIdx = shuffled[i]
      if (i < targetPoints.length) {
        this.transitionEndPositions[particleIdx] = targetPoints[i].clone()
        this.constellationParticlesMap.set(particleIdx, i)
      } else {
        const basePoint = targetPoints[i % targetPoints.length]
        const offset = new THREE.Vector3(
          (Math.random() - 0.5) * 30,
          (Math.random() - 0.5) * 30,
          (Math.random() - 0.5) * 30
        )
        this.transitionEndPositions[particleIdx] = basePoint.clone().add(offset)
      }
      this.particles[particleIdx].state = 'transitioning'
    }
  }

  private bezierEase(t: number): number {
    return t * t * (3 - 2 * t)
  }

  private updateTransitions(delta: number) {
    if (this.isTransitioning) {
      this.transitionProgress += delta / this.transitionDuration
      if (this.transitionProgress >= 1) {
        this.transitionProgress = 1
        this.isTransitioning = false
        for (const p of this.particles) {
          if (p.state === 'transitioning') {
            p.state = 'normal'
          }
        }
      }

      const t = this.bezierEase(this.transitionProgress)
      for (let i = 0; i < this.particles.length; i++) {
        if (this.particles[i].state === 'transitioning') {
          const start = this.transitionStartPositions[i]
          const end = this.transitionEndPositions[i]
          this.particles[i].position.lerpVectors(start, end, t)
          this.particles[i].velocity.set(0, 0, 0)
        }
      }
    }

    if (this.isModeTransitioning) {
      this.modeTransitionTime += delta
      const t = Math.min(this.modeTransitionTime / this.modeTransitionDuration, 1)
      if (t >= 1) {
        this.isModeTransitioning = false
        this.dynamicMode = this.nextMode
      }
      this.updateParticleColors(t)
    }
  }

  private updateParticleColors(t: number) {
    for (const p of this.particles) {
      if (p.state === 'selected' || p.state === 'dragging') continue
      
      const fromColor = this.getModeColor(this.prevMode)
      const toColor = this.getModeColor(this.nextMode)
      const r = fromColor.r + (toColor.r - fromColor.r) * t
      const g = fromColor.g + (toColor.g - fromColor.g) * t
      const b = fromColor.b + (toColor.b - fromColor.b) * t
      p.color.setRGB(r, g, b)
    }
  }

  private getModeColor(mode: DynamicMode): THREE.Color {
    if (mode === 'free') return new THREE.Color(0xffffff)
    return new THREE.Color(0x6C63FF)
  }

  public setDynamicMode(mode: DynamicMode) {
    if (mode === this.dynamicMode) return
    this.prevMode = this.isModeTransitioning ? this.nextMode : this.dynamicMode
    this.nextMode = mode
    this.modeTransitionTime = 0
    this.isModeTransitioning = true
  }

  public getEffectiveMode(): DynamicMode {
    return this.isModeTransitioning ? this.nextMode : this.dynamicMode
  }

  public isModeInTransition(): boolean {
    return this.isModeTransitioning
  }

  private updateFreeMode(delta: number) {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i]
      if (p.state === 'transitioning' || p.isDragging) continue

      p.velocity.x += (Math.random() - 0.5) * 0.01
      p.velocity.y += (Math.random() - 0.5) * 0.01
      p.velocity.z += (Math.random() - 0.5) * 0.01

      p.velocity.multiplyScalar(0.99)

      const maxSpeed = 1.5
      const speed = p.velocity.length()
      if (speed > maxSpeed) {
        p.velocity.normalize().multiplyScalar(maxSpeed)
      }
    }
  }

  private updateGravityMode(delta: number) {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i]
      if (p.state === 'transitioning' || p.isDragging) continue

      const dir = new THREE.Vector3().subVectors(this.mouseWorldPos, p.position)
      const dist = dir.length()

      if (dist < this.config.gravityRadius && dist > 1) {
        const strength = (1 - dist / this.config.gravityRadius) * 0.5
        dir.normalize().multiplyScalar(strength)
        p.velocity.add(dir)
      }

      p.velocity.multiplyScalar(0.97)

      const maxSpeed = 2.5
      const speed = p.velocity.length()
      if (speed > maxSpeed) {
        p.velocity.normalize().multiplyScalar(maxSpeed)
      }
    }
  }

  private handleCollisions() {
    this.buildSpaceHash()
    
    const checked = new Set<string>()
    
    for (let i = 0; i < this.particles.length; i++) {
      const p1 = this.particles[i]
      if (p1.isDragging) continue
      
      const neighbors = this.getNeighborParticles(i)
      
      for (const j of neighbors) {
        if (i >= j) continue
        const key = `${i}-${j}`
        if (checked.has(key)) continue
        checked.add(key)
        
        const p2 = this.particles[j]
        if (p2.isDragging) continue

        const diff = new THREE.Vector3().subVectors(p1.position, p2.position)
        const dist = diff.length()
        const minDist = (p1.radius + p2.radius) * 0.5

        if (dist < minDist && dist > 0) {
          const overlap = (minDist - dist) / 2
          const normal = diff.clone().normalize()
          
          if (p1.state !== 'transitioning') {
            p1.position.add(normal.clone().multiplyScalar(overlap))
          }
          if (p2.state !== 'transitioning') {
            p2.position.add(normal.clone().multiplyScalar(-overlap))
          }

          const v1n = p1.velocity.dot(normal)
          const v2n = p2.velocity.dot(normal)

          if (v1n - v2n > 0) {
            const restitution = 0.8
            const m1 = p1.radius * p1.radius
            const m2 = p2.radius * p2.radius
            const totalMass = m1 + m2

            const v1After = ((m1 - m2) * v1n + 2 * m2 * v2n) / totalMass
            const v2After = ((m2 - m1) * v2n + 2 * m1 * v1n) / totalMass

            if (p1.state !== 'transitioning') {
              p1.velocity.add(normal.clone().multiplyScalar((v1After - v1n) * restitution))
            }
            if (p2.state !== 'transitioning') {
              p2.velocity.add(normal.clone().multiplyScalar((v2After - v2n) * restitution))
            }
          }
        }
      }
    }
  }

  private enforceBounds() {
    for (const p of this.particles) {
      if (p.state === 'transitioning' || p.isDragging) continue

      const bound = this.sceneBound
      const bounce = 0.5

      if (p.position.x > bound) {
        p.position.x = bound
        p.velocity.x *= -bounce
      } else if (p.position.x < -bound) {
        p.position.x = -bound
        p.velocity.x *= -bounce
      }

      if (p.position.y > bound) {
        p.position.y = bound
        p.velocity.y *= -bounce
      } else if (p.position.y < -bound) {
        p.position.y = -bound
        p.velocity.y *= -bounce
      }

      if (p.position.z > bound) {
        p.position.z = bound
        p.velocity.z *= -bounce
      } else if (p.position.z < -bound) {
        p.position.z = -bound
        p.velocity.z *= -bounce
      }
    }
  }

  private updatePositions(delta: number) {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i]
      if (p.state === 'transitioning' || p.isDragging) continue

      p.position.add(p.velocity.clone().multiplyScalar(delta * 60))

      if (p.state === 'dragging' || (p.state === 'selected' && p.trail.length > 0)) {
        p.trail.unshift(p.position.clone())
        if (p.trail.length > this.config.trailLength) {
          p.trail.pop()
        }
      }
    }
  }

  public setDragging(id: number, isDragging: boolean) {
    const p = this.particles.find(part => part.id === id)
    if (p) {
      p.isDragging = isDragging
      if (isDragging) {
        p.state = 'dragging'
        p.trail = [p.position.clone()]
        p.velocity.set(0, 0, 0)
      } else {
        p.state = 'selected'
      }
    }
  }

  public moveParticleTo(id: number, target: THREE.Vector3, withLag: boolean = true) {
    const p = this.particles.find(part => part.id === id)
    if (p) {
      if (withLag) {
        p.position.lerp(target, 0.1)
      } else {
        p.position.copy(target)
      }
      p.trail.unshift(p.position.clone())
      if (p.trail.length > this.config.trailLength) {
        p.trail.pop()
      }
    }
  }

  public selectParticle(id: number | null) {
    for (const p of this.particles) {
      if (p.state !== 'transitioning') {
        if (p.id === id) {
          p.state = 'selected'
        } else if (p.state === 'selected' || p.state === 'dragging') {
          p.state = 'normal'
          p.trail = []
        }
      }
    }
  }

  public getSelectedParticleId(): number | null {
    const selected = this.particles.find(p => p.state === 'selected' || p.state === 'dragging')
    return selected ? selected.id : null
  }

  public getKineticEnergy(id: number): number {
    const p = this.particles.find(part => part.id === id)
    if (!p) return 0
    const speed = p.velocity.length()
    return 0.5 * (p.radius * p.radius) * speed * speed
  }

  public update(delta: number) {
    this.updateTransitions(delta)

    const effectiveMode = this.getEffectiveMode()
    if (effectiveMode === 'free') {
      this.updateFreeMode(delta)
    } else {
      this.updateGravityMode(delta)
    }

    this.handleCollisions()
    this.updatePositions(delta)
    this.enforceBounds()
  }

  public getConnections(): { from: THREE.Vector3; to: THREE.Vector3; opacity: number }[] {
    const connections: { from: THREE.Vector3; to: THREE.Vector3; opacity: number }[] = []
    const maxDist = this.config.connectionDistance

    this.buildSpaceHash()
    const checked = new Set<string>()

    for (let i = 0; i < this.particles.length; i++) {
      const p1 = this.particles[i]
      const neighbors = this.getNeighborParticles(i)

      for (const j of neighbors) {
        if (i >= j) continue
        const key = `${i}-${j}`
        if (checked.has(key)) continue
        checked.add(key)

        const p2 = this.particles[j]
        const dist = p1.position.distanceTo(p2.position)

        if (dist < maxDist) {
          const opacity = 0.6 * (1 - dist / maxDist)
          connections.push({
            from: p1.position,
            to: p2.position,
            opacity,
          })
        }
      }
    }

    return connections
  }

  public getRotationAngle(time: number): number {
    return (time / this.config.rotationPeriod) * Math.PI * 2
  }
}
