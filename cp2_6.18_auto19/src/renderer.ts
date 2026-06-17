import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import EventBus from './eventBus'

const PARTICLE_SIZE = 0.8
const GLOW_SIZE_MULTIPLIER = 1.5
const GLOW_OPACITY = 0.2
const SIMPLIFIED_THRESHOLD = 4000

export class Renderer {
  private container: HTMLElement
  private eventBus: EventBus
  private areaSize: number

  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private controls: OrbitControls

  private particles: THREE.Points | null = null
  private glowParticles: THREE.Points | null = null
  private trailParticles: THREE.Points[] = []

  private minimapCanvas: HTMLCanvasElement
  private minimapCtx: CanvasRenderingContext2D

  private particleCount: number = 3000
  private trailLength: number = 3
  private simplifiedMode: boolean = false

  constructor(container: HTMLElement, eventBus: EventBus, areaSize: number) {
    this.container = container
    this.eventBus = eventBus
    this.areaSize = areaSize

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0A0A1A)
    this.scene.fog = new THREE.Fog(0x0A0A1A, 150, 300)

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    )
    this.camera.position.set(100, 120, 100)

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setClearColor(0x0A0A1A)
    container.appendChild(this.renderer.domElement)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.1
    this.controls.minDistance = 30
    this.controls.maxDistance = 300
    this.controls.maxPolarAngle = Math.PI / 2.2

    this.minimapCanvas = document.getElementById('minimap-canvas') as HTMLCanvasElement
    this.minimapCtx = this.minimapCanvas.getContext('2d')!

    this.createGround()
    this.createParticles()
    this.createLights()

    this.eventBus.on('particles:update', (data: any) => {
      this.updateParticles(data)
    })
  }

  private createGround(): void {
    const halfSize = this.areaSize / 2
    const divisions = this.areaSize / 10

    const gridHelper = new THREE.GridHelper(
      this.areaSize,
      divisions,
      0x4A5A6A,
      0x4A5A6A
    )
    gridHelper.position.y = 0
    this.scene.add(gridHelper)

    const groundGeometry = new THREE.PlaneGeometry(this.areaSize, this.areaSize)
    const groundMaterial = new THREE.MeshBasicMaterial({
      color: 0x0A0A1A,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.01
    this.scene.add(ground)

    const borderGeometry = new THREE.BufferGeometry()
    const borderVertices = new Float32Array([
      -halfSize, 0.01, -halfSize,
      halfSize, 0.01, -halfSize,
      halfSize, 0.01, halfSize,
      -halfSize, 0.01, halfSize,
      -halfSize, 0.01, -halfSize
    ])
    borderGeometry.setAttribute('position', new THREE.BufferAttribute(borderVertices, 3))
    const borderMaterial = new THREE.LineBasicMaterial({
      color: 0x00D4FF,
      transparent: true,
      opacity: 0.5
    })
    const border = new THREE.Line(borderGeometry, borderMaterial)
    this.scene.add(border)
  }

  private createParticles(): void {
    const baseSize = this.simplifiedMode ? PARTICLE_SIZE * 0.6 : PARTICLE_SIZE

    const positions = new Float32Array(this.particleCount * 3)
    const colors = new Float32Array(this.particleCount * 3)

    for (let i = 0; i < this.particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * this.areaSize
      positions[i * 3 + 1] = 0.5 + Math.random() * 2
      positions[i * 3 + 2] = (Math.random() - 0.5) * this.areaSize
      colors[i * 3] = 0.17
      colors[i * 3 + 1] = 0.61
      colors[i * 3 + 2] = 0.86
    }

    const particleGeometry = new THREE.BufferGeometry()
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const particleMaterial = new THREE.PointsMaterial({
      size: baseSize,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })

    this.particles = new THREE.Points(particleGeometry, particleMaterial)
    this.scene.add(this.particles)

    if (!this.simplifiedMode) {
      const glowGeometry = new THREE.BufferGeometry()
      glowGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3))
      glowGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3))

      const glowMaterial = new THREE.PointsMaterial({
        size: baseSize * GLOW_SIZE_MULTIPLIER,
        vertexColors: true,
        transparent: true,
        opacity: GLOW_OPACITY,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })

      this.glowParticles = new THREE.Points(glowGeometry, glowMaterial)
      this.scene.add(this.glowParticles)
    }

    this.trailParticles = []
    if (!this.simplifiedMode) {
      for (let t = 0; t < this.trailLength; t++) {
        const trailGeometry = new THREE.BufferGeometry()
        const trailPositions = new Float32Array(this.particleCount * 3)
        const trailColors = new Float32Array(this.particleCount * 3)
        for (let i = 0; i < this.particleCount * 3; i++) {
          trailPositions[i] = positions[i]
          trailColors[i] = colors[i]
        }
        trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3))
        trailGeometry.setAttribute('color', new THREE.BufferAttribute(trailColors, 3))

        const fadeFactor = (t + 1) * 0.3
        const trailMaterial = new THREE.PointsMaterial({
          size: baseSize * Math.max(0.3, 1 - fadeFactor),
          vertexColors: true,
          transparent: true,
          opacity: Math.max(0, 1 - fadeFactor),
          sizeAttenuation: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })

        const trail = new THREE.Points(trailGeometry, trailMaterial)
        this.trailParticles.push(trail)
        this.scene.add(trail)
      }
    }
  }

  private createLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    this.scene.add(ambientLight)
  }

  private updateParticles(data: any): void {
    if (!this.particles) return

    const positions = data.positions as Float32Array
    const colors = data.colors as Float32Array
    const trailPositions = data.trailPositions as Float32Array[]
    const newCount = data.particleCount as number
    const newTrailLength = data.trailLength as number

    if (newCount !== this.particleCount || newTrailLength !== this.trailLength) {
      this.particleCount = newCount
      this.trailLength = newTrailLength
      this.simplifiedMode = newCount > SIMPLIFIED_THRESHOLD
      this.recreateParticles()
      return
    }

    const posAttr = this.particles.geometry.getAttribute('position') as THREE.BufferAttribute
    const colAttr = this.particles.geometry.getAttribute('color') as THREE.BufferAttribute

    for (let i = 0; i < this.particleCount; i++) {
      posAttr.array[i * 3] = positions[i * 3]
      posAttr.array[i * 3 + 1] = positions[i * 3 + 1]
      posAttr.array[i * 3 + 2] = positions[i * 3 + 2]
      colAttr.array[i * 3] = colors[i * 3]
      colAttr.array[i * 3 + 1] = colors[i * 3 + 1]
      colAttr.array[i * 3 + 2] = colors[i * 3 + 2]
    }
    posAttr.needsUpdate = true
    colAttr.needsUpdate = true

    if (this.glowParticles && !this.simplifiedMode) {
      const glowPosAttr = this.glowParticles.geometry.getAttribute('position') as THREE.BufferAttribute
      const glowColAttr = this.glowParticles.geometry.getAttribute('color') as THREE.BufferAttribute
      for (let i = 0; i < this.particleCount * 3; i++) {
        glowPosAttr.array[i] = posAttr.array[i]
        glowColAttr.array[i] = colAttr.array[i]
      }
      glowPosAttr.needsUpdate = true
      glowColAttr.needsUpdate = true
    }

    if (!this.simplifiedMode) {
      for (let t = 0; t < this.trailParticles.length && t < trailPositions.length; t++) {
        const trail = this.trailParticles[t]
        const trailPosAttr = trail.geometry.getAttribute('position') as THREE.BufferAttribute
        const trailColAttr = trail.geometry.getAttribute('color') as THREE.BufferAttribute

        const trailPos = trailPositions[t]
        for (let i = 0; i < this.particleCount; i++) {
          trailPosAttr.array[i * 3] = trailPos[i * 3]
          trailPosAttr.array[i * 3 + 1] = trailPos[i * 3 + 1]
          trailPosAttr.array[i * 3 + 2] = trailPos[i * 3 + 2]
          trailColAttr.array[i * 3] = colors[i * 3]
          trailColAttr.array[i * 3 + 1] = colors[i * 3 + 1]
          trailColAttr.array[i * 3 + 2] = colors[i * 3 + 2]
        }
        trailPosAttr.needsUpdate = true
        trailColAttr.needsUpdate = true
      }
    }

    this.updateMinimap(positions)
  }

  private recreateParticles(): void {
    if (this.particles) {
      this.scene.remove(this.particles)
      this.particles.geometry.dispose()
      ;(this.particles.material as THREE.Material).dispose()
      this.particles = null
    }
    if (this.glowParticles) {
      this.scene.remove(this.glowParticles)
      this.glowParticles.geometry.dispose()
      ;(this.glowParticles.material as THREE.Material).dispose()
      this.glowParticles = null
    }
    for (const trail of this.trailParticles) {
      this.scene.remove(trail)
      trail.geometry.dispose()
      ;(trail.material as THREE.Material).dispose()
    }
    this.trailParticles = []
    this.createParticles()
  }

  private updateMinimap(positions: Float32Array): void {
    const ctx = this.minimapCtx
    const width = this.minimapCanvas.width
    const height = this.minimapCanvas.height
    const halfSize = this.areaSize / 2

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    ctx.fillRect(0, 0, width, height)

    const gridSize = 20
    const densityGrid = new Uint8Array(gridSize * gridSize)

    for (let i = 0; i < this.particleCount; i++) {
      const x = positions[i * 3]
      const z = positions[i * 3 + 2]

      let gx = Math.floor(((x + halfSize) / this.areaSize) * gridSize)
      let gz = Math.floor(((z + halfSize) / this.areaSize) * gridSize)
      gx = Math.max(0, Math.min(gridSize - 1, gx))
      gz = Math.max(0, Math.min(gridSize - 1, gz))

      densityGrid[gz * gridSize + gx]++
    }

    const cellWidth = width / gridSize
    const cellHeight = height / gridSize
    let maxDensity = 0
    for (let i = 0; i < densityGrid.length; i++) {
      if (densityGrid[i] > maxDensity) maxDensity = densityGrid[i]
    }

    for (let gz = 0; gz < gridSize; gz++) {
      for (let gx = 0; gx < gridSize; gx++) {
        const density = densityGrid[gz * gridSize + gx]
        const intensity = maxDensity > 0 ? density / maxDensity : 0

        if (intensity > 0) {
          const alpha = intensity * 0.8
          const hue = 200 - intensity * 180
          ctx.fillStyle = `hsla(${hue}, 80%, 50%, ${alpha})`
          ctx.fillRect(gx * cellWidth, gz * cellHeight, cellWidth + 1, cellHeight + 1)
        }
      }
    }

    ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)'
    ctx.lineWidth = 1
    ctx.strokeRect(0, 0, width, height)
  }

  update(_deltaTime: number): void {
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }

  resize(): void {
    const width = this.container.clientWidth
    const height = this.container.clientHeight

    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(width, height)
  }
}
