import * as THREE from 'three'
import { ParticleSystem } from './particleSystem'
import { InteractionManager } from './interaction'

class App {
  private scene!: THREE.Scene
  private camera!: THREE.PerspectiveCamera
  private renderer!: THREE.WebGLRenderer
  private container: HTMLElement
  private particleSystem!: ParticleSystem
  private interactionManager!: InteractionManager
  private clock: THREE.Clock
  private fps: number
  private frameCount: number
  private lastFpsUpdate: number

  constructor() {
    this.container = document.getElementById('app')!
    this.clock = new THREE.Clock()
    this.fps = 60
    this.frameCount = 0
    this.lastFpsUpdate = Date.now()

    this.initScene()
    this.initCamera()
    this.initRenderer()
    this.initParticleSystem()
    this.initInteraction()
    this.initControls()

    window.addEventListener('resize', this.onWindowResize.bind(this))
    this.animate()
  }

  private initScene(): void {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0a0a2e)
    
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5)
    this.scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0xffffff, 0.5)
    pointLight.position.set(10, 10, 10)
    this.scene.add(pointLight)
  }

  private initCamera(): void {
    const aspect = this.container.clientWidth / this.container.clientHeight
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000)
    this.camera.position.set(10, 5, 10)
    this.camera.lookAt(0, 0, 0)
  }

  private initRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setClearColor(0x0a0a2e, 1)
    this.container.appendChild(this.renderer.domElement)
  }

  private initParticleSystem(): void {
    this.particleSystem = new ParticleSystem(this.scene)
  }

  private initInteraction(): void {
    this.interactionManager = new InteractionManager(this.camera, this.renderer.domElement)
  }

  private initControls(): void {
    const gravitySlider = document.getElementById('gravity-slider') as HTMLInputElement
    const gravityValue = document.getElementById('gravity-value') as HTMLElement
    gravitySlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value)
      this.particleSystem.gravityStrength = value
      gravityValue.textContent = value.toFixed(1)
    })

    const repulsionSlider = document.getElementById('repulsion-slider') as HTMLInputElement
    const repulsionValue = document.getElementById('repulsion-value') as HTMLElement
    repulsionSlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value)
      this.particleSystem.repulsionStrength = value
      repulsionValue.textContent = value.toFixed(1)
    })

    const speedSlider = document.getElementById('speed-slider') as HTMLInputElement
    const speedValue = document.getElementById('speed-value') as HTMLElement
    speedSlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value)
      this.particleSystem.speed = value
      speedValue.textContent = value.toFixed(1)
    })
  }

  private onWindowResize(): void {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
  }

  private updateStats(): void {
    this.frameCount++
    const currentTime = Date.now()
    if (currentTime - this.lastFpsUpdate >= 1000) {
      this.fps = this.frameCount * 1000 / (currentTime - this.lastFpsUpdate)
      this.frameCount = 0
      this.lastFpsUpdate = currentTime
    }

    const particleCount = document.getElementById('particle-count')
    const avgEnergy = document.getElementById('avg-energy')
    if (particleCount) {
      particleCount.textContent = this.particleSystem.getParticleCount().toString()
    }
    if (avgEnergy) {
      avgEnergy.textContent = this.particleSystem.getAverageEnergy().toFixed(1)
    }
  }

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this))

    const deltaTime = this.clock.getDelta()
    const mouseField = this.interactionManager.getActiveField()

    this.particleSystem.update(deltaTime, mouseField, this.fps)
    this.interactionManager.update()
    this.updateStats()

    this.renderer.render(this.scene, this.camera)
  }

  dispose(): void {
    this.particleSystem.dispose()
    this.interactionManager.dispose()
    this.renderer.dispose()
  }
}

new App()