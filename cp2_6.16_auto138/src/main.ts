import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { NebulaSystem } from './NebulaSystem'
import { ControlPanel } from './ControlPanel'
import { useNebulaStore } from './store'

class App {
  private container: HTMLElement
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private controls: OrbitControls
  private nebulaSystem: NebulaSystem
  private controlPanel: ControlPanel
  private clock: THREE.Clock
  private raycaster: THREE.Raycaster
  private mouse: THREE.Vector2
  private animationId: number = 0
  
  private lastParams: {
    particleCount: number
    particleSize: number
    colorSpeed: number
    colorThemeIndex: number
  }
  
  constructor() {
    const containerElement = document.getElementById('canvas-container')
    if (!containerElement) {
      throw new Error('Canvas container not found')
    }
    this.container = containerElement
    
    this.clock = new THREE.Clock()
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    
    const state = useNebulaStore.getState()
    this.lastParams = {
      particleCount: state.particleCount,
      particleSize: state.particleSize,
      colorSpeed: state.colorSpeed,
      colorThemeIndex: state.colorThemeIndex
    }
    
    this.scene = this.createScene()
    this.camera = this.createCamera()
    this.renderer = this.createRenderer()
    this.controls = this.createControls()
    
    this.nebulaSystem = new NebulaSystem(this.scene)
    this.controlPanel = new ControlPanel('control-panel')
    this.controlPanel.subscribeToStore()
    
    this.setupEventListeners()
    this.subscribeToStore()
    
    this.animate()
  }
  
  private createScene(): THREE.Scene {
    const scene = new THREE.Scene()
    
    const canvas = document.createElement('canvas')
    canvas.width = 2
    canvas.height = 512
    const ctx = canvas.getContext('2d')!
    const gradient = ctx.createLinearGradient(0, 0, 0, 512)
    gradient.addColorStop(0, '#0B0B1A')
    gradient.addColorStop(1, '#1A1A2E')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 2, 512)
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    scene.background = texture
    
    scene.fog = new THREE.FogExp2(0x0B0B1A, 0.008)
    
    return scene
  }
  
  private createCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.set(0, 15, 60)
    camera.lookAt(0, 0, 0)
    return camera
  }
  
  private createRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x0B0B1A, 1)
    this.container.appendChild(renderer.domElement)
    return renderer
  }
  
  private createControls(): OrbitControls {
    const controls = new OrbitControls(this.camera, this.renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.enableZoom = true
    controls.minDistance = 15
    controls.maxDistance = 150
    controls.enablePan = false
    controls.autoRotate = false
    controls.autoRotateSpeed = 0.5
    return controls
  }
  
  private setupEventListeners(): void {
    window.addEventListener('resize', this.onWindowResize.bind(this))
    this.renderer.domElement.addEventListener('click', this.onCanvasClick.bind(this))
  }
  
  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  }
  
  private onCanvasClick(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    
    this.raycaster.setFromCamera(this.mouse, this.camera)
    
    const particleSystem = this.nebulaSystem.getParticleSystem()
    if (!particleSystem) return
    
    const intersects = this.raycaster.intersectObject(particleSystem)
    
    if (intersects.length > 0) {
      const point = intersects[0].point
      this.nebulaSystem.createRipple(point)
    }
  }
  
  private subscribeToStore(): void {
    useNebulaStore.subscribe((state) => {
      const paramsChanged: Partial<{
        particleCount: number
        particleSize: number
        colorSpeed: number
        colorThemeIndex: number
      }> = {}
      
      if (state.particleCount !== this.lastParams.particleCount) {
        paramsChanged.particleCount = state.particleCount
        this.lastParams.particleCount = state.particleCount
      }
      
      if (state.particleSize !== this.lastParams.particleSize) {
        paramsChanged.particleSize = state.particleSize
        this.lastParams.particleSize = state.particleSize
      }
      
      if (state.colorSpeed !== this.lastParams.colorSpeed) {
        paramsChanged.colorSpeed = state.colorSpeed
        this.lastParams.colorSpeed = state.colorSpeed
      }
      
      if (state.colorThemeIndex !== this.lastParams.colorThemeIndex) {
        paramsChanged.colorThemeIndex = state.colorThemeIndex
        this.lastParams.colorThemeIndex = state.colorThemeIndex
      }
      
      if (Object.keys(paramsChanged).length > 0) {
        this.nebulaSystem.updateParams(paramsChanged)
      }
    })
  }
  
  private animate(): void {
    this.animationId = requestAnimationFrame(this.animate.bind(this))
    
    const delta = this.clock.getDelta()
    
    this.controls.update()
    this.nebulaSystem.update(delta)
    
    this.renderer.render(this.scene, this.camera)
  }
  
  public dispose(): void {
    cancelAnimationFrame(this.animationId)
    window.removeEventListener('resize', this.onWindowResize.bind(this))
    this.renderer.domElement.removeEventListener('click', this.onCanvasClick.bind(this))
    
    this.nebulaSystem.dispose()
    this.controlPanel.dispose()
    
    this.controls.dispose()
    this.renderer.dispose()
    
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement)
    }
  }
}

let app: App | null = null

document.addEventListener('DOMContentLoaded', () => {
  app = new App()
})

export { App }
