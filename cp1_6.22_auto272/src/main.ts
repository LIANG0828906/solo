import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { ParticleSystem } from './ParticleSystem'
import { ControlPanel } from './ControlPanel'

class App {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private controls: OrbitControls
  private particleSystem: ParticleSystem
  private controlPanel: ControlPanel
  private fpsCounter: HTMLElement
  private clock: THREE.Clock

  private forceVector: THREE.Vector3 = new THREE.Vector3(0, 1, 0)
  private turbulence: number = 1.0
  private particleLifetime: number = 5

  private frameCount: number = 0
  private lastFpsUpdate: number = 0
  private animationId: number | null = null

  constructor() {
    this.clock = new THREE.Clock()

    this.scene = this.createScene()
    this.camera = this.createCamera()
    this.renderer = this.createRenderer()
    this.controls = this.createControls()
    this.fpsCounter = document.getElementById('fps-counter') as HTMLElement

    this.particleSystem = new ParticleSystem(this.scene, {
      particleCount: 500,
      boundarySize: 100,
      minSize: 2,
      maxSize: 6,
      minOpacity: 0.3,
      maxOpacity: 0.8,
      trailLength: 15,
      defaultLifetime: this.particleLifetime
    })

    this.controlPanel = new ControlPanel({
      onTurbulenceChange: (value) => {
        this.turbulence = value
      },
      onLifetimeChange: (value) => {
        this.particleLifetime = value
      },
      onForceChange: (x, y, z) => {
        this.forceVector.set(x, y, z)
      },
      onReset: () => {
        this.particleSystem.reset()
      }
    })

    this.setupEventListeners()
    this.controlPanel.mount()
  }

  private createScene(): THREE.Scene {
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x0F0C29, 0.008)
    return scene
  }

  private createCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    const distance = 120
    const angle = Math.PI / 4
    camera.position.set(
      distance * Math.cos(angle),
      distance * Math.sin(angle),
      distance * Math.cos(angle)
    )
    camera.lookAt(0, 0, 0)
    return camera
  }

  private createRenderer(): THREE.WebGLRenderer {
    const canvasContainer = document.getElementById('app') as HTMLElement
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0)
    canvasContainer.appendChild(renderer.domElement)
    return renderer
  }

  private createControls(): OrbitControls {
    const controls = new OrbitControls(this.camera, this.renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.rotateSpeed = 0.5
    controls.minDistance = 50
    controls.maxDistance = 300
    controls.enablePan = false
    controls.target.set(0, 0, 0)
    return controls
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.onResize.bind(this))
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  private updateFPS(): void {
    this.frameCount++
    const now = performance.now()

    if (now - this.lastFpsUpdate >= 1000) {
      const fps = Math.round(this.frameCount * 1000 / (now - this.lastFpsUpdate))
      this.fpsCounter.textContent = `FPS: ${fps}`
      this.frameCount = 0
      this.lastFpsUpdate = now
    }
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(this.animate.bind(this))

    const deltaTime = Math.min(this.clock.getDelta(), 0.1)

    this.controls.update()

    this.particleSystem.update(
      this.forceVector,
      this.turbulence,
      deltaTime,
      this.particleLifetime
    )

    this.updateFPS()

    this.renderer.render(this.scene, this.camera)
  }

  public start(): void {
    this.lastFpsUpdate = performance.now()
    this.animate()
  }

  public dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
    }

    this.controls.dispose()
    this.particleSystem.dispose()
    this.controlPanel.unmount()
    this.renderer.dispose()

    window.removeEventListener('resize', this.onResize.bind(this))
  }
}

const app = new App()
app.start()

window.addEventListener('beforeunload', () => {
  app.dispose()
})
