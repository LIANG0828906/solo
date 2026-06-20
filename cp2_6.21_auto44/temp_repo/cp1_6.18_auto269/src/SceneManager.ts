import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useStore, THEME_COLORS, Theme, ParticleData } from './store'

interface ConnectionLine {
  from: number
  to: number
  line: THREE.Line
  baseOpacity: number
  highlighted: boolean
}

interface HoverPulse {
  id: number
  startTime: number
}

export class SceneManager {
  private container: HTMLElement
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private controls: OrbitControls
  private raycaster: THREE.Raycaster
  private mouse: THREE.Vector2

  private particlesGroup: THREE.Group
  private points!: THREE.Points
  private particleGeometry!: THREE.BufferGeometry
  private particleMaterial!: THREE.PointsMaterial
  private particleTexture!: THREE.Texture

  private linesGroup: THREE.Group
  private connections: ConnectionLine[] = []

  private particleData: ParticleData[] = []
  private currentPositions: Float32Array
  private currentColors: Float32Array
  private currentSizes: Float32Array

  private clock: THREE.Clock
  private animationId: number = 0
  private yawAngle: number = 0

  private hoverPulses: HoverPulse[] = []
  private lastCameraDistance: number = 10
  private initialCameraPosition: THREE.Vector3 = new THREE.Vector3(0, 0, 10)
  private initialTarget: THREE.Vector3 = new THREE.Vector3(0, 0, 0)

  private celebrateStartTime: number = 0
  private isCelebrating: boolean = false
  private prevTheme: Theme = 'stardust'
  private prevCameraResetSignal: number = 0
  private prevHoverId: number | null = null
  private prevSizeScale: number = 0.15

  constructor(container: HTMLElement) {
    this.container = container
    this.scene = new THREE.Scene()

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    )
    this.camera.position.copy(this.initialCameraPosition)

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setClearColor(0x0a0a1a, 1)
    container.appendChild(this.renderer.domElement)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.1
    this.controls.minDistance = 0.5
    this.controls.maxDistance = 10
    this.controls.target.copy(this.initialTarget)

    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()

    this.particlesGroup = new THREE.Group()
    this.scene.add(this.particlesGroup)

    this.linesGroup = new THREE.Group()
    this.scene.add(this.linesGroup)

    this.currentPositions = new Float32Array(200 * 3)
    this.currentColors = new Float32Array(200 * 3)
    this.currentSizes = new Float32Array(200)

    this.clock = new THREE.Clock()

    this.createParticleTexture()
    this.initParticles()
    this.bindEvents()
    this.updateFromStore()
    this.animate()

    this.renderer.domElement.style.touchAction = 'none'
    this.renderer.domElement.style.display = 'block'
  }

  private createParticleTexture(): void {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')!
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)')
    gradient.addColorStop(0.6, 'rgba(255,255,255,0.2)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 64, 64)
    this.particleTexture = new THREE.CanvasTexture(canvas)
    this.particleTexture.needsUpdate = true
  }

  private initParticles(): void {
    this.particleGeometry = new THREE.BufferGeometry()
    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(this.currentPositions, 3))
    this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(this.currentColors, 3))
    this.particleGeometry.setAttribute('size', new THREE.BufferAttribute(this.currentSizes, 1))

    const store = useStore.getState()
    this.particleData = [...store.particles]

    this.particleMaterial = new THREE.PointsMaterial({
      size: store.particleSizeScale,
      map: this.particleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    })

    this.points = new THREE.Points(this.particleGeometry, this.particleMaterial)
    this.particlesGroup.add(this.points)
  }

  private hexToRgb(hex: string): [number, number, number] {
    const h = hex.replace('#', '')
    const r = parseInt(h.substring(0, 2), 16) / 255
    const g = parseInt(h.substring(2, 4), 16) / 255
    const b = parseInt(h.substring(4, 6), 16) / 255
    return [r, g, b]
  }

  private mixColors(c1: string, c2: string): string {
    const [r1, g1, b1] = this.hexToRgb(c1)
    const [r2, g2, b2] = this.hexToRgb(c2)
    const r = Math.round(((r1 + r2) / 2) * 255)
    const g = Math.round(((g1 + g2) / 2) * 255)
    const b = Math.round(((b1 + b2) / 2) * 255)
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  private rebuildConnections(positions: Float32Array, particles: ParticleData[]): void {
    for (const c of this.connections) {
      this.linesGroup.remove(c.line)
      c.line.geometry.dispose()
      ;(c.line.material as THREE.Material).dispose()
    }
    this.connections = []

    const MAX_LINES = 400
    const MAX_DIST = 0.8
    const pairs: { a: number; b: number; dist: number }[] = []

    for (let i = 0; i < 200; i++) {
      for (let j = i + 1; j < 200; j++) {
        const dx = positions[i * 3] - positions[j * 3]
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1]
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2]
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
        if (dist < MAX_DIST) {
          pairs.push({ a: i, b: j, dist })
        }
      }
    }

    pairs.sort((p1, p2) => p1.dist - p2.dist)
    const selected = pairs.slice(0, MAX_LINES)

    for (const pair of selected) {
      const geometry = new THREE.BufferGeometry()
      const verts = new Float32Array(6)
      verts[0] = positions[pair.a * 3]
      verts[1] = positions[pair.a * 3 + 1]
      verts[2] = positions[pair.a * 3 + 2]
      verts[3] = positions[pair.b * 3]
      verts[4] = positions[pair.b * 3 + 1]
      verts[5] = positions[pair.b * 3 + 2]
      geometry.setAttribute('position', new THREE.BufferAttribute(verts, 3))

      const mixedColor = this.mixColors(particles[pair.a].color, particles[pair.b].color)
      const baseOpacity = 0.2 + Math.random() * 0.3
      const material = new THREE.LineBasicMaterial({
        color: mixedColor,
        transparent: true,
        opacity: baseOpacity,
        depthWrite: false,
        linewidth: 2
      })
      const line = new THREE.Line(geometry, material)
      this.linesGroup.add(line)
      this.connections.push({
        from: pair.a,
        to: pair.b,
        line,
        baseOpacity,
        highlighted: false
      })
    }
  }

  private bindEvents(): void {
    this.renderer.domElement.addEventListener('pointermove', this.onPointerMove)
    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown)
    this.renderer.domElement.addEventListener('pointerup', this.onPointerUp)
    window.addEventListener('resize', this.onResize)
  }

  private pointerDownPos = { x: 0, y: 0 }
  private pointerMoved = false

  private onPointerDown = (e: PointerEvent): void => {
    this.pointerDownPos.x = e.clientX
    this.pointerDownPos.y = e.clientY
    this.pointerMoved = false
  }

  private onPointerUp = (e: PointerEvent): void => {
    const dx = Math.abs(e.clientX - this.pointerDownPos.x)
    const dy = Math.abs(e.clientY - this.pointerDownPos.y)
    if (dx < 5 && dy < 5) {
      this.handleClick(e)
    }
  }

  private onPointerMove = (e: PointerEvent): void => {
    const dx = Math.abs(e.clientX - this.pointerDownPos.x)
    const dy = Math.abs(e.clientY - this.pointerDownPos.y)
    if (dx > 3 || dy > 3) {
      this.pointerMoved = true
    }
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
  }

  private handleClick(e: PointerEvent): void {
    if (this.pointerMoved) return
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    this.raycaster.setFromCamera(this.mouse, this.camera)
    const intersects = this.raycaster.intersectObject(this.points)
    if (intersects.length > 0) {
      const index = intersects[0].index
      if (index !== undefined) {
        const store = useStore.getState()
        const pid = this.particleData[index].id
        store.selectParticle(pid)
        store.discoverParticle(pid)
      }
    } else {
      useStore.getState().selectParticle(null)
    }
  }

  private onResize = (): void => {
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
  }

  private updateFromStore(): void {
    const store = useStore.getState()
    this.particleData = [...store.particles]
    this.prevTheme = store.theme
    this.prevSizeScale = store.particleSizeScale
    this.prevHoverId = store.hoveredParticleId
    this.prevCameraResetSignal = store.cameraResetSignal
    this.updateBackground()
    this.particleMaterial.size = store.particleSizeScale
  }

  private updateBackground(): void {
    const theme = useStore.getState().theme
    const colors = THEME_COLORS[theme]
    const top = new THREE.Color(colors.bgTop)
    const bottom = new THREE.Color(colors.bgBottom)
    const canvas = document.createElement('canvas')
    canvas.width = 2
    canvas.height = 512
    const ctx = canvas.getContext('2d')!
    const grad = ctx.createLinearGradient(0, 0, 0, 512)
    grad.addColorStop(0, `#${top.getHexString()}`)
    grad.addColorStop(1, `#${bottom.getHexString()}`)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 2, 512)
    const texture = new THREE.CanvasTexture(canvas)
    this.scene.background = texture
  }

  private checkHover(): number | null {
    this.raycaster.setFromCamera(this.mouse, this.camera)
    const intersects = this.raycaster.intersectObject(this.points)
    if (intersects.length > 0) {
      const index = intersects[0].index
      if (index !== undefined) {
        return this.particleData[index].id
      }
    }
    return null
  }

  private setConnectionHighlight(particleId: number | null): void {
    if (particleId === null) {
      for (const c of this.connections) {
        if (c.highlighted) {
          c.highlighted = false
          const mat = c.line.material as THREE.LineBasicMaterial
          const mixedColor = this.mixColors(this.particleData[c.from].color, this.particleData[c.to].color)
          mat.color.set(mixedColor)
          mat.opacity = c.baseOpacity
        }
      }
      return
    }
    const hoveredConnections = new Set<ConnectionLine>()
    for (const c of this.connections) {
      if (this.particleData[c.from].id === particleId || this.particleData[c.to].id === particleId) {
        c.highlighted = true
        const mat = c.line.material as THREE.LineBasicMaterial
        mat.color.set('#FFFFFF')
        hoveredConnections.add(c)
      } else if (c.highlighted) {
        c.highlighted = false
        const mat = c.line.material as THREE.LineBasicMaterial
        const mixedColor = this.mixColors(this.particleData[c.from].color, this.particleData[c.to].color)
        mat.color.set(mixedColor)
      }
    }
    for (const c of hoveredConnections) {
      const mat = c.line.material as THREE.LineBasicMaterial
      mat.opacity = 0.9
    }
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3)
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate)
    const delta = this.clock.getDelta()
    const elapsed = this.clock.getElapsedTime()
    const store = useStore.getState()

    if (store.theme !== this.prevTheme) {
      this.prevTheme = store.theme
      this.particleData = [...store.particles]
      this.updateBackground()
    }
    if (store.particleSizeScale !== this.prevSizeScale) {
      this.prevSizeScale = store.particleSizeScale
      this.particleMaterial.size = store.particleSizeScale
    }
    if (store.cameraResetSignal !== this.prevCameraResetSignal) {
      this.prevCameraResetSignal = store.cameraResetSignal
      this.camera.position.copy(this.initialCameraPosition)
      this.controls.target.copy(this.initialTarget)
      this.controls.update()
    }
    if (store.hoveredParticleId !== this.prevHoverId) {
      this.prevHoverId = store.hoveredParticleId
      this.setConnectionHighlight(store.hoveredParticleId)
    }

    if (store.isCelebrating && !this.isCelebrating) {
      this.isCelebrating = true
      this.celebrateStartTime = elapsed
    }

    this.yawAngle += delta * 0.02
    this.particlesGroup.rotation.y = this.yawAngle
    this.linesGroup.rotation.y = this.yawAngle

    const hoveredId = this.checkHover()
    if (hoveredId !== store.hoveredParticleId) {
      store.hoverParticle(hoveredId)
    }

    const positions = this.currentPositions
    const colors = this.currentColors
    const sizes = this.currentSizes
    const posAttr = this.particleGeometry.getAttribute('position') as THREE.BufferAttribute
    const colorAttr = this.particleGeometry.getAttribute('color') as THREE.BufferAttribute
    const sizeAttr = this.particleGeometry.getAttribute('size') as THREE.BufferAttribute

    let celebrationProgress = 0
    let celebrationBlink = 1
    if (this.isCelebrating) {
      const since = elapsed - this.celebrateStartTime
      if (since < 1) {
        celebrationProgress = since / 1
      } else if (since < 3) {
        celebrationProgress = 1
        const blinkPhase = (since - 1) / 2
        const blinkCycle = blinkPhase * 3
        const blinkMod = blinkCycle - Math.floor(blinkCycle)
        celebrationBlink = blinkMod < 0.5 ? 0.3 + 0.7 * (blinkMod * 2) : 1.0 - 0.7 * ((blinkMod - 0.5) * 2)
      } else {
        this.isCelebrating = false
        store.endCelebration()
        celebrationProgress = 0
      }
    }

    const goldColor: [number, number, number] = [1, 0.843, 0]
    for (let i = 0; i < 200; i++) {
      const p = this.particleData[i]
      const t = elapsed / p.period + p.phase
      const brownianX = Math.sin(t) * 0.05
      const brownianY = Math.sin(t * 1.37 + 1.5) * 0.05
      const brownianZ = Math.sin(t * 0.71 + 2.7) * 0.05
      positions[i * 3] = p.basePosition[0] + brownianX
      positions[i * 3 + 1] = p.basePosition[1] + brownianY
      positions[i * 3 + 2] = p.basePosition[2] + brownianZ

      let [r, g, b] = this.hexToRgb(p.color)
      let alpha = p.opacity
      let size = p.size
      if (this.isCelebrating) {
        r = r + (goldColor[0] - r) * celebrationProgress
        g = g + (goldColor[1] - g) * celebrationProgress
        b = b + (goldColor[2] - b) * celebrationProgress
        alpha = Math.min(1, p.opacity + (celebrationBlink - 0.5) * 0.7)
      }

      if (hoveredId === p.id) {
        size *= 1.8
      }

      colors[i * 3] = r
      colors[i * 3 + 1] = g
      colors[i * 3 + 2] = b
      sizes[i] = size
      ;(posAttr.array as Float32Array)[i * 3] = positions[i * 3]
      ;(posAttr.array as Float32Array)[i * 3 + 1] = positions[i * 3 + 1]
      ;(posAttr.array as Float32Array)[i * 3 + 2] = positions[i * 3 + 2]
      ;(colorAttr.array as Float32Array)[i * 3] = colors[i * 3]
      ;(colorAttr.array as Float32Array)[i * 3 + 1] = colors[i * 3 + 1]
      ;(colorAttr.array as Float32Array)[i * 3 + 2] = colors[i * 3 + 2]
      ;(sizeAttr.array as Float32Array)[i] = sizes[i]
    }

    posAttr.needsUpdate = true
    colorAttr.needsUpdate = true
    sizeAttr.needsUpdate = true

    const camDist = this.camera.position.length()
    if (Math.abs(camDist - this.lastCameraDistance) > 0.01) {
      this.lastCameraDistance = camDist
      this.particleMaterial.size = store.particleSizeScale * (camDist / 10)
    }

    this.updateConnections(positions, elapsed, hoveredId)

    if (Math.floor(elapsed * 2) % 3 === 0 && !this.connectionsBuilt) {
      this.rebuildConnections(positions, this.particleData)
      this.connectionsBuilt = true
    } else if (Math.floor(elapsed * 2) % 3 !== 0) {
      this.connectionsBuilt = false
    }

    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }

  private connectionsBuilt = false

  private updateConnections(positions: Float32Array, elapsed: number, hoveredId: number | null): void {
    const shakeFrequency = 10
    for (const c of this.connections) {
      const geom = c.line.geometry
      const pos = geom.getAttribute('position') as THREE.BufferAttribute
      const arr = pos.array as Float32Array
      arr[0] = positions[c.from * 3]
      arr[1] = positions[c.from * 3 + 1]
      arr[2] = positions[c.from * 3 + 2]
      arr[3] = positions[c.to * 3]
      arr[4] = positions[c.to * 3 + 1]
      arr[5] = positions[c.to * 3 + 2]

      if (c.highlighted && hoveredId !== null) {
        const fromHighlight = this.particleData[c.from].id === hoveredId
        const toHighlight = this.particleData[c.to].id === hoveredId
        if (fromHighlight) {
          const s = Math.sin(elapsed * shakeFrequency * Math.PI * 2) * 0.02
          arr[0] += (Math.random() - 0.5) * 0.02
          arr[1] += (Math.random() - 0.5) * 0.02
          arr[2] += (Math.random() - 0.5) * 0.02
        }
        if (toHighlight) {
          arr[3] += (Math.random() - 0.5) * 0.02
          arr[4] += (Math.random() - 0.5) * 0.02
          arr[5] += (Math.random() - 0.5) * 0.02
        }
      }
      pos.needsUpdate = true
    }
  }

  dispose(): void {
    cancelAnimationFrame(this.animationId)
    this.renderer.domElement.removeEventListener('pointermove', this.onPointerMove)
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown)
    this.renderer.domElement.removeEventListener('pointerup', this.onPointerUp)
    window.removeEventListener('resize', this.onResize)
    this.particleGeometry.dispose()
    this.particleMaterial.dispose()
    this.particleTexture.dispose()
    for (const c of this.connections) {
      c.line.geometry.dispose()
      ;(c.line.material as THREE.Material).dispose()
    }
    this.controls.dispose()
    this.renderer.dispose()
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement)
    }
  }
}
