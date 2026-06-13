import * as THREE from 'three'
import { Particle } from './particle'

export class ParticleSystem {
  particles: Particle[]
  positions: Float32Array
  colors: Float32Array
  sizes: Float32Array
  geometry: THREE.BufferGeometry
  material: THREE.PointsMaterial
  points: THREE.Points
  minParticles: number
  maxParticles: number
  maxTotal: number
  gravityStrength: number
  repulsionStrength: number
  speed: number
  private performanceCheckTime: number
  private isPaused: boolean
  private pauseEndTime: number

  constructor(scene: THREE.Scene) {
    this.particles = []
    this.minParticles = 500
    this.maxParticles = 1500
    this.maxTotal = 2000
    this.gravityStrength = 3
    this.repulsionStrength = 2
    this.speed = 1
    this.performanceCheckTime = 0
    this.isPaused = false
    this.pauseEndTime = 0

    this.positions = new Float32Array(this.maxTotal * 3)
    this.colors = new Float32Array(this.maxTotal * 3)
    this.sizes = new Float32Array(this.maxTotal)

    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3))
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1))

    this.material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })

    this.points = new THREE.Points(this.geometry, this.material)
    scene.add(this.points)

    for (let i = 0; i < 800; i++) {
      this.createParticle()
    }
  }

  createParticle(position?: THREE.Vector3): Particle {
    const particle = new Particle(position)
    if (this.particles.length < this.maxTotal) {
      this.particles.push(particle)
    }
    return particle
  }

  addParticle(particle: Particle): void {
    if (this.particles.length < this.maxTotal) {
      this.particles.push(particle)
    }
  }

  private handleParticleInteractions(deltaTime: number): void {
    const len = this.particles.length
    for (let i = 0; i < len; i++) {
      const p1 = this.particles[i]
      for (let j = i + 1; j < len; j++) {
        const p2 = this.particles[j]
        const distance = p1.distanceTo(p2)

        if (distance < 0.2) {
          const direction = new THREE.Vector3().subVectors(p2.position, p1.position).normalize()
          const force = (0.2 - distance) / 0.2

          if (distance < 0.05) {
            const repulsion = force * this.repulsionStrength * 0.01 * deltaTime
            p1.applyForce(direction.clone().multiplyScalar(-repulsion))
            p2.applyForce(direction.clone().multiplyScalar(repulsion))
          } else {
            const attraction = force * this.gravityStrength * 0.001 * deltaTime
            p1.applyForce(direction.clone().multiplyScalar(attraction))
            p2.applyForce(direction.clone().multiplyScalar(-attraction))
          }

          const energyTransfer = (0.2 - distance) * 0.0001 * deltaTime
          if (p1.energy > p2.energy) {
            p1.energy -= energyTransfer
            p2.energy += energyTransfer
          } else {
            p2.energy -= energyTransfer
            p1.energy += energyTransfer
          }
        }
      }
    }
  }

  private handleMouseField(mouseField: MouseField | null, deltaTime: number): void {
    if (!mouseField || mouseField.isExpired()) return

    for (const particle of this.particles) {
      const distance = particle.position.distanceTo(mouseField.position)
      if (distance < mouseField.radius) {
        const direction = new THREE.Vector3().subVectors(mouseField.position, particle.position).normalize()
        const force = ((mouseField.radius - distance) / mouseField.radius) * mouseField.strength * 0.01 * deltaTime
        
        if (mouseField.type === 'repel') {
          particle.applyForce(direction.clone().multiplyScalar(-force))
        } else {
          particle.applyForce(direction.clone().multiplyScalar(force))
        }
      }
    }
  }

  update(deltaTime: number, mouseField: MouseField | null, fps: number): void {
    if (this.isPaused) {
      if (Date.now() >= this.pauseEndTime) {
        this.isPaused = false
      } else {
        this.updateGeometry()
        return
      }
    }

    this.performanceCheckTime += deltaTime
    if (this.performanceCheckTime >= 5) {
      this.performanceCheckTime = 0
      if (fps < 30) {
        this.isPaused = true
        this.pauseEndTime = Date.now() + 500
      }
    }

    this.handleParticleInteractions(deltaTime)
    this.handleMouseField(mouseField, deltaTime)

    const aliveParticles: Particle[] = []
    const canReproduce = this.particles.length < this.maxParticles

    for (const particle of this.particles) {
      if (particle.update(deltaTime, this.speed)) {
        aliveParticles.push(particle)
        
        if (canReproduce && particle.canReproduce()) {
          const children = particle.reproduce()
          for (const child of children) {
            if (aliveParticles.length < this.maxParticles) {
              aliveParticles.push(child)
            }
          }
        }
      }
    }

    this.particles = aliveParticles

    while (this.particles.length < this.minParticles && this.particles.length < this.maxTotal) {
      const angle1 = Math.random() * Math.PI * 2
      const angle2 = Math.acos(2 * Math.random() - 1)
      const radius = 4.5 + Math.random() * 0.5
      const x = radius * Math.sin(angle2) * Math.cos(angle1)
      const y = radius * Math.sin(angle2) * Math.sin(angle1)
      const z = radius * Math.cos(angle2)
      this.createParticle(new THREE.Vector3(x, y, z))
    }

    this.updateGeometry()
  }

  private updateGeometry(): void {
    const len = this.particles.length

    for (let i = 0; i < len; i++) {
      const p = this.particles[i]
      this.positions[i * 3] = p.position.x
      this.positions[i * 3 + 1] = p.position.y
      this.positions[i * 3 + 2] = p.position.z

      this.colors[i * 3] = p.color.r
      this.colors[i * 3 + 1] = p.color.g
      this.colors[i * 3 + 2] = p.color.b

      this.sizes[i] = p.radius * 10
    }

    this.geometry.attributes.position.needsUpdate = true
    this.geometry.attributes.color.needsUpdate = true
    this.geometry.attributes.size.needsUpdate = true

    this.geometry.setDrawRange(0, len)
    this.geometry.computeBoundingSphere()
  }

  getParticleCount(): number {
    return this.particles.length
  }

  getAverageEnergy(): number {
    if (this.particles.length === 0) return 0
    const total = this.particles.reduce((sum, p) => sum + p.energy, 0)
    return total / this.particles.length
  }

  dispose(): void {
    this.geometry.dispose()
    this.material.dispose()
  }
}

export interface MouseField {
  position: THREE.Vector3
  type: 'attract' | 'repel'
  radius: number
  strength: number
  startTime: number
  duration: number
  isExpired(): boolean
}