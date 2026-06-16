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
  public ringPoints: THREE.Points | null = null
  public ringMeshes: THREE.Mesh[] = []
  public grid: THREE.LineSegments | null = null
  public currentAngle: number
  public sunGlow: THREE.Sprite | null = null
  public sunParticles: THREE.Points | null = null
  public ringGroup: THREE.Group | null = null

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
      this.mesh.name = `Sun_Mesh`
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
      this.mesh.name = `${this.config.name}_Mesh`
    }

    this.tiltGroup = new THREE.Group()
    this.tiltGroup.name = `${this.config.name}_TiltGroup`
    this.tiltGroup.rotation.z = THREE.MathUtils.degToRad(this.config.tiltAngle)
    this.tiltGroup.add(this.mesh)

    if (this.config.hasGrid && !isSun) {
      this.createGridLines()
    }

    if (this.config.hasRing && !isSun) {
      this.createRingGeometry()
      this.createRingParticles()
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
    this.orbitLine.name = `${this.config.name}_Orbit`
    return this.orbitLine
  }

  private createGridLines(): void {
    if (!this.mesh) return

    const { radius } = this.config
    const offset = 0.008

    const gridMaterial = new THREE.LineBasicMaterial({
      color: 0xcccccc,
      transparent: true,
      opacity: 0.3,
    })

    const positions: number[] = []
    const step = THREE.MathUtils.degToRad(30)
    const segmentsCount = 64

    for (let lon = 0; lon < Math.PI; lon += step) {
      for (let i = 0; i <= segmentsCount; i++) {
        const t1 = (i / segmentsCount) * Math.PI * 2
        const t2 = ((i + 1) / segmentsCount) * Math.PI * 2

        positions.push(
          (radius + offset) * Math.sin(lon) * Math.cos(t1),
          (radius + offset) * Math.cos(lon),
          (radius + offset) * Math.sin(lon) * Math.sin(t1),
          (radius + offset) * Math.sin(lon) * Math.cos(t2),
          (radius + offset) * Math.cos(lon),
          (radius + offset) * Math.sin(lon) * Math.sin(t2)
        )
      }
    }

    for (let lat = step; lat < Math.PI; lat += step) {
      const r = (radius + offset) * Math.sin(lat)
      const y = (radius + offset) * Math.cos(lat)

      for (let i = 0; i <= segmentsCount; i++) {
        const t1 = (i / segmentsCount) * Math.PI * 2
        const t2 = ((i + 1) / segmentsCount) * Math.PI * 2

        positions.push(
          r * Math.cos(t1), y, r * Math.sin(t1),
          r * Math.cos(t2), y, r * Math.sin(t2)
        )
      }
    }

    const gridGeometry = new THREE.BufferGeometry()
    gridGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    )

    this.grid = new THREE.LineSegments(gridGeometry, gridMaterial)
    this.grid.name = `${this.config.name}_Grid`
    this.tiltGroup?.add(this.grid)
  }

  private createRingGeometry(): void {
    if (!this.mesh) return

    const { radius } = this.config
    this.ringGroup = new THREE.Group()
    this.ringGroup.name = `${this.config.name}_RingGroup`

    const ringLayers = [
      { inner: radius * 1.4, outer: radius * 1.6, opacity: 0.35, color: 0xe8d4a8 },
      { inner: radius * 1.7, outer: radius * 1.9, opacity: 0.45, color: 0xf0e0b0 },
      { inner: radius * 2.0, outer: radius * 2.1, opacity: 0.25, color: 0xd4c090 },
      { inner: radius * 1.55, outer: radius * 1.62, opacity: 0.15, color: 0xffffff },
    ]

    ringLayers.forEach((layer, index) => {
      const ringGeometry = new THREE.RingGeometry(
        layer.inner,
        layer.outer,
        128,
        1
      )

      const pos = ringGeometry.attributes.position
      const uv = ringGeometry.attributes.uv
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i)
        const y = pos.getY(i)
        const distFromCenter = Math.sqrt(x * x + y * y)
        const normalizedDist =
          (distFromCenter - layer.inner) / (layer.outer - layer.inner)
        uv.setXY(i, normalizedDist, 0.5)
      }

      const ringCanvas = document.createElement('canvas')
      ringCanvas.width = 256
      ringCanvas.height = 1
      const ringCtx = ringCanvas.getContext('2d')!
      const gradient = ringCtx.createLinearGradient(0, 0, 256, 0)
      const ringColor = new THREE.Color(layer.color)
      gradient.addColorStop(0, `rgba(${ringColor.r * 255 * 0.3},${ringColor.g * 255 * 0.3},${ringColor.b * 255 * 0.3},0)`)
      gradient.addColorStop(0.2, `rgba(${ringColor.r * 255},${ringColor.g * 255},${ringColor.b * 255},${layer.opacity})`)
      gradient.addColorStop(0.5, `rgba(${ringColor.r * 255 * 1.1},${ringColor.g * 255 * 1.1},${ringColor.b * 255},${layer.opacity * 1.2})`)
      gradient.addColorStop(0.8, `rgba(${ringColor.r * 255},${ringColor.g * 255},${ringColor.b * 255},${layer.opacity})`)
      gradient.addColorStop(1, `rgba(${ringColor.r * 255 * 0.3},${ringColor.g * 255 * 0.3},${ringColor.b * 255 * 0.3},0)`)
      ringCtx.fillStyle = gradient
      ringCtx.fillRect(0, 0, 256, 1)

      for (let px = 0; px < 256; px += 2) {
        if (Math.random() < 0.3) {
          ringCtx.fillStyle = `rgba(0,0,0,${0.3 + Math.random() * 0.3})`
          ringCtx.fillRect(px, 0, 1, 1)
        }
      }

      const ringTexture = new THREE.CanvasTexture(ringCanvas)
      ringTexture.wrapS = THREE.ClampToEdgeWrapping

      const ringMaterial = new THREE.MeshBasicMaterial({
        map: ringTexture,
        transparent: true,
        opacity: layer.opacity,
        side: THREE.DoubleSide,
        depthWrite: false,
      })

      const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial)
      ringMesh.name = `${this.config.name}_RingLayer_${index}`
      ringMesh.rotation.x = Math.PI / 2
      ringMesh.position.y = (Math.random() - 0.5) * radius * 0.02
      this.ringGroup?.add(ringMesh)
      this.ringMeshes.push(ringMesh)
    })

    this.tiltGroup?.add(this.ringGroup)
  }

  private createRingParticles(): void {
    if (!this.mesh || !this.ringGroup) return

    const { radius } = this.config
    const innerRadius = radius * 1.35
    const outerRadius = radius * 2.25
    const particleCount = 500

    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)

    const ringColor = new THREE.Color(0xe8d4a8)

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const r = innerRadius + Math.random() * (outerRadius - innerRadius)
      const yOffset = (Math.random() - 0.5) * radius * 0.08

      positions[i * 3] = Math.cos(angle) * r
      positions[i * 3 + 1] = yOffset
      positions[i * 3 + 2] = Math.sin(angle) * r

      const brightness = 0.5 + Math.random() * 0.5
      colors[i * 3] = ringColor.r * brightness
      colors[i * 3 + 1] = ringColor.g * brightness
      colors[i * 3 + 2] = ringColor.b * brightness
    }

    const ringGeometry = new THREE.BufferGeometry()
    ringGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    )
    ringGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const ringMaterial = new THREE.PointsMaterial({
      size: 0.015,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    this.ringPoints = new THREE.Points(ringGeometry, ringMaterial)
    this.ringPoints.name = `${this.config.name}_RingParticles`
    this.ringPoints.rotation.x = Math.PI / 2
    this.ringGroup.add(this.ringPoints)
  }

  private createSunGlow(): void {
    if (!this.mesh || !this.config.isSun) return

    const glowCanvas = document.createElement('canvas')
    glowCanvas.width = 512
    glowCanvas.height = 512
    const glowContext = glowCanvas.getContext('2d')!

    const gradient = glowContext.createRadialGradient(
      256,
      256,
      0,
      256,
      256,
      256
    )
    gradient.addColorStop(0.0, 'rgba(255, 220, 80, 1.0)')
    gradient.addColorStop(0.15, 'rgba(255, 180, 40, 0.7)')
    gradient.addColorStop(0.35, 'rgba(255, 140, 20, 0.35)')
    gradient.addColorStop(0.6, 'rgba(255, 100, 10, 0.12)')
    gradient.addColorStop(1.0, 'rgba(255, 60, 0, 0)')

    glowContext.fillStyle = gradient
    glowContext.fillRect(0, 0, 512, 512)

    const glowTexture = new THREE.CanvasTexture(glowCanvas)
    const glowMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    this.sunGlow = new THREE.Sprite(glowMaterial)
    this.sunGlow.scale.set(this.config.radius * 5, this.config.radius * 5, 1)
    this.sunGlow.name = 'Sun_GlowSprite'
    this.mesh.add(this.sunGlow)
  }

  private createSunParticles(): void {
    if (!this.mesh || !this.config.isSun) return

    const particleCount = 450
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    const { radius } = this.config

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = radius * (1.05 + Math.random() * 0.6)

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)

      const t = Math.random()
      colors[i * 3] = 1.0
      colors[i * 3 + 1] = 0.7 + t * 0.25
      colors[i * 3 + 2] = 0.15 + t * 0.25

      sizes[i] = 0.04 + Math.random() * 0.08
    }

    const particleGeometry = new THREE.BufferGeometry()
    particleGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    )
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const particleCanvas = document.createElement('canvas')
    particleCanvas.width = 64
    particleCanvas.height = 64
    const pCtx = particleCanvas.getContext('2d')!
    const pGradient = pCtx.createRadialGradient(32, 32, 0, 32, 32, 32)
    pGradient.addColorStop(0, 'rgba(255,255,255,1)')
    pGradient.addColorStop(0.3, 'rgba(255,220,120,0.8)')
    pGradient.addColorStop(0.7, 'rgba(255,160,40,0.3)')
    pGradient.addColorStop(1, 'rgba(255,100,0,0)')
    pCtx.fillStyle = pGradient
    pCtx.fillRect(0, 0, 64, 64)
    const particleTexture = new THREE.CanvasTexture(particleCanvas)

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.1,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })

    this.sunParticles = new THREE.Points(particleGeometry, particleMaterial)
    this.sunParticles.name = 'Sun_Particles'
    this.mesh.add(this.sunParticles)
  }

  update(deltaTime: number, timeScale: number): void {
    if (this.config.isSun) {
      if (this.sunParticles) {
        this.sunParticles.rotation.y += deltaTime * 0.08 * timeScale
        this.sunParticles.rotation.x += deltaTime * 0.03 * timeScale
      }
      if (this.mesh) {
        this.mesh.rotation.y +=
          this.config.rotationSpeed * deltaTime * timeScale
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

    this.ringPoints?.geometry.dispose()
    const rpm = this.ringPoints?.material as THREE.Material
    rpm?.dispose()

    this.ringMeshes.forEach((m) => {
      m.geometry.dispose()
      const mat = m.material as THREE.MeshBasicMaterial
      mat.map?.dispose()
      mat.dispose()
    })

    this.grid?.geometry.dispose()
    const gm = this.grid?.material as THREE.Material
    gm?.dispose()

    this.sunGlow?.material.dispose()
    const sg = this.sunGlow?.material as THREE.SpriteMaterial
    sg?.map?.dispose()

    this.sunParticles?.geometry.dispose()
    const sp = this.sunParticles?.material as THREE.PointsMaterial
    sp?.map?.dispose()
    sp?.dispose()
  }
}
