import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export class ArtEngine {
  private container: HTMLElement
  private scene: THREE.Scene | null = null
  private camera: THREE.PerspectiveCamera | null = null
  private renderer: THREE.WebGLRenderer | null = null
  private controls: OrbitControls | null = null
  private animationId: number | null = null
  private isRunning: boolean = false

  private lastInteractionTime: number = 0
  private autoReturnDelay: number = 10000
  private isAutoReturning: boolean = false
  private autoReturnProgress: number = 0
  private autoReturnDuration: number = 2000

  private defaultCameraPosition: THREE.Vector3 = new THREE.Vector3(0, 15, 20)
  private defaultTarget: THREE.Vector3 = new THREE.Vector3(0, 0, 0)
  private startCameraPosition: THREE.Vector3 = new THREE.Vector3()
  private startTarget: THREE.Vector3 = new THREE.Vector3()

  constructor(container: HTMLElement) {
    this.container = container
  }

  init(): void {
    this.initScene()
    this.initCamera()
    this.initRenderer()
    this.initControls()
    this.resize()
  }

  private initScene(): void {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0a0a0f)
  }

  private initCamera(): void {
    const { clientWidth, clientHeight } = this.container
    this.camera = new THREE.PerspectiveCamera(
      60,
      clientWidth / clientHeight,
      0.1,
      1000
    )
    this.camera.position.copy(this.defaultCameraPosition)
    this.camera.lookAt(this.defaultTarget)
  }

  private initRenderer(): void {
    if (!this.container) return

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    })

    const pixelRatio = Math.min(window.devicePixelRatio, 2)
    this.renderer.setPixelRatio(pixelRatio)
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.renderer.setClearColor(0x0a0a0f, 1)

    this.container.appendChild(this.renderer.domElement)
  }

  private initControls(): void {
    if (!this.camera || !this.renderer) return

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)

    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.enableZoom = true
    this.controls.enableRotate = true
    this.controls.enablePan = false

    this.controls.minDistance = 5
    this.controls.maxDistance = 30

    this.controls.minPolarAngle = Math.PI / 6
    this.controls.maxPolarAngle = Math.PI / 2.2

    this.controls.target.copy(this.defaultTarget)

    this.controls.addEventListener('start', this.handleInteractionStart)
    this.controls.addEventListener('change', this.handleInteractionChange)
  }

  private handleInteractionStart = (): void => {
    this.lastInteractionTime = performance.now()
    this.isAutoReturning = false
  }

  private handleInteractionChange = (): void => {
    this.lastInteractionTime = performance.now()
    this.isAutoReturning = false
  }

  private checkAutoReturn(deltaTime: number): void {
    if (!this.controls || !this.camera) return

    const now = performance.now()
    const timeSinceInteraction = now - this.lastInteractionTime

    if (timeSinceInteraction >= this.autoReturnDelay && !this.isAutoReturning) {
      this.startAutoReturn()
    }

    if (this.isAutoReturning) {
      this.updateAutoReturn(deltaTime)
    }
  }

  private startAutoReturn(): void {
    if (!this.controls || !this.camera) return

    this.isAutoReturning = true
    this.autoReturnProgress = 0
    this.startCameraPosition.copy(this.camera.position)
    this.startTarget.copy(this.controls.target)
  }

  private updateAutoReturn(deltaTime: number): void {
    if (!this.controls || !this.camera) return

    this.autoReturnProgress += deltaTime

    const t = Math.min(this.autoReturnProgress / this.autoReturnDuration, 1)
    const easeT = this.easeInOutCubic(t)

    this.camera.position.lerpVectors(
      this.startCameraPosition,
      this.defaultCameraPosition,
      easeT
    )
    this.controls.target.lerpVectors(
      this.startTarget,
      this.defaultTarget,
      easeT
    )

    if (t >= 1) {
      this.isAutoReturning = false
    }
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  animate(): void {
    if (this.isRunning) return
    this.isRunning = true
    this.lastInteractionTime = performance.now()
    this.renderLoop()
  }

  private renderLoop = (): void => {
    if (!this.isRunning) return

    const deltaTime = 16

    this.checkAutoReturn(deltaTime)

    if (this.controls) {
      this.controls.update()
    }

    this.render()

    this.animationId = requestAnimationFrame(this.renderLoop)
  }

  private render(): void {
    if (!this.renderer || !this.scene || !this.camera) return
    this.renderer.render(this.scene, this.camera)
  }

  resize(): void {
    if (!this.camera || !this.renderer) return

    const { clientWidth, clientHeight } = this.container
    this.camera.aspect = clientWidth / clientHeight
    this.camera.updateProjectionMatrix()

    const pixelRatio = Math.min(window.devicePixelRatio, 2)
    this.renderer.setPixelRatio(pixelRatio)
    this.renderer.setSize(clientWidth, clientHeight)
  }

  getScene(): THREE.Scene {
    if (!this.scene) {
      throw new Error('ArtEngine has not been initialized. Call init() first.')
    }
    return this.scene
  }

  getCamera(): THREE.PerspectiveCamera {
    if (!this.camera) {
      throw new Error('ArtEngine has not been initialized. Call init() first.')
    }
    return this.camera
  }

  getControls(): OrbitControls {
    if (!this.controls) {
      throw new Error('ArtEngine has not been initialized. Call init() first.')
    }
    return this.controls
  }

  getRenderer(): THREE.WebGLRenderer {
    if (!this.renderer) {
      throw new Error('ArtEngine has not been initialized. Call init() first.')
    }
    return this.renderer
  }

  dispose(): void {
    this.isRunning = false

    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }

    if (this.controls) {
      this.controls.removeEventListener('start', this.handleInteractionStart)
      this.controls.removeEventListener('change', this.handleInteractionChange)
      this.controls.dispose()
      this.controls = null
    }

    if (this.renderer) {
      if (this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement)
      }
      this.renderer.dispose()
      this.renderer = null
    }

    if (this.scene) {
      this.scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) {
            object.geometry.dispose()
          }
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((mat) => mat.dispose())
            } else {
              object.material.dispose()
            }
          }
        }
      })
      this.scene = null
    }

    this.camera = null
  }
}
