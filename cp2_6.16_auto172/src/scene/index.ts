import * as THREE from 'three'
import { ParticleSystem } from './particles'
import { useMeditationStore } from '@/store/meditationStore'

export class MainScene {
  public scene: THREE.Scene
  public camera: THREE.PerspectiveCamera
  public renderer: THREE.WebGLRenderer
  private sphere: THREE.Mesh
  private glowSphere: THREE.Mesh
  private particles: ParticleSystem
  private ambientLight: THREE.AmbientLight
  private directionalLight: THREE.DirectionalLight
  private clock: THREE.Clock
  private sphereRadius: number = 2.5
  private isDragging: boolean = false
  private previousMousePosition: { x: number; y: number } = { x: 0, y: 0 }
  private targetRotation: { x: number; y: number } = { x: 0.3, y: 0 }
  private currentRotation: { x: number; y: number } = { x: 0.3, y: 0 }
  private backgroundStartColor: THREE.Color
  private backgroundEndColor: THREE.Color
  private backgroundProgress: number = 0
  private backgroundDuration: number = 8
  private surfaceParticles: THREE.Points

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene()
    this.backgroundStartColor = new THREE.Color(0x9B59B6)
    this.backgroundEndColor = new THREE.Color(0x2C3E50)
    this.scene.background = this.backgroundStartColor.clone()

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    )

    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
    })
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(this.renderer.domElement)

    this.sphere = this.createSphere()
    this.glowSphere = this.createGlowSphere()
    this.surfaceParticles = this.createSurfaceParticles()
    this.scene.add(this.sphere)
    this.scene.add(this.glowSphere)
    this.scene.add(this.surfaceParticles)

    this.ambientLight = new THREE.AmbientLight(0x404040, 1)
    this.scene.add(this.ambientLight)

    this.directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.6)
    this.directionalLight.position.set(5, 5, 5)
    this.scene.add(this.directionalLight)

    this.particles = new ParticleSystem(this.scene, this.sphereRadius)

    this.clock = new THREE.Clock()

    this.setupEventListeners(container)
    this.updateCameraPosition()
  }

  private createSphere(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(this.sphereRadius, 64, 64)
    const material = new THREE.MeshPhongMaterial({
      color: 0x8E7CC3,
      transparent: true,
      opacity: 0.3,
      emissive: 0x9B59B6,
      emissiveIntensity: 0.2,
      shininess: 100,
    })
    const sphere = new THREE.Mesh(geometry, material)
    return sphere
  }

  private createGlowSphere(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(this.sphereRadius * 1.1, 32, 32)
    const material = new THREE.MeshBasicMaterial({
      color: 0x9B59B6,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
    })
    const glowSphere = new THREE.Mesh(geometry, material)
    return glowSphere
  }

  private createSurfaceParticles(): THREE.Points {
    const particleCount = 200
    const positions = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    const colors = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = this.sphereRadius * (0.98 + Math.random() * 0.04)

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)

      sizes[i] = 0.02 + Math.random() * 0.03
      
      const color = new THREE.Color().setHSL(0.75 + Math.random() * 0.1, 0.8, 0.7)
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const material = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    })

    return new THREE.Points(geometry, material)
  }

  private setupEventListeners(container: HTMLElement): void {
    container.addEventListener('mousedown', this.onMouseDown.bind(this))
    container.addEventListener('mousemove', this.onMouseMove.bind(this))
    container.addEventListener('mouseup', this.onMouseUp.bind(this))
    container.addEventListener('mouseleave', this.onMouseUp.bind(this))
    container.addEventListener('wheel', this.onWheel.bind(this))
    container.addEventListener('dblclick', this.onDoubleClick.bind(this))
    container.addEventListener('touchstart', this.onTouchStart.bind(this))
    container.addEventListener('touchmove', this.onTouchMove.bind(this))
    container.addEventListener('touchend', this.onTouchEnd.bind(this))
    window.addEventListener('resize', this.onResize.bind(this))
  }

  private onMouseDown(event: MouseEvent): void {
    if (event.button === 0) {
      this.isDragging = true
      this.previousMousePosition = {
        x: event.clientX,
        y: event.clientY,
      }
    }
  }

  private onMouseMove(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect()
    const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1
    
    this.particles.checkMouseHover(this.camera, mouseX, mouseY)

    if (!this.isDragging) return

    const deltaMove = {
      x: event.clientX - this.previousMousePosition.x,
      y: event.clientY - this.previousMousePosition.y,
    }

    this.targetRotation.y -= deltaMove.x * 0.005
    this.targetRotation.x -= deltaMove.y * 0.005
    this.targetRotation.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.targetRotation.x))

    this.previousMousePosition = {
      x: event.clientX,
      y: event.clientY,
    }

    useMeditationStore.getState().setCameraRotation(this.targetRotation.x, this.targetRotation.y)
  }

  private onMouseUp(): void {
    this.isDragging = false
  }

  private onWheel(event: WheelEvent): void {
    event.preventDefault()
    const state = useMeditationStore.getState()
    const newDistance = state.cameraDistance + event.deltaY * 0.01
    useMeditationStore.getState().setCameraDistance(newDistance)
  }

  private onDoubleClick(): void {
    useMeditationStore.getState().resetView()
    this.targetRotation = { x: 0.3, y: 0 }
  }

  private onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      this.isDragging = true
      this.previousMousePosition = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      }
    }
  }

  private onTouchMove(event: TouchEvent): void {
    if (!this.isDragging || event.touches.length !== 1) return
    event.preventDefault()

    const deltaMove = {
      x: event.touches[0].clientX - this.previousMousePosition.x,
      y: event.touches[0].clientY - this.previousMousePosition.y,
    }

    this.targetRotation.y -= deltaMove.x * 0.005
    this.targetRotation.x -= deltaMove.y * 0.005
    this.targetRotation.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.targetRotation.x))

    this.previousMousePosition = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    }

    useMeditationStore.getState().setCameraRotation(this.targetRotation.x, this.targetRotation.y)
  }

  private onTouchEnd(): void {
    this.isDragging = false
  }

  private onResize(): void {
    const container = this.renderer.domElement.parentElement
    if (!container) return

    this.camera.aspect = container.clientWidth / container.clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(container.clientWidth, container.clientHeight)
  }

  private updateCameraPosition(): void {
    const state = useMeditationStore.getState()
    const distance = state.cameraDistance

    const x = distance * Math.sin(this.currentRotation.y) * Math.cos(this.currentRotation.x)
    const y = distance * Math.sin(this.currentRotation.x)
    const z = distance * Math.cos(this.currentRotation.y) * Math.cos(this.currentRotation.x)

    this.camera.position.set(x, y, z)
    this.camera.lookAt(0, 0, 0)
  }

  private easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
  }

  private updateSphereScale(breathingPhase: string, breathingProgress: number, inhaleDuration: number, exhaleDuration: number): void {
    let scale: number
    const minScale = 1.0
    const maxScale = 1.15

    if (breathingPhase === 'inhale') {
      const t = breathingProgress / inhaleDuration
      const easedT = this.easeInOut(t)
      scale = minScale + (maxScale - minScale) * easedT
    } else {
      const t = breathingProgress / exhaleDuration
      const easedT = this.easeInOut(t)
      scale = maxScale - (maxScale - minScale) * easedT
    }

    this.sphere.scale.setScalar(scale)
    this.glowSphere.scale.setScalar(scale)
    this.surfaceParticles.scale.setScalar(scale)
  }

  private updateBackground(delta: number): void {
    this.backgroundProgress += delta
    if (this.backgroundProgress >= this.backgroundDuration) {
      this.backgroundProgress -= this.backgroundDuration
    }

    const t = (Math.sin((this.backgroundProgress / this.backgroundDuration) * Math.PI * 2 - Math.PI / 2) + 1) / 2
    const color = new THREE.Color().lerpColors(
      this.backgroundStartColor,
      this.backgroundEndColor,
      t
    )
    this.scene.background = color
    
    useMeditationStore.getState().setBackgroundHue(t)
    this.particles.updateColors(t)
  }

  public update(): void {
    const delta = this.clock.getDelta()
    const state = useMeditationStore.getState()

    useMeditationStore.getState().updateBreathing(delta)

    this.updateBackground(delta)

    this.updateSphereScale(
      state.breathingPhase,
      state.breathingProgress,
      state.inhaleDuration,
      state.exhaleDuration
    )

    this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.1
    this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.1
    this.updateCameraPosition()

    this.surfaceParticles.rotation.y += delta * 0.1

    if (state.isMeditating && !state.isPaused) {
      this.particles.spawnParticles(delta)
    }
    
    this.particles.update(delta)

    this.renderer.render(this.scene, this.camera)
  }

  public dispose(): void {
    this.particles.dispose()
    this.sphere.geometry.dispose()
    ;(this.sphere.material as THREE.Material).dispose()
    this.glowSphere.geometry.dispose()
    ;(this.glowSphere.material as THREE.Material).dispose()
    this.surfaceParticles.geometry.dispose()
    ;(this.surfaceParticles.material as THREE.Material).dispose()
    this.renderer.dispose()
  }
}
