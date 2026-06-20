import * as THREE from 'three'

export type PhaseType = 'interphase' | 'prophase' | 'metaphase' | 'anaphase' | 'telophase'

export class ParticleEffect {
  private scene: THREE.Scene
  private points: THREE.Points | null = null
  private geometry: THREE.BufferGeometry | null = null
  private material: THREE.ShaderMaterial | null = null

  private positions: Float32Array = new Float32Array(0)
  private velocities: Float32Array = new Float32Array(0)
  private colors: Float32Array = new Float32Array(0)
  private lifetimes: Float32Array = new Float32Array(0)
  private initialLifetimes: Float32Array = new Float32Array(0)
  private sizes: Float32Array = new Float32Array(0)

  private maxParticles = 2000
  private activeCount = 0

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
    this.initialLifetimes = new Float32Array(this.maxParticles)
    this.sizes = new Float32Array(this.maxParticles)

    for (let i = 0; i < this.maxParticles; i++) {
      this.positions[i * 3] = 0
      this.positions[i * 3 + 1] = -100
      this.positions[i * 3 + 2] = 0
      this.lifetimes[i] = 0
      this.initialLifetimes[i] = 1
      this.sizes[i] = 0
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3))
    this.geometry.setAttribute('aSize', new THREE.BufferAttribute(this.sizes, 1))
    this.geometry.setAttribute('aLife', new THREE.BufferAttribute(this.lifetimes, 1))
    this.geometry.setAttribute('aInitLife', new THREE.BufferAttribute(this.initialLifetimes, 1))

    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
      },
      vertexShader: `
        attribute float aSize;
        attribute float aLife;
        attribute float aInitLife;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uPixelRatio;
        void main() {
          vColor = color;
          float lifeRatio = clamp(aLife / aInitLife, 0.0, 1.0);
          vAlpha = lifeRatio * lifeRatio;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float size = aSize * (300.0 / -mvPosition.z) * uPixelRatio;
          size *= 0.5 + lifeRatio * 0.5;
          gl_PointSize = size;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float dist = length(c);
          if (dist > 0.5) discard;
          float alpha = (1.0 - dist * 2.0) * vAlpha;
          alpha = smoothstep(0.0, 0.6, alpha);
          vec3 glow = vColor * (1.0 - dist * 1.5);
          gl_FragColor = vec4(glow + vColor * 0.3, alpha);
        }
      `,
      vertexColors: true
    })

    this.points = new THREE.Points(this.geometry, this.material)
    this.scene.add(this.points)
  }

  public triggerNuclearDissolution(center: THREE.Vector3, radius: number): void {
    const count = Math.min(900, this.maxParticles - this.activeCount)

    for (let i = 0; i < count; i++) {
      const idx = this.findInactiveIndex()
      if (idx === -1) break

      const phi = Math.acos(2 * Math.random() - 1)
      const theta = Math.random() * Math.PI * 2
      const r = radius * (0.4 + Math.random() * 0.6)

      this.positions[idx * 3] = center.x + r * Math.sin(phi) * Math.cos(theta)
      this.positions[idx * 3 + 1] = center.y + r * Math.sin(phi) * Math.sin(theta) * 0.65
      this.positions[idx * 3 + 2] = center.z + r * Math.cos(phi)

      const speed = 0.2 + Math.random() * 0.5
      const vphi = Math.acos(2 * Math.random() - 1)
      const vtheta = Math.random() * Math.PI * 2

      this.velocities[idx * 3] = speed * Math.sin(vphi) * Math.cos(vtheta)
      this.velocities[idx * 3 + 1] = speed * Math.sin(vphi) * Math.sin(vtheta) * 0.7
      this.velocities[idx * 3 + 2] = speed * Math.cos(vphi)

      const hueShift = Math.random() * 0.08 - 0.04
      const shade = 0.55 + Math.random() * 0.45
      this.colors[idx * 3] = (0.55 + hueShift) * shade
      this.colors[idx * 3 + 1] = (0.35 + hueShift * 0.5) * shade
      this.colors[idx * 3 + 2] = 0.9 * shade

      const life = 2.0 + Math.random() * 1.5
      this.lifetimes[idx] = life
      this.initialLifetimes[idx] = life
      this.sizes[idx] = 0.02 + Math.random() * 0.035
      this.activeCount++
    }

    this.updateAttributes()
  }

  public triggerNuclearReformation(centers: THREE.Vector3[], radius: number): void {
    const countPerCenter = Math.min(450, Math.floor((this.maxParticles - this.activeCount) / centers.length))

    centers.forEach(center => {
      for (let i = 0; i < countPerCenter; i++) {
        const idx = this.findInactiveIndex()
        if (idx === -1) break

        const phi = Math.acos(2 * Math.random() - 1)
        const theta = Math.random() * Math.PI * 2
        const r = radius * 2.0 + Math.random() * 1.0

        const startX = center.x + r * Math.sin(phi) * Math.cos(theta)
        const startY = center.y + r * Math.sin(phi) * Math.sin(theta) * 0.65
        const startZ = center.z + r * Math.cos(phi)

        this.positions[idx * 3] = startX
        this.positions[idx * 3 + 1] = startY
        this.positions[idx * 3 + 2] = startZ

        const speed = 0.15 + Math.random() * 0.2
        const dx = center.x - startX
        const dy = center.y - startY
        const dz = center.z - startZ
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1

        this.velocities[idx * 3] = (dx / len) * speed
        this.velocities[idx * 3 + 1] = (dy / len) * speed
        this.velocities[idx * 3 + 2] = (dz / len) * speed

        const shade = 0.5 + Math.random() * 0.5
        this.colors[idx * 3] = 0.6 * shade
        this.colors[idx * 3 + 1] = 0.4 * shade
        this.colors[idx * 3 + 2] = 0.95 * shade

        const life = 2.5 + Math.random() * 1.5
        this.lifetimes[idx] = life
        this.initialLifetimes[idx] = life
        this.sizes[idx] = 0.018 + Math.random() * 0.025
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
    const sizeAttr = this.geometry.getAttribute('aSize') as THREE.BufferAttribute
    const lifeAttr = this.geometry.getAttribute('aLife') as THREE.BufferAttribute
    const initLifeAttr = this.geometry.getAttribute('aInitLife') as THREE.BufferAttribute
    posAttr.needsUpdate = true
    colAttr.needsUpdate = true
    sizeAttr.needsUpdate = true
    lifeAttr.needsUpdate = true
    initLifeAttr.needsUpdate = true
  }

  public update(delta: number): void {
    for (let i = 0; i < this.maxParticles; i++) {
      if (this.lifetimes[i] > 0) {
        this.positions[i * 3] += this.velocities[i * 3] * delta
        this.positions[i * 3 + 1] += this.velocities[i * 3 + 1] * delta
        this.positions[i * 3 + 2] += this.velocities[i * 3 + 2] * delta

        this.velocities[i * 3] *= 0.975
        this.velocities[i * 3 + 1] *= 0.975
        this.velocities[i * 3 + 2] *= 0.975

        this.lifetimes[i] -= delta

        if (this.lifetimes[i] <= 0) {
          this.lifetimes[i] = 0
          this.positions[i * 3 + 1] = -100
          this.activeCount--
        }
      }
    }

    if (this.isFlashing) {
      this.flashAlpha -= delta * 3
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
