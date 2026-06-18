import * as THREE from 'three'
import { ParticleSystem } from '../particles/ParticleSystem'

export class SceneManager {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private particleSystem: ParticleSystem
  private container: HTMLElement

  private animationId: number | null = null
  private lastTime: number = 0
  private fps: number = 60
  private frameCount: number = 0
  private fpsUpdateTime: number = 0
  private emitInterval: number = 50

  private stars: THREE.Points | null = null

  private isMouseDown: boolean = false
  private mousePosition: THREE.Vector2 = new THREE.Vector2()
  private lastMouseWorldPos: THREE.Vector3 = new THREE.Vector3()
  private lastEmitTime: number = 0
  private brushColor: THREE.Color = new THREE.Color('#FFD700')
  private brushSize: number = 2

  private cameraInitialPosition: THREE.Vector3 = new THREE.Vector3(0, 5, 10)
  private cameraTarget: THREE.Vector3 = new THREE.Vector3(0, 0, 0)

  private raycaster: THREE.Raycaster = new THREE.Raycaster()
  private plane: THREE.Plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)

  constructor(container: HTMLElement) {
    this.container = container

    this.scene = new THREE.Scene()

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    )
    this.camera.position.copy(this.cameraInitialPosition)
    this.camera.lookAt(this.cameraTarget)

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setClearColor(0x000000, 0)
    container.appendChild(this.renderer.domElement)

    this.particleSystem = new ParticleSystem({
      maxParticles: 5000,
      particleLifetime: 15
    })
    this.scene.add(this.particleSystem.getPoints())

    this.addLights()
    this.addStars()

    window.addEventListener('resize', this.handleResize)
  }

  private addLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    this.scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0xffffff, 1, 100)
    pointLight.position.set(10, 10, 10)
    this.scene.add(pointLight)
  }

  private addStars(): void {
    const starCount = 200
    const positions = new Float32Array(starCount * 3)
    const colors = new Float32Array(starCount * 3)

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3
      positions[i3] = (Math.random() - 0.5) * 60
      positions[i3 + 1] = (Math.random() - 0.5) * 40
      positions[i3 + 2] = (Math.random() - 0.5) * 40 - 20

      const brightness = 0.3 + Math.random() * 0.3
      colors[i3] = brightness
      colors[i3 + 1] = brightness
      colors[i3 + 2] = brightness
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true
    })

    this.stars = new THREE.Points(geometry, material)
    this.scene.add(this.stars)
  }

  start(): void {
    this.lastTime = performance.now()
    this.animate()
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate)

    const currentTime = performance.now()
    const deltaTime = (currentTime - this.lastTime) / 1000
    this.lastTime = currentTime

    this.updateFPS(deltaTime)
    this.adjustEmitInterval()

    if (this.isMouseDown) {
      const now = currentTime
      if (now - this.lastEmitTime >= this.emitInterval) {
        this.emitParticles()
        this.lastEmitTime = now
      }
    }

    this.particleSystem.update(deltaTime)
    this.updateStars(deltaTime)

    this.renderer.render(this.scene, this.camera)
  }

  private updateFPS(deltaTime: number): void {
    this.frameCount++
    this.fpsUpdateTime += deltaTime

    if (this.fpsUpdateTime >= 0.5) {
      this.fps = this.frameCount / this.fpsUpdateTime
      this.frameCount = 0
      this.fpsUpdateTime = 0
    }
  }

  private adjustEmitInterval(): void {
    if (this.fps < 45) {
      this.emitInterval = 100
    } else {
      this.emitInterval = 50
    }
  }

  private emitParticles(): void {
    const worldPos = this.getMouseWorldPosition()
    if (!worldPos) return

    const direction = new THREE.Vector3().subVectors(worldPos, this.lastMouseWorldPos).normalize()

    if (direction.length() < 0.01) {
      direction.set(0, 0, -1)
    }

    const particleCount = Math.floor(Math.random() * 11) + 20

    this.particleSystem.emitParticles(
      worldPos,
      direction,
      this.brushColor,
      particleCount,
      this.brushSize
    )

    this.lastMouseWorldPos.copy(worldPos)
  }

  private updateStars(deltaTime: number): void {
    if (this.stars) {
      this.stars.rotation.y += deltaTime * 0.01
    }
  }

  private handleResize = (): void => {
    const width = this.container.clientWidth
    const height = this.container.clientHeight

    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(width, height)
  }

  setMousePosition(x: number, y: number): void {
    const rect = this.container.getBoundingClientRect()
    this.mousePosition.x = ((x - rect.left) / rect.width) * 2 - 1
    this.mousePosition.y = -((y - rect.top) / rect.height) * 2 + 1

    const worldPos = this.getMouseWorldPosition()
    if (worldPos) {
      this.lastMouseWorldPos.copy(worldPos)
    }
  }

  private getMouseWorldPosition(): THREE.Vector3 | null {
    this.raycaster.setFromCamera(this.mousePosition, this.camera)

    const intersectPoint = new THREE.Vector3()
    this.raycaster.ray.intersectPlane(this.plane, intersectPoint)

    return intersectPoint
  }

  getBrushWorldPosition(): THREE.Vector3 | null {
    return this.getMouseWorldPosition()
  }

  setMouseDown(isDown: boolean): void {
    this.isMouseDown = isDown
    if (isDown) {
      this.lastEmitTime = performance.now()
      const worldPos = this.getMouseWorldPosition()
      if (worldPos) {
        this.lastMouseWorldPos.copy(worldPos)
      }
    }
  }

  setBrushColor(color: string): void {
    this.brushColor = new THREE.Color(color)
  }

  setBrushSize(size: number): void {
    this.brushSize = size
  }

  getBrushSize(): number {
    return this.brushSize
  }

  reset(): void {
    this.particleSystem.reset()
    this.camera.position.copy(this.cameraInitialPosition)
    this.camera.lookAt(this.cameraTarget)
  }

  getScene(): THREE.Scene {
    return this.scene
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera
  }

  getRenderer(): THREE.WebGLRenderer {
    return this.renderer
  }

  getParticleCount(): number {
    return this.particleSystem.getParticleCount()
  }

  dispose(): void {
    this.stop()
    window.removeEventListener('resize', this.handleResize)
    this.particleSystem.dispose()
    this.renderer.dispose()
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement)
    }
  }
}
