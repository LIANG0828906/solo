import * as THREE from 'three'
import { ColorTheme, THEME_COLORS } from './store'

interface TrailPoint {
  position: THREE.Vector3
  alpha: number
}

export interface GestureScenePosition {
  x: number
  y: number
  z: number
}

export class ParticleScene {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private particles: THREE.Points | null = null
  private particleGeometry: THREE.BufferGeometry | null = null
  private particleMaterial: THREE.PointsMaterial | null = null
  private trails: THREE.Line | null = null
  private trailGeometry: THREE.BufferGeometry | null = null
  private trailMaterial: THREE.LineBasicMaterial | null = null
  private trailBuffer: TrailPoint[] = []
  private readonly MAX_TRAILS = 192
  private animationId: number = 0
  private time: number = 0
  private isFrozen: boolean = false
  private particleCount: number = 2000
  private colorTheme: ColorTheme = 'nebula'
  private selectedIndices: Set<number> = new Set()
  private basePositions: Float32Array | null = null
  private originalColors: Float32Array | null = null
  private driftSpeeds: Float32Array | null = null
  private onSelectParticles: ((pos: GestureScenePosition) => void) | null = null

  private canvas: HTMLCanvasElement | null = null

  constructor() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x000000)
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000)
    this.camera.position.z = 8
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  }

  init(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.handleResize()
    window.addEventListener('resize', this.handleResize)
    this.createParticles(this.particleCount)
    this.createTrails()
    this.startAnimationLoop()
  }

  private handleResize = () => {
    const width = window.innerWidth
    const height = window.innerHeight
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height, false)
  }

  private createParticles(count: number) {
    this.disposeParticles()
    this.particleCount = count

    this.particleGeometry = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    this.basePositions = new Float32Array(count * 3)
    this.originalColors = new Float32Array(count * 3)
    this.driftSpeeds = new Float32Array(count * 3)

    const radius = 3.5
    const theme = THEME_COLORS[this.colorTheme]

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = radius * Math.pow(Math.random(), 0.5)

      const x = r * Math.sin(phi) * Math.cos(theta)
      const y = r * Math.sin(phi) * Math.sin(theta)
      const z = r * Math.cos(phi)

      positions[i3] = x
      positions[i3 + 1] = y
      positions[i3 + 2] = z
      this.basePositions[i3] = x
      this.basePositions[i3 + 1] = y
      this.basePositions[i3 + 2] = z

      this.driftSpeeds[i3] = (Math.random() - 0.5) * 0.002
      this.driftSpeeds[i3 + 1] = (Math.random() - 0.5) * 0.002
      this.driftSpeeds[i3 + 2] = (Math.random() - 0.5) * 0.002

      let color: THREE.Color
      if (theme.gradient.length === 1) {
        color = new THREE.Color(theme.gradient[0])
        const variation = 0.3
        color.offsetHSL(
          (Math.random() - 0.5) * variation * 0.1,
          0,
          (Math.random() - 0.5) * variation
        )
      } else {
        const t = Math.random()
        const colorIdx = Math.min(
          Math.floor(t * theme.gradient.length),
          theme.gradient.length - 1
        )
        const nextIdx = Math.min(colorIdx + 1, theme.gradient.length - 1)
        const localT = (t * theme.gradient.length) - colorIdx
        color = new THREE.Color(theme.gradient[colorIdx]).lerp(
          new THREE.Color(theme.gradient[nextIdx]),
          localT
        )
      }

      colors[i3] = color.r
      colors[i3 + 1] = color.g
      colors[i3 + 2] = color.b
      this.originalColors[i3] = color.r
      this.originalColors[i3 + 1] = color.g
      this.originalColors[i3 + 2] = color.b
    }

    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    this.particleMaterial = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })

    this.particles = new THREE.Points(this.particleGeometry, this.particleMaterial)
    this.scene.add(this.particles)
    this.selectedIndices.clear()
  }

  private createTrails() {
    this.disposeTrails()
    this.trailGeometry = new THREE.BufferGeometry()
    const positions = new Float32Array(this.MAX_TRAILS * 2 * 3)
    const colors = new Float32Array(this.MAX_TRAILS * 2 * 3)

    for (let i = 0; i < this.MAX_TRAILS; i++) {
      const i6 = i * 6
      const startColor = new THREE.Color('#00E5FF')
      const endColor = new THREE.Color('#7C4DFF')
      const alphaT = i / this.MAX_TRAILS
      const lineColor = startColor.clone().lerp(endColor, alphaT)
      colors[i6] = lineColor.r
      colors[i6 + 1] = lineColor.g
      colors[i6 + 2] = lineColor.b
      colors[i6 + 3] = lineColor.r
      colors[i6 + 4] = lineColor.g
      colors[i6 + 5] = lineColor.b
    }

    this.trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    this.trailGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    this.trailMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })

    this.trails = new THREE.LineSegments(this.trailGeometry, this.trailMaterial)
    this.scene.add(this.trails)
  }

  private startAnimationLoop = () => {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate)
      this.time += 0.016
      this.update()
      this.renderer.render(this.scene, this.camera)
    }
    animate()
  }

  private update() {
    if (!this.particles || !this.particleGeometry || !this.basePositions) return

    const positionAttr = this.particleGeometry.getAttribute('position') as THREE.BufferAttribute
    const colorAttr = this.particleGeometry.getAttribute('color') as THREE.BufferAttribute
    const positions = positionAttr.array as Float32Array
    const colors = colorAttr.array as Float32Array

    const pulse = Math.sin(this.time * 3) * 0.1 + 1.0

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3
      const isSelected = this.selectedIndices.has(i)

      if (!this.isFrozen) {
        if (!isSelected) {
          positions[i3] = this.basePositions[i3] + Math.sin(this.time + i * 0.01) * 0.02
          positions[i3 + 1] = this.basePositions[i3 + 1] + Math.cos(this.time + i * 0.015) * 0.02
          positions[i3 + 2] = this.basePositions[i3 + 2] + Math.sin(this.time * 0.7 + i * 0.012) * 0.02
        }

        if (isSelected) {
          colors[i3] = 0
          colors[i3 + 1] = 0.898
          colors[i3 + 2] = 1.0
        } else {
          colors[i3] = this.originalColors![i3]
          colors[i3 + 1] = this.originalColors![i3 + 1]
          colors[i3 + 2] = this.originalColors![i3 + 2]
        }
      }
    }

    if (this.particleMaterial) {
      this.particleMaterial.size = 0.06 * pulse
    }

    positionAttr.needsUpdate = true
    colorAttr.needsUpdate = true
    this.updateTrails()
  }

  private updateTrails() {
    if (!this.trailGeometry || !this.trailMaterial) return
    const positionAttr = this.trailGeometry.getAttribute('position') as THREE.BufferAttribute
    const positions = positionAttr.array as Float32Array

    for (let i = 0; i < this.MAX_TRAILS; i++) {
      const i6 = i * 6
      const t = i / this.MAX_TRAILS
      const opacity = (1 - t) * 0.6
      positions[i6] = 0; positions[i6 + 1] = 0; positions[i6 + 2] = 0
      positions[i6 + 3] = 0; positions[i6 + 4] = 0; positions[i6 + 5] = 0
      this.trailMaterial.opacity = this.trailBuffer.length > 2 ? Math.min(0.7, this.trailBuffer.length / 50) : 0
    }

    if (this.trailBuffer.length >= 2) {
      const segCount = Math.min(this.trailBuffer.length - 1, this.MAX_TRAILS)
      for (let i = 0; i < segCount; i++) {
        const idx = this.trailBuffer.length - segCount + i
        if (idx < 0 || idx + 1 >= this.trailBuffer.length) continue
        const p1 = this.trailBuffer[idx].position
        const p2 = this.trailBuffer[idx + 1].position
        const i6 = i * 6
        positions[i6] = p1.x; positions[i6 + 1] = p1.y; positions[i6 + 2] = p1.z
        positions[i6 + 3] = p2.x; positions[i6 + 4] = p2.y; positions[i6 + 5] = p2.z
      }
    }

    positionAttr.needsUpdate = true
  }

  addTrailPoint(pos: GestureScenePosition) {
    this.trailBuffer.push({
      position: new THREE.Vector3(pos.x, pos.y, pos.z),
      alpha: 1.0
    })
    while (this.trailBuffer.length > this.MAX_TRAILS + 1) {
      this.trailBuffer.shift()
    }
  }

  clearTrails() {
    this.trailBuffer = []
  }

  private screenToScene(normalizedX: number, normalizedY: number, depth: number = 0): THREE.Vector3 {
    const vector = new THREE.Vector3(
      normalizedX * 2 - 1,
      -(normalizedY * 2 - 1),
      0.5
    )
    vector.unproject(this.camera)
    const dir = vector.sub(this.camera.position).normalize()
    const targetZ = depth
    const t = (targetZ - this.camera.position.z) / dir.z
    return this.camera.position.clone().add(dir.multiplyScalar(t))
  }

  selectParticlesByScreen(normalizedX: number, normalizedY: number, radius: number = 1.2) {
    if (!this.particleGeometry || !this.basePositions) return
    const scenePos = this.screenToScene(normalizedX, normalizedY, 0)
    const posAttr = this.particleGeometry.getAttribute('position') as THREE.BufferAttribute
    const positions = posAttr.array as Float32Array
    this.selectedIndices.clear()
    const r2 = radius * radius

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3
      const dx = positions[i3] - scenePos.x
      const dy = positions[i3 + 1] - scenePos.y
      const dz = positions[i3 + 2] - scenePos.z
      const dist2 = dx * dx + dy * dy + dz * dz
      if (dist2 < r2) {
        this.selectedIndices.add(i)
      }
    }

    if (this.onSelectParticles) {
      this.onSelectParticles({ x: scenePos.x, y: scenePos.y, z: scenePos.z })
    }
  }

  dragSelectedByScreen(normalizedX: number, normalizedY: number) {
    if (!this.particleGeometry || !this.basePositions || this.selectedIndices.size === 0) return
    const scenePos = this.screenToScene(normalizedX, normalizedY, 0)
    this.addTrailPoint({ x: scenePos.x, y: scenePos.y, z: scenePos.z })
    this.dragSelectedByScene({ x: scenePos.x, y: scenePos.y, z: scenePos.z })
  }

  private lastDragPos: THREE.Vector3 | null = null

  dragSelectedByScene(target: GestureScenePosition) {
    if (!this.particleGeometry || !this.basePositions || this.selectedIndices.size === 0) return
    const posAttr = this.particleGeometry.getAttribute('position') as THREE.BufferAttribute
    const positions = posAttr.array as Float32Array
    const newTarget = new THREE.Vector3(target.x, target.y, target.z)

    if (!this.lastDragPos) {
      let centroid = new THREE.Vector3()
      this.selectedIndices.forEach(idx => {
        const i3 = idx * 3
        centroid.x += positions[i3]
        centroid.y += positions[i3 + 1]
        centroid.z += positions[i3 + 2]
      })
      centroid.divideScalar(this.selectedIndices.size)
      this.lastDragPos = centroid
    }

    const offset = newTarget.clone().sub(this.lastDragPos)

    this.selectedIndices.forEach(idx => {
      const i3 = idx * 3
      positions[i3] += offset.x
      positions[i3 + 1] += offset.y
      positions[i3 + 2] += offset.z
      this.basePositions![i3] = positions[i3]
      this.basePositions![i3 + 1] = positions[i3 + 1]
      this.basePositions![i3 + 2] = positions[i3 + 2]
    })

    this.lastDragPos = newTarget
    posAttr.needsUpdate = true
  }

  clearSelection() {
    this.selectedIndices.clear()
    this.lastDragPos = null
  }

  scaleSelected(scaleFactor: number, centerScreen?: { x: number; y: number }) {
    if (!this.particleGeometry || !this.basePositions || this.selectedIndices.size === 0) return
    const posAttr = this.particleGeometry.getAttribute('position') as THREE.BufferAttribute
    const positions = posAttr.array as Float32Array

    let centroid = new THREE.Vector3()
    if (centerScreen) {
      centroid = this.screenToScene(centerScreen.x, centerScreen.y, 0)
    } else {
      this.selectedIndices.forEach(idx => {
        const i3 = idx * 3
        centroid.x += positions[i3]
        centroid.y += positions[i3 + 1]
        centroid.z += positions[i3 + 2]
      })
      centroid.divideScalar(this.selectedIndices.size)
    }

    this.selectedIndices.forEach(idx => {
      const i3 = idx * 3
      const dx = positions[i3] - centroid.x
      const dy = positions[i3 + 1] - centroid.y
      const dz = positions[i3 + 2] - centroid.z
      positions[i3] = centroid.x + dx * scaleFactor
      positions[i3 + 1] = centroid.y + dy * scaleFactor
      positions[i3 + 2] = centroid.z + dz * scaleFactor
      this.basePositions![i3] = positions[i3]
      this.basePositions![i3 + 1] = positions[i3 + 1]
      this.basePositions![i3 + 2] = positions[i3 + 2]
    })

    posAttr.needsUpdate = true
  }

  setParticleCount(count: number) {
    if (count === this.particleCount) return
    this.createParticles(count)
  }

  setColorTheme(theme: ColorTheme) {
    if (theme === this.colorTheme) return
    this.colorTheme = theme
    this.createParticles(this.particleCount)
  }

  setFrozen(frozen: boolean) {
    this.isFrozen = frozen
  }

  reset() {
    this.createParticles(this.particleCount)
    this.clearTrails()
    this.clearSelection()
    this.isFrozen = false
  }

  private disposeParticles() {
    if (this.particles && this.scene) {
      this.scene.remove(this.particles)
    }
    if (this.particleGeometry) {
      this.particleGeometry.dispose()
      this.particleGeometry = null
    }
    if (this.particleMaterial) {
      this.particleMaterial.dispose()
      this.particleMaterial = null
    }
    this.particles = null
    this.basePositions = null
    this.originalColors = null
    this.driftSpeeds = null
  }

  private disposeTrails() {
    if (this.trails && this.scene) {
      this.scene.remove(this.trails)
    }
    if (this.trailGeometry) {
      this.trailGeometry.dispose()
      this.trailGeometry = null
    }
    if (this.trailMaterial) {
      this.trailMaterial.dispose()
      this.trailMaterial = null
    }
    this.trails = null
  }

  dispose() {
    cancelAnimationFrame(this.animationId)
    window.removeEventListener('resize', this.handleResize)
    this.disposeParticles()
    this.disposeTrails()
    this.renderer.dispose()
  }
}
