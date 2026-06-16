import * as THREE from 'three'

export interface PlanetConfig {
  name: string
  radius: number
  orbitRadius: number
  orbitSpeed: number
  rotationSpeed: number
  tiltAngle: number
  color: string
  orbitPeriod: number
  rotationPeriod: number
  distanceFromSun: number
  hasRing?: boolean
  isSun?: boolean
  hasGrid?: boolean
  initialAngle?: number
}

export class Planet {
  public config: PlanetConfig
  public mesh: THREE.Mesh | null = null
  public orbitLine: THREE.LineLoop | null = null
  public tiltGroup: THREE.Group | null = null
  public ring: THREE.Points | null = null
  public grid: THREE.LineSegments | null = null
  public currentAngle: number
  public sunGlow: THREE.Sprite | null = null
  public sunParticles: THREE.Points | null = null

  constructor(config: PlanetConfig) {
    this.config = config
    this.currentAngle = config.initialAngle ?? Math.random() * Math.PI * 2
  }

  createMesh(): THREE.Mesh {
    const { radius, color, isSun } = this.config

    if (isSun) {
      const sunGeometry = new THREE.SphereGeometry(radius, 48, 48)
      const sunMaterial = new THREE.MeshBasicMaterial({
        color: color,
      })
      this.mesh = new THREE.Mesh(sunGeometry, sunMaterial)
      this.createSunGlow()
      this.createSunParticles()
    } else {
      const geometry = new THREE.SphereGeometry(radius, 32, 32)
      const material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.8,
        metalness: 0.1,
      })
      this.mesh = new THREE.Mesh(geometry, material)
    }

    this.tiltGroup = new THREE.Group()
    this.tiltGroup.rotation.z = THREE.MathUtils.degToRad(this.config.tiltAngle)
    this.tiltGroup.add(this.mesh)

    if (this.config.hasGrid && !isSun) {
      this.createGridLines()
    }

    if (this.config.hasRing && !isSun) {
      this.createRing()
    }

    return this.mesh
  }

  createOrbitLine(): THREE.LineLoop {
    const { orbitRadius } = this.config
    const segments = 128
    const points: THREE.Vector3[] = []

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      points.push(
        new THREE.Vector3(
          Math.cos(angle) * orbitRadius,
          0,
          Math.sin(angle) * orbitRadius
        )
      )
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.15,
      linewidth: 1,
    })

    this.orbitLine = new THREE.LineLoop(geometry, material)
    return this.orbitLine
  }

  private createGridLines(): void {
    if (!this.mesh) return

    const { radius } = this.config
    const gridMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.2,
    })

    const gridGroup = new THREE.Group()
    const meridians = 12
    const parallels = 6

    for (let i = 0; i < meridians; i++) {
      const angle = (i / meridians) * Math.PI
      const meridianPoints: THREE.Vector3[] = []

      for (let j = 0; j <= 64; j++) {
        const phi = (j / 64) * Math.PI * 2
        meridianPoints.push(
          new THREE.Vector3(
            radius * Math.cos(phi) * Math.sin(angle) + 0.005,
            radius * Math.cos(angle) + 0.005,
            radius * Math.sin(phi) * Math.sin(angle) + 0.005
          )
        )
      }

      const meridianGeometry = new THREE.BufferGeometry().setFromPoints(
        meridianPoints
      )
      const meridian = new THREE.Line(meridianGeometry, gridMaterial)
      gridGroup.add(meridian)
    }

    for (let i = 1; i < parallels; i++) {
      const phi = (i / parallels) * Math.PI
      const r = radius * Math.sin(phi)
      const y = radius * Math.cos(phi)
      const parallelPoints: THREE.Vector3[] = []

      for (let j = 0; j <= 64; j++) {
        const theta = (j / 64) * Math.PI * 2
        parallelPoints.push(
          new THREE.Vector3(
            r * Math.cos(theta) + 0.005,
            y + 0.005,
            r * Math.sin(theta) + 0.005
          )
        )
      }

      const parallelGeometry = new THREE.BufferGeometry().setFromPoints(
        parallelPoints
      )
      const parallel = new THREE.LineLoop(parallelGeometry, gridMaterial)
      gridGroup.add(parallel)
    }

    this.grid = new THREE.LineSegments()
    this.tiltGroup?.add(gridGroup)
  }

  private createRing(): void {
    if (!this.mesh) return

    const { radius } = this.config
    const innerRadius = radius * 1.4
    const outerRadius = radius * 2.2
    const particleCount = 2000

    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)

    const ringColor = new THREE.Color(0xe8d4a8)

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const r =
        innerRadius + Math.random() * (outerRadius - innerRadius)
      const yOffset = (Math.random() - 0.5) * radius * 0.05

      positions[i * 3] = Math.cos(angle) * r
      positions[i * 3 + 1] = yOffset
      positions[i * 3 + 2] = Math.sin(angle) * r

      const brightness = 0.6 + Math.random() * 0.4
      colors[i * 3] = ringColor.r * brightness
      colors[i * 3 + 1] = ringColor.g * brightness
      colors[i * 3 + 2] = ringColor.b * brightness

      sizes[i] = Math.random() * 2 + 0.5
    }

    const ringGeometry = new THREE.BufferGeometry()
    ringGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    )
    ringGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    ringGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const ringMaterial = new THREE.PointsMaterial({
      size: 0.03,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
      depthWrite: false,
    })

    this.ring = new THREE.Points(ringGeometry, ringMaterial)
    this.ring.rotation.x = Math.PI / 2.5
    this.tiltGroup?.add(this.ring)
  }

  private createSunGlow(): void {
    if (!this.mesh || !this.config.isSun) return

    const glowCanvas = document.createElement('canvas')
    glowCanvas.width = 256
    glowCanvas.height = 256
    const glowContext = glowCanvas.getContext('2d')!

    const gradient = glowContext.createRadialGradient(
      128,
      128,
      0,
      128,
      128,
      128
    )
    gradient.addColorStop(0, 'rgba(255, 200, 50, 0.9)')
    gradient.addColorStop(0.3, 'rgba(255, 160, 30, 0.4)')
    gradient.addColorStop(0.6, 'rgba(255, 120, 20, 0.1)')
    gradient.addColorStop(1, 'rgba(255, 80, 10, 0)')

    glowContext.fillStyle = gradient
    glowContext.fillRect(0, 0, 256, 256)

    const glowTexture = new THREE.CanvasTexture(glowCanvas)
    const glowMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    this.sunGlow = new THREE.Sprite(glowMaterial)
    this.sunGlow.scale.set(this.config.radius * 4, this.config.radius * 4, 1)
    this.mesh.add(this.sunGlow)
  }

  private createSunParticles(): void {
    if (!this.mesh || !this.config.isSun) return

    const particleCount = 500
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const { radius } = this.config

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = radius * (1.1 + Math.random() * 0.5)

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)

      const t = Math.random()
      colors[i * 3] = 1.0
      colors[i * 3 + 1] = 0.7 + t * 0.3
      colors[i * 3 + 2] = 0.2 + t * 0.3
    }

    const particleGeometry = new THREE.BufferGeometry()
    particleGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    )
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })

    this.sunParticles = new THREE.Points(particleGeometry, particleMaterial)
    this.mesh.add(this.sunParticles)
  }

  update(deltaTime: number, timeScale: number): void {
    if (this.config.isSun) {
      if (this.sunParticles) {
        this.sunParticles.rotation.y += deltaTime * 0.1 * timeScale
      }
      return
    }

    this.currentAngle += this.config.orbitSpeed * deltaTime * timeScale

    const x = Math.cos(this.currentAngle) * this.config.orbitRadius
    const z = Math.sin(this.currentAngle) * this.config.orbitRadius

    if (this.tiltGroup) {
      this.tiltGroup.position.set(x, 0, z)
    } else if (this.mesh) {
      this.mesh.position.set(x, 0, z)
    }

    if (this.mesh) {
      this.mesh.rotation.y +=
        this.config.rotationSpeed * deltaTime * timeScale
    }
  }

  getPosition(): THREE.Vector3 {
    if (this.tiltGroup) {
      return this.tiltGroup.position.clone()
    }
    if (this.mesh) {
      return this.mesh.position.clone()
    }
    return new THREE.Vector3()
  }

  getWorldPosition(): THREE.Vector3 {
    if (this.tiltGroup) {
      return this.tiltGroup.getWorldPosition(new THREE.Vector3())
    }
    if (this.mesh) {
      return this.mesh.getWorldPosition(new THREE.Vector3())
    }
    return new THREE.Vector3()
  }

  dispose(): void {
    this.mesh?.geometry.dispose()
    if (this.mesh?.material) {
      const mat = this.mesh.material as THREE.Material
      mat.dispose()
    }
    this.orbitLine?.geometry.dispose()
    const orbitMat = this.orbitLine?.material as THREE.Material
    orbitMat?.dispose()
    this.ring?.geometry.dispose()
    const ringMat = this.ring?.material as THREE.Material
    ringMat?.dispose()
    this.sunGlow?.material.dispose()
    this.sunParticles?.geometry.dispose()
    const pMat = this.sunParticles?.material as THREE.Material
    pMat?.dispose()
  }
}
