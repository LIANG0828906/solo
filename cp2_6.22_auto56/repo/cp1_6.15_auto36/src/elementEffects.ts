import * as THREE from 'three'
import type { ElementType, MatchQuality } from '../shared/types'
import { ELEMENT_COLORS, ELEMENT_COUNTER } from '../shared/types'

const MAX_PARTICLE_SYSTEMS = 50
const PARTICLE_LIFETIME = 3.0
const TRANSITION_DURATION = 800
const MAX_TRAIL_POINTS = 40

interface ParticleSystemData {
  mesh: THREE.Points
  velocities: Float32Array
  lifetimes: Float32Array
  startTime: number
  element: ElementType
}

export class ElementEffects {
  private scene: THREE.Scene
  private camera: THREE.OrthographicCamera
  private renderer: THREE.WebGLRenderer
  private container: HTMLElement
  private particleSystems: ParticleSystemData[] = []
  private animationFrameId: number | null = null
  private starField: THREE.Points | null = null
  private elementLights: Record<ElementType, THREE.PointLight> = {} as Record<ElementType, THREE.PointLight>
  private ambientLight: THREE.AmbientLight
  private activeEffects: Set<ElementType> = new Set()

  private elementTransitionStartTime: number = 0
  private targetElement: ElementType | null = null
  private currentElement: ElementType | null = null

  private trailLine: THREE.Line | null = null
  private trailPoints: THREE.Vector3[] = []

  private frameCount: number = 0

  constructor(container: HTMLElement) {
    this.container = container

    const width = container.clientWidth
    const height = container.clientHeight

    this.scene = new THREE.Scene()
    this.scene.background = null

    this.camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, -1000, 1000)
    this.camera.position.z = 500

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(width, height)
    this.renderer.setClearColor(0x000000, 0)
    container.appendChild(this.renderer.domElement)

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
    this.scene.add(this.ambientLight)

    const elements: ElementType[] = ['fire', 'water', 'wind', 'thunder']
    elements.forEach((element) => {
      const color = new THREE.Color(ELEMENT_COLORS[element].primary)
      const light = new THREE.PointLight(color, 0, 300)
      light.position.set(0, 0, 100)
      this.elementLights[element] = light
      this.scene.add(light)
    })

    this.createStarField()
    this.createTrailLine()
    this.animate()

    window.addEventListener('resize', this.handleResize.bind(this))
  }

  private handleResize(): void {
    const width = this.container.clientWidth
    const height = this.container.clientHeight

    this.camera.left = -width / 2
    this.camera.right = width / 2
    this.camera.top = height / 2
    this.camera.bottom = -height / 2
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(width, height)
    this.updateStarField()
  }

  private createStarField(): void {
    const starCount = 300
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(starCount * 3)
    const colors = new Float32Array(starCount * 3)
    const sizes = new Float32Array(starCount)
    const phases = new Float32Array(starCount)

    const width = this.container.clientWidth
    const height = this.container.clientHeight

    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * width * 1.5
      positions[i * 3 + 1] = (Math.random() - 0.5) * height * 1.5
      positions[i * 3 + 2] = -200 - Math.random() * 300

      const shade = 0.5 + Math.random() * 0.5
      colors[i * 3] = shade
      colors[i * 3 + 1] = shade
      colors[i * 3 + 2] = 1.0

      sizes[i] = 0.5 + Math.random() * 2
      phases[i] = Math.random() * Math.PI * 2
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1))

    const material = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: false,
    })

    this.starField = new THREE.Points(geometry, material)
    this.starField.userData.phases = phases
    this.scene.add(this.starField)
  }

  private updateStarField(): void {
    if (!this.starField) return

    const starCount = 300
    const positions = this.starField.geometry.attributes.position.array as Float32Array
    const width = this.container.clientWidth
    const height = this.container.clientHeight

    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * width * 1.5
      positions[i * 3 + 1] = (Math.random() - 0.5) * height * 1.5
    }

    this.starField.geometry.attributes.position.needsUpdate = true
  }

  private createTrailLine(): void {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(MAX_TRAIL_POINTS * 3)
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const material = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      linewidth: 3,
    })

    this.trailLine = new THREE.Line(geometry, material)
    this.trailLine.visible = false
    this.scene.add(this.trailLine)
  }

  public transitionToElement(element: ElementType): void {
    this.targetElement = element
    this.elementTransitionStartTime = performance.now()

    const color = new THREE.Color(ELEMENT_COLORS[element].primary)
    const light = this.elementLights[element]
    light.intensity = Math.max(light.intensity, 1.5)
    this.activeEffects.add(element)
  }

  public addTrailPoint(screenX: number, screenY: number, element: ElementType): void {
    const rect = this.container.getBoundingClientRect()
    const x = screenX - rect.left - rect.width / 2
    const y = -(screenY - rect.top - rect.height / 2)
    const z = 50

    const point = new THREE.Vector3(x, y, z)
    this.trailPoints.push(point)

    if (this.trailPoints.length > MAX_TRAIL_POINTS) {
      this.trailPoints.shift()
    }

    if (this.trailLine) {
      const geometry = this.trailLine.geometry
      const positions = geometry.attributes.position.array as Float32Array

      for (let i = 0; i < MAX_TRAIL_POINTS; i++) {
        if (i < this.trailPoints.length) {
          const p = this.trailPoints[i]
          positions[i * 3] = p.x
          positions[i * 3 + 1] = p.y
          positions[i * 3 + 2] = p.z
        } else {
          positions[i * 3] = this.trailPoints[this.trailPoints.length - 1]?.x ?? 0
          positions[i * 3 + 1] = this.trailPoints[this.trailPoints.length - 1]?.y ?? 0
          positions[i * 3 + 2] = this.trailPoints[this.trailPoints.length - 1]?.z ?? 0
        }
      }

      geometry.attributes.position.needsUpdate = true
      geometry.setDrawRange(0, this.trailPoints.length)

      const material = this.trailLine.material as THREE.LineBasicMaterial
      material.color = new THREE.Color(ELEMENT_COLORS[element].primary)
      material.opacity = 0.9

      this.trailLine.visible = true
    }
  }

  public triggerCounterEffect(attacker: ElementType, defender: ElementType, screenX: number, screenY: number): void {
    if (ELEMENT_COUNTER[attacker] !== defender) return

    const rect = this.container.getBoundingClientRect()
    const x = screenX - rect.left - rect.width / 2
    const y = -(screenY - rect.top - rect.height / 2)

    if (attacker === 'fire' && defender === 'wind') {
      this.createFireEffect(x, y, 1.5, true)
      this.createWindDissolveEffect(x, y)
    } else if (attacker === 'wind' && defender === 'thunder') {
      this.createWindEffect(x, y, 1.5)
      this.createThunderDisperseEffect(x, y)
    } else if (attacker === 'thunder' && defender === 'water') {
      this.createThunderEffect(x, y, 1.5)
      this.createWaterEvaporateEffect(x, y)
    } else if (attacker === 'water' && defender === 'fire') {
      this.createWaterEffect(x, y, 1.5)
      this.createFireExtinguishEffect(x, y)
    }

    this.activateLight(attacker, 1.5)
  }

  private createWindDissolveEffect(x: number, y: number): void {
    const particleCount = 100
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    const velocities = new Float32Array(particleCount * 3)
    const lifetimes = new Float32Array(particleCount)

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * 20
      positions[i * 3] = x + Math.cos(angle) * radius
      positions[i * 3 + 1] = y + Math.sin(angle) * radius
      positions[i * 3 + 2] = Math.random() * 30

      const shade = 0.6 + Math.random() * 0.4
      colors[i * 3] = 0.3
      colors[i * 3 + 1] = shade
      colors[i * 3 + 2] = 0.4

      sizes[i] = 2 + Math.random() * 4

      const expandSpeed = 80 + Math.random() * 60
      velocities[i * 3] = Math.cos(angle) * expandSpeed
      velocities[i * 3 + 1] = Math.sin(angle) * expandSpeed + 20
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 40

      lifetimes[i] = 1.5 + Math.random() * 1.0
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const material = new THREE.PointsMaterial({
      size: 5,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const mesh = new THREE.Points(geometry, material)
    this.scene.add(mesh)

    this.particleSystems.push({
      mesh,
      velocities,
      lifetimes,
      startTime: performance.now(),
      element: 'wind',
    })
  }

  private createThunderDisperseEffect(x: number, y: number): void {
    const particleCount = 80
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    const velocities = new Float32Array(particleCount * 3)
    const lifetimes = new Float32Array(particleCount)

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = x + (Math.random() - 0.5) * 40
      positions[i * 3 + 1] = y + (Math.random() - 0.5) * 40
      positions[i * 3 + 2] = Math.random() * 20

      colors[i * 3] = 0.7
      colors[i * 3 + 1] = 0.5
      colors[i * 3 + 2] = 1.0

      sizes[i] = 2 + Math.random() * 3

      velocities[i * 3] = (Math.random() - 0.5) * 100
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 100
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 50

      lifetimes[i] = 1.0 + Math.random() * 0.5
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const material = new THREE.PointsMaterial({
      size: 4,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const mesh = new THREE.Points(geometry, material)
    this.scene.add(mesh)

    this.particleSystems.push({
      mesh,
      velocities,
      lifetimes,
      startTime: performance.now(),
      element: 'thunder',
    })
  }

  private createWaterEvaporateEffect(x: number, y: number): void {
    const particleCount = 90
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    const velocities = new Float32Array(particleCount * 3)
    const lifetimes = new Float32Array(particleCount)

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * 25
      positions[i * 3] = x + Math.cos(angle) * radius
      positions[i * 3 + 1] = y + Math.sin(angle) * radius
      positions[i * 3 + 2] = Math.random() * 30

      colors[i * 3] = 0.6
      colors[i * 3 + 1] = 0.9
      colors[i * 3 + 2] = 1.0

      sizes[i] = 2 + Math.random() * 4

      velocities[i * 3] = (Math.random() - 0.5) * 20
      velocities[i * 3 + 1] = 40 + Math.random() * 60
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 30

      lifetimes[i] = 1.5 + Math.random() * 0.8
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const material = new THREE.PointsMaterial