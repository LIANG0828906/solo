import * as THREE from 'three'
import type { SimulationEngine } from './SimulationEngine'

export interface InteractionConfig {
  forceRadius: number
  forceStrength: number
}

export interface TrailPoint {
  position: THREE.Vector3
  time: number
  opacity: number
}

export class InteractionHandler {
  private canvas: HTMLCanvasElement | null = null
  private camera: THREE.Camera | null = null
  private _renderer: THREE.WebGLRenderer | null = null
  private simulationEngine: SimulationEngine | null = null
  private scene: THREE.Scene | null = null

  private isDragging: boolean = false
  private isShiftPressed: boolean = false
  private mouseScreen: THREE.Vector2 = new THREE.Vector2()
  private raycaster: THREE.Raycaster = new THREE.Raycaster()

  private lastForceTime: number = 0

  private trailPoints: TrailPoint[] = []
  private trailGeometry: THREE.BufferGeometry
  private trailMaterial: THREE.LineBasicMaterial
  private trailLine: THREE.Line | null = null

  private containerPlane: THREE.Plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)

  config: InteractionConfig

  private onClickCallback: ((position: THREE.Vector3) => void) | null = null

  constructor(config: Partial<InteractionConfig> = {}) {
    this.config = {
      forceRadius: config.forceRadius || 5,
      forceStrength: config.forceStrength || 50
    }

    this.trailGeometry = new THREE.BufferGeometry()
    this.trailMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      linewidth: 2
    })
  }

  setCanvas(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.bindEvents()
  }

  setCamera(camera: THREE.Camera) {
    this.camera = camera
  }

  setRenderer(renderer: THREE.WebGLRenderer) {
    this._renderer = renderer
  }

  setSimulationEngine(engine: SimulationEngine) {
    this.simulationEngine = engine
  }

  setScene(scene: THREE.Scene) {
    this.scene = scene
    this.trailLine = new THREE.Line(this.trailGeometry, this.trailMaterial)
    scene.add(this.trailLine)
  }

  setOnClick(callback: (position: THREE.Vector3) => void) {
    this.onClickCallback = callback
  }

  setForceStrength(strength: number) {
    this.config.forceStrength = strength
  }

  private bindEvents() {
    if (!this.canvas) return

    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)

    this.canvas.addEventListener('mousedown', this.handleMouseDown)
    this.canvas.addEventListener('mousemove', this.handleMouseMove)
    this.canvas.addEventListener('mouseup', this.handleMouseUp)
    this.canvas.addEventListener('mouseleave', this.handleMouseUp)
    this.canvas.addEventListener('click', this.handleClick)

    this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false })
    this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false })
    this.canvas.addEventListener('touchend', this.handleTouchEnd, { passive: false })
  }

  dispose() {
    if (!this.canvas) return

    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)

    this.canvas.removeEventListener('mousedown', this.handleMouseDown)
    this.canvas.removeEventListener('mousemove', this.handleMouseMove)
    this.canvas.removeEventListener('mouseup', this.handleMouseUp)
    this.canvas.removeEventListener('mouseleave', this.handleMouseUp)
    this.canvas.removeEventListener('click', this.handleClick)

    this.canvas.removeEventListener('touchstart', this.handleTouchStart)
    this.canvas.removeEventListener('touchmove', this.handleTouchMove)
    this.canvas.removeEventListener('touchend', this.handleTouchEnd)

    if (this.trailLine && this.scene) {
      this.scene.remove(this.trailLine)
    }
    this.trailGeometry.dispose()
    this.trailMaterial.dispose()
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Shift') {
      this.isShiftPressed = true
    }
  }

  private handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'Shift') {
      this.isShiftPressed = false
    }
  }

  private updateMousePosition(clientX: number, clientY: number) {
    if (!this.canvas) return

    const rect = this.canvas.getBoundingClientRect()
    this.mouseScreen.x = ((clientX - rect.left) / rect.width) * 2 - 1
    this.mouseScreen.y = -((clientY - rect.top) / rect.height) * 2 + 1
  }

  private getWorldPosition(): THREE.Vector3 | null {
    if (!this.camera) return null

    this.raycaster.setFromCamera(this.mouseScreen, this.camera)

    const intersection = new THREE.Vector3()
    this.raycaster.ray.intersectPlane(this.containerPlane, intersection)

    if (!intersection) return null

    const distance = this.raycaster.ray.origin.distanceTo(intersection)
    if (distance < 0 || distance > 50) return null

    const half = 10
    intersection.x = Math.max(-half, Math.min(half, intersection.x))
    intersection.y = Math.max(-half, Math.min(half, intersection.y))
    intersection.z = Math.max(-half, Math.min(half, intersection.z))

    return intersection
  }

  private handleMouseDown = (e: MouseEvent) => {
    e.preventDefault()
    if (e.button !== 0) return
    this.isDragging = true
    this.clickStartTime = performance.now()
    this.clickStartPos = { x: e.clientX, y: e.clientY }
    this.updateMousePosition(e.clientX, e.clientY)
    const worldPos = this.getWorldPosition()
    if (worldPos) {
      this.addTrailPoint(worldPos)
    }
  }

  private handleMouseMove = (e: MouseEvent) => {
    this.updateMousePosition(e.clientX, e.clientY)
    if (this.isDragging) {
      const worldPos = this.getWorldPosition()
      if (worldPos) {
        this.addTrailPoint(worldPos)
        this.injectForce(worldPos)
      }
    }
  }

  private handleMouseUp = () => {
    this.isDragging = false
  }

  private clickStartTime: number = 0
  private clickStartPos: { x: number; y: number } = { x: 0, y: 0 }

  private handleClick = (e: MouseEvent) => {
    const now = performance.now()
    const timeDiff = now - this.clickStartTime
    const distDiff = Math.sqrt(
      Math.pow(e.clientX - this.clickStartPos.x, 2) +
      Math.pow(e.clientY - this.clickStartPos.y, 2)
    )

    if (timeDiff < 200 && distDiff < 5) {
      this.updateMousePosition(e.clientX, e.clientY)
      const worldPos = this.getWorldPosition()
      if (worldPos && this.simulationEngine) {
        this.simulationEngine.addBurstPulse({
          x: worldPos.x,
          y: worldPos.y,
          z: worldPos.z
        })
        if (this.onClickCallback) {
          this.onClickCallback(worldPos)
        }
      }
    }
  }

  private handleTouchStart = (e: TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      this.isDragging = true
      this.updateMousePosition(touch.clientX, touch.clientY)
      const worldPos = this.getWorldPosition()
      if (worldPos) {
        this.addTrailPoint(worldPos)
      }
    }
  }

  private handleTouchMove = (e: TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 1 && this.isDragging) {
      const touch = e.touches[0]
      this.updateMousePosition(touch.clientX, touch.clientY)
      const worldPos = this.getWorldPosition()
      if (worldPos) {
        this.addTrailPoint(worldPos)
        this.injectForce(worldPos)
      }
    }
  }

  private handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault()
    const isClick = this.isDragging && e.touches.length === 0
    this.isDragging = false

    if (isClick && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0]
      this.updateMousePosition(touch.clientX, touch.clientY)
      const worldPos = this.getWorldPosition()
      if (worldPos && this.simulationEngine) {
        this.simulationEngine.addBurstPulse({
          x: worldPos.x,
          y: worldPos.y,
          z: worldPos.z
        })
        if (this.onClickCallback) {
          this.onClickCallback(worldPos)
        }
      }
    }
  }

  private injectForce(position: THREE.Vector3) {
    if (!this.simulationEngine) return

    const now = performance.now()
    if (now - this.lastForceTime < 16) return
    this.lastForceTime = now

    this.simulationEngine.addExternalForce({
      position: {
        x: position.x,
        y: position.y,
        z: position.z
      },
      radius: this.config.forceRadius,
      strength: this.config.forceStrength / 10,
      type: this.isShiftPressed ? 'attract' : 'repel',
      decay: 0.05
    })
  }

  private addTrailPoint(position: THREE.Vector3) {
    this.trailPoints.push({
      position: position.clone(),
      time: performance.now(),
      opacity: 1
    })

    if (this.trailPoints.length > 100) {
      this.trailPoints.shift()
    }
  }

  update(_deltaTime: number, currentTime: number) {
    const fadeTime = 100
    this.trailPoints = this.trailPoints.filter((point) => {
      const age = currentTime - point.time
      point.opacity = Math.max(0, 1 - age / fadeTime)
      return point.opacity > 0
    })

    this.updateTrailGeometry()
  }

  private updateTrailGeometry() {
    const count = this.trailPoints.length
    if (count < 2) {
      this.trailGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(0), 3))
      this.trailGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(0), 3))
      return
    }

    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)

    const startColor = new THREE.Color('#6366F1')
    const endColor = new THREE.Color('#EC4899')

    for (let i = 0; i < count; i++) {
      const point = this.trailPoints[i]
      const i3 = i * 3

      positions[i3] = point.position.x
      positions[i3 + 1] = point.position.y
      positions[i3 + 2] = point.position.z

      const t = i / (count - 1)
      const color = startColor.clone().lerp(endColor, t)
      const opacity = point.opacity
      colors[i3] = color.r * opacity
      colors[i3 + 1] = color.g * opacity
      colors[i3 + 2] = color.b * opacity
    }

    this.trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    this.trailGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    this.trailGeometry.attributes.position.needsUpdate = true
    this.trailGeometry.attributes.color.needsUpdate = true
  }
}
