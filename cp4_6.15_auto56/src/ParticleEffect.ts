import * as THREE from 'three'

export type PhaseType = 'interphase' | 'prophase' | 'metaphase' | 'anaphase' | 'telophase'

export class ParticleEffect {
  private scene: THREE.Scene
  private points: THREE.Points | null = null
  private geometry: THREE.BufferGeometry | null = null
  private material: THREE.PointsMaterial | null = null

  private positions: Float32Array = new Float32Array(0)
  private velocities: Float32Array = new Float32Array(0)
  private colors: Float32Array = new Float32Array(0)
  private lifetimes: Float32Array = new Float32Array(0)
  private sizes: Float32Array = new Float32Array(0)

  private maxParticles = 2000
  private activeCount = 0

  private isNuclearDissolving = false
  private isNuclearReforming = false
  private isFlashing = false
  private flashAlpha = 0

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.init()
  }

  private init(): void {
    this.geometry = new THREE.BufferGeometry()
    this.positions = new Float32Array(this.maxParticles * 3)
    this.velocities = new Float32Array(this.maxParticles * 3)
    this.colors = new Float32Array(this.maxParticles * 3)
    this.lifetimes = new Float32Array(this.maxParticles)
    this.sizes = new Float32Array(this.maxParticles)

    for (let i = 0; i < this.maxParticles; i++) {
      this.positions[i * 3] = 0
      this.positions[i * 3 + 1] = 0
      this.positions[i * 3 + 2] = 0
      this.lifetimes[i] = -1
      this.sizes[i] = 0.02
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3))
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1))

    this.material = new THREE.PointsMaterial({
      size: 0.03,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      depthWrite: false
    })

    this.points = new THREE.Points(this.geometry, this.material)
    this.scene.add(this.points)
  }

  public triggerNuclearDissolution(center: THREE.Vector3, radius: number): void {
    this.isNuclearDissolving = true
    this.isNuclearReforming = false
    const count = Math.min(800, this.maxParticles - this.activeCount)

    for (let i = 0; i < count; i++) {
      const idx = this.findInactiveIndex()
      if (idx === -1) break

      const phi = Math.acos(2 * Math.random() - 1)
      const theta = Math.random() * Math.PI * 2
      const r = radius * (0.5 + Math.random() * 0.5)

      this.positions[idx * 3] = center.x + r * Math.sin(phi) * Math.cos(theta)
      this.positions[idx * 3 + 1] = center.y + r * Math.sin(phi) * Math.sin(theta)
      this.positions[idx * 3 + 2] = center.z + r * Math.cos(phi)

      const speed = 0.15 + Math.random() * 0.3
      const vphi = Math.acos(2 * Math.random() - 1)
      const vtheta = Math.random() * Math.PI * 2

      this.velocities[idx * 3] = speed * Math.sin(vphi) * Math.cos(vtheta)
      this.velocities[idx * 3 + 1] = speed * Math.sin(vphi) * Math.sin(vtheta)
      this.velocities[idx * 3 + 2] = speed * Math.cos(vphi)

      const shade = 0.5 + Math.random() * 0.5
      this.colors[idx * 3] = 0.55 * shade
      this.colors[idx * 3 + 1] = 0.35 * shade
      this.colors[idx * 3 + 2] = 0.9 * shade

      this.lifetimes[idx] = 4.0 + Math.random() * 1.5
      this.sizes[idx] = 0.015 + Math.random() * 0.025
      this.activeCount++
    }

    this.updateAttributes()
  }

  public triggerNuclearReformation(centers: THREE.Vector3[], radius: number): void {
    this.isNuclearReforming = true
    this.isNuclearDissolving = false
    const countPerCenter = Math.min(400, Math.floor((this.maxParticles - this.activeCount) / centers.length))

    centers.forEach(center => {
      for (let i = 0; i < countPerCenter; i++) {
        const idx = this.findInactiveIndex()
        if (idx === -1) break

        const phi = Math.acos(2 * Math.random() - 1)
        const theta = Math.random() * Math.PI * 2
        const r = radius * 1.8 + Math.random() * 0.8

        this.positions[idx * 3] = center.x + r * Math.sin(phi) * Math.cos(theta)
        this.positions[idx * 3 + 1] = center.y + r * Math.sin(phi) * Math.sin(theta)
        this.positions[idx * 3 + 2] = center.z + r * Math.cos(phi)

        const speed = 0.12 + Math.random() * 0.15
        const dx = center.x - this.positions[idx * 3]
        const dy = center.y - this.positions[idx * 3 + 1]
        const dz = center.z - this.positions[idx * 3 + 2]
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1

        this.velocities[idx * 3] = (dx / len) * speed
        this.velocities[idx * 3 + 1] = (dy / len) * speed
        this.velocities[idx * 3 + 2] = (dz / len) * speed

        const shade = 0.5 + Math.random() * 0.5
        this.colors[idx * 3] = 0.55 * shade
        this.colors[idx * 3 + 1] = 0.35 * shade
        this.colors[idx * 3 + 2] = 0.9 * shade

        this.lifetimes[idx] = 4.5 + Math.random() * 1.5
        this.sizes[idx] = 0.015 + Math.random() * 0.02
        this.activeCount++
      }
    })

    this.updateAttributes()
  }

  public triggerFlash(): void {
    this.isFlashing = true
    this.flashAlpha = 1.0
  }

  public getFlashAlpha(): number {
    return this.flashAlpha
  }

  private findInactiveIndex(): number {
    for (let i = 0; i < this.maxParticles; i++) {
      if (this.lifetimes[i] <= 0) return i
    }
    return -1
  }

  private updateAttributes(): void {
    if (!this.geometry) return
    const posAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute
    const colAttr = this.geometry.getAttribute('color') as THREE.BufferAttribute
    const sizeAttr = this.geometry.getAttribute('size') as THREE.BufferAttribute
    posAttr.needsUpdate = true
    colAttr.needsUpdate = true
    sizeAttr.needsUpdate = true
  }

  public update(delta: number): void {
    for (let i = 0; i < this.maxParticles; i++) {
      if (this.lifetimes[i] > 0) {
        this.positions[i * 3] += this.velocities[i * 3] * delta
        this.positions[i * 3 + 1] += this.velocities[i * 3 + 1] * delta
        this.positions[i * 3 + 2] += this.velocities[i * 3 + 2] * delta

        this.velocities[i * 3] *= 0.98
        this.velocities[i * 3 + 1] *= 0.98
        this.velocities[i * 3 + 2] *= 0.98

        this.lifetimes[i] -= delta
        this.sizes[i] *= 0.995

        if (this.lifetimes[i] <= 0) {
          this.activeCount--
          this.sizes[i] = 0
        }
      }
    }

    if (this.isFlashing) {
      this.flashAlpha -= delta * 2.5
      if (this.flashAlpha <= 0) {
        this.flashAlpha = 0
        this.isFlashing = false
      }
    }

    this.updateAttributes()
  }

  public dispose(): void {
    if (this.points) {
      this.scene.remove(this.points)
      this.points.geometry.dispose()
      if (this.points.material instanceof THREE.Material) {
        this.points.material.dispose()
      }
    }
    if (this.geometry) this.geometry.dispose()
    if (this.material) this.material.dispose()
  }
}
