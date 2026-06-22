import * as THREE from 'three'
import { ParticleSystem } from './particleSystem'
import { UIController, SliderValues } from './uiController'

class NebulaApp {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private particleSystem: ParticleSystem
  private uiController: UIController
  private container: HTMLElement

  private isDragging: boolean = false
  private previousMousePosition: { x: number; y: number } = { x: 0, y: 0 }
  private cameraRotation: { x: number; y: number } = { x: 0, y: 0 }
  private cameraDistance: number = 15
  private minDistance: number = 0.5
  private maxDistance: number = 3
  private rotationSpeed: number = 0.5

  private clock: THREE.Clock
  private lastFrameTime: number = 0
  private frameCount: number = 0
  private worker: Worker | null = null

  constructor() {
    this.clock = new THREE.Clock()
    this.container = document.getElementById('canvas-container')!

    this.scene = new THREE.Scene()
    this.setupScene()

    this.camera = new THREE.PerspectiveCamera(
      75,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    )
    this.updateCameraPosition()

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    })
    this.setupRenderer()

    this.particleSystem = new ParticleSystem(this.scene)
    this.uiController = new UIController()

    this.bindEvents()
    this.initUICallbacks()
  }

  private setupScene(): void {
    const canvas = document.createElement('canvas')
    canvas.width = 2
    canvas.height = 2
    const ctx = canvas.getContext('2d')!
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 2)
    gradient.addColorStop(0, '#0A0A23')
    gradient.addColorStop(1, '#1A0A2E')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 2, 2)

    const texture = new THREE.CanvasTexture(canvas)
    this.scene.background = texture
  }

  private setupRenderer(): void {
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setClearColor(0x0A0A23, 1)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2
    this.container.appendChild(this.renderer.domElement)
  }

  private updateCameraPosition(): void {
    const x = this.cameraDistance * Math.sin(this.cameraRotation.y) * Math.cos(this.cameraRotation.x)
    const y = this.cameraDistance * Math.sin(this.cameraRotation.x)
    const z = this.cameraDistance * Math.cos(this.cameraRotation.y) * Math.cos(this.cameraRotation.x)
    
    this.camera.position.set(x, y, z)
    this.camera.lookAt(0, 0, 0)
  }

  private bindEvents(): void {
    this.renderer.domElement.addEventListener('mousedown', this.handleMouseDown.bind(this))
    window.addEventListener('mousemove', this.handleMouseMove.bind(this))
    window.addEventListener('mouseup', this.handleMouseUp.bind(this))
    this.renderer.domElement.addEventListener('wheel', this.handleWheel.bind(this), { passive: false })

    this.renderer.domElement.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false })
    this.renderer.domElement.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false })
    this.renderer.domElement.addEventListener('touchend', this.handleTouchEnd.bind(this))

    window.addEventListener('resize', this.handleWindowResize.bind(this))
  }

  private initUICallbacks(): void {
    this.uiController.init(
      this.handleGenerate.bind(this),
      this.handleExport.bind(this),
      this.handleSliderChange.bind(this)
    )

    this.particleSystem.setOnClusterHover((word) => {
      if (word) {
        const screenPos = this.getHoveredWordScreenPosition()
        if (screenPos) {
          this.uiController.showTooltip(word, screenPos)
        }
      } else {
        this.uiController.hideTooltip()
      }
    })
  }

  private getHoveredWordScreenPosition(): { x: number; y: number } | null {
    const result = this.particleSystem.getClusterAtPosition(
      new THREE.Vector3(this.previousMousePosition.x, this.previousMousePosition.y, 0),
      this.camera
    )

    if (result) {
      return { x: result.screenPos.x, y: result.screenPos.y }
    }
    return null
  }

  private handleGenerate(text: string): void {
    this.uiController.setGenerateButtonEnabled(false)

    const sentimentData = this.particleSystem.analyzeText(text)
    
    this.particleSystem.setDiffusionSpeed(this.uiController.getSliderValues().diffusionSpeed)
    this.particleSystem.createParticles(sentimentData)

    setTimeout(() => {
      this.uiController.setGenerateButtonEnabled(true)
    }, 2000)
  }

  private handleExport(): void {
    const originalSize = new THREE.Vector2()
    const originalPixelRatio = this.renderer.getPixelRatio()
    
    this.renderer.getSize(originalSize)
    
    this.renderer.setSize(1920, 1080)
    this.renderer.setPixelRatio(1)
    this.renderer.render(this.scene, this.camera)
    
    const dataURL = this.renderer.domElement.toDataURL('image/png')
    
    this.renderer.setSize(originalSize.x, originalSize.y)
    this.renderer.setPixelRatio(originalPixelRatio)
    
    const link = document.createElement('a')
    link.download = `情感星云_${new Date().toISOString().slice(0, 10)}.png`
    link.href = dataURL
    link.click()
  }

  private handleSliderChange(values: SliderValues): void {
    this.particleSystem.setDiffusionSpeed(values.diffusionSpeed)
    this.particleSystem.setSaturation(values.saturation)
    this.particleSystem.setBackgroundDepth(values.backgroundDepth)
  }

  private handleMouseDown(event: MouseEvent): void {
    if (event.button === 0) {
      this.isDragging = true
      this.previousMousePosition = { x: event.clientX, y: event.clientY }
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    const deltaX = event.clientX - this.previousMousePosition.x
    const deltaY = event.clientY - this.previousMousePosition.y

    if (this.isDragging) {
      this.cameraRotation.y += deltaX * this.rotationSpeed * Math.PI / 180
      this.cameraRotation.x += deltaY * this.rotationSpeed * Math.PI / 180
      this.cameraRotation.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.cameraRotation.x))
      this.updateCameraPosition()
    }

    this.previousMousePosition = { x: event.clientX, y: event.clientY }

    if (!this.isDragging) {
      const deltaTime = this.clock.getDelta()
      this.particleSystem.handleHover(
        new THREE.Vector3(event.clientX, event.clientY, 0),
        this.camera,
        deltaTime
      )
    }
  }

  private handleMouseUp(): void {
    this.isDragging = false
  }

  private handleWheel(event: WheelEvent): void {
    event.preventDefault()
    
    const zoomSpeed = 0.002
    const zoomDelta = event.deltaY * zoomSpeed
    
    this.cameraDistance = Math.max(
      this.minDistance * 15,
      Math.min(this.maxDistance * 15, this.cameraDistance + zoomDelta)
    )
    
    this.updateCameraPosition()
  }

  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault()
    if (event.touches.length === 1) {
      this.isDragging = true
      this.previousMousePosition = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY
      }
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault()
    
    if (event.touches.length === 1 && this.isDragging) {
      const touch = event.touches[0]
      const deltaX = touch.clientX - this.previousMousePosition.x
      const deltaY = touch.clientY - this.previousMousePosition.y

      this.cameraRotation.y += deltaX * this.rotationSpeed * Math.PI / 180
      this.cameraRotation.x += deltaY * this.rotationSpeed * Math.PI / 180
      this.cameraRotation.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.cameraRotation.x))
      this.updateCameraPosition()

      this.previousMousePosition = { x: touch.clientX, y: touch.clientY }
    } else if (event.touches.length === 2) {
      const touch1 = event.touches[0]
      const touch2 = event.touches[1]
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )
      
      if ((this as any).lastTouchDistance) {
        const delta = (this as any).lastTouchDistance - currentDistance
        this.cameraDistance = Math.max(
          this.minDistance * 15,
          Math.min(this.maxDistance * 15, this.cameraDistance + delta * 0.05)
        )
        this.updateCameraPosition()
      }
      
      ;(this as any).lastTouchDistance = currentDistance
    }
  }

  private handleTouchEnd(_event: TouchEvent): void {
    this.isDragging = false
    ;(this as any).lastTouchDistance = null
  }

  private handleWindowResize(): void {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
  }

  private updateFPS(): void {
    this.frameCount++
    const currentTime = performance.now()
    
    if (currentTime - this.lastFrameTime >= 1000) {
      this.frameCount = 0
      this.lastFrameTime = currentTime
    }
  }

  public animate(): void {
    requestAnimationFrame(this.animate.bind(this))

    const deltaTime = Math.min(this.clock.getDelta(), 0.1)
    
    this.particleSystem.update(deltaTime)
    this.updateFPS()

    if (this.backgroundStars) {
      this.backgroundStars.rotation.y += deltaTime * 0.02
    }

    this.renderer.render(this.scene, this.camera)
  }

  private get backgroundStars(): THREE.Points | null {
    return this.scene.children.find(
      child => child instanceof THREE.Points && child !== this.particleSystem.getPoints()
    ) as THREE.Points || null
  }

  public init(): void {
    const initialValues = this.uiController.getSliderValues()
    this.particleSystem.setSaturation(initialValues.saturation)
    this.particleSystem.setBackgroundDepth(initialValues.backgroundDepth)
    
    this.animate()
  }

  public destroy(): void {
    if (this.worker) {
      this.worker.terminate()
    }
    this.particleSystem.destroy()
    this.renderer.dispose()
  }
}

const app = new NebulaApp()
app.init()

window.addEventListener('beforeunload', () => {
  app.destroy()
})
