import * as THREE from 'three'
import type { ElementType, MatchQuality } from '../shared/types'
import { ELEMENT_COLORS } from '../shared/types'

const MAX_PARTICLE_SYSTEMS = 50
const PARTICLE_LIFETIME = 3.0

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

  public triggerEffect(element: ElementType, quality: MatchQuality, screenX: number, screenY: number): void {
    if (this.particleSystems.length >= MAX_PARTICLE_SYSTEMS) {
      this.removeOldestSystem()
    }

    const multiplier = quality === 'perfect' ? 2.0 : quality === 'normal' ? 1.0 : 0.5
    const rect = this.container.getBoundingClientRect()
    const x = screenX - rect.left - rect.width / 2
    const y = -(screenY - rect.top - rect.height / 2)

    switch (element) {
      case 'fire':
        this.createFireEffect(x, y, multiplier)
        break
      case 'water':
        this.createWaterEffect(x, y, multiplier)
        break
      case 'wind':
        this.createWindEffect(x, y, multiplier)
        break
      case 'thunder':
        this.createThunderEffect(x, y, multiplier)
        break
    }

    this.activateLight(element, multiplier)
  }

  private activateLight(element: ElementType, multiplier: number): void {
    this.activeEffects.add(element)
    const light = this.elementLights[element]
    light.intensity = Math.max(light.intensity, 2.0 * multiplier)

    setTimeout(() => {
      this.activeEffects.delete(element)
      if (this.activeEffects.size === 0) {
        Object.values(this.elementLights).forEach((l) => {
          l.intensity = 0
        })
      }
    }, 1500)
  }

  private removeOldestSystem(): void {
    if (this.particleSystems.length === 0) return

    const oldest = this.particleSystems.shift()
    if (oldest) {
      this.scene.remove(oldest.mesh)
      oldest.mesh.geometry.dispose()
      if (oldest.mesh.material instanceof THREE.Material) {
        oldest.mesh.material.dispose()
      }
    }
  }

  private createFireEffect(x: number, y: number, multiplier: number): void {
    const particleCount = Math.floor(200 * multiplier)
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    const velocities = new Float32Array(particleCount * 3)
    const lifetimes = new Float32Array(particleCount)

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * 30 * multiplier
      positions[i * 3] = x + Math.cos(angle) * radius
      positions[i * 3 + 1] = y + Math.sin(angle) * radius
      positions[i * 3 + 2] = Math.random() * 50

      const colorProgress = Math.random()
      colors[i * 3] = 1.0
      colors[i * 3 + 1] = 0.3 + colorProgress * 0.5
      colors[i * 3 + 2] = colorProgress * 0.2

      sizes[i] = 4 + Math.random() * 8

      velocities[i * 3] = (Math.random() - 0.5) * 2
      velocities[i * 3 + 1] = 3 + Math.random() * 5 * multiplier
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 2

      lifetimes[i] = PARTICLE_LIFETIME * (0.5 + Math.random() * 0.5)
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const material = new THREE.PointsMaterial({
      size: 6,
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
      element: 'fire',
    })
  }

  private createWaterEffect(x: number, y: number, multiplier: number): void {
    const ringCount = Math.floor(3 * multiplier)
    const particlesPerRing = 80

    for (let r = 0; r < ringCount; r++) {
      const particleCount = particlesPerRing
      const geometry = new THREE.BufferGeometry()
      const positions = new Float32Array(particleCount * 3)
      const colors = new Float32Array(particleCount * 3)
      const sizes = new Float32Array(particleCount)
      const velocities = new Float32Array(particleCount * 3)
      const lifetimes = new Float32Array(particleCount)

      const baseRadius = 20 + r * 20
      const delay = r * 0.15

      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2
        positions[i * 3] = x + Math.cos(angle) * baseRadius
        positions[i * 3 + 1] = y + Math.sin(angle) * baseRadius
        positions[i * 3 + 2] = 0

        const shade = 0.6 + Math.random() * 0.4
        colors[i * 3] = 0.1
        colors[i * 3 + 1] = 0.5
        colors[i * 3 + 2] = shade

        sizes[i] = 3 + Math.random() * 4

        const expandSpeed = 40 + r * 15
        velocities[i * 3] = Math.cos(angle) * expandSpeed
        velocities[i * 3 + 1] = Math.sin(angle) * expandSpeed
        velocities[i * 3 + 2] = 0

        lifetimes[i] = PARTICLE_LIFETIME
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
        startTime: performance.now() + delay * 1000,
        element: 'water',
      })
    }
  }

  private createWindEffect(x: number, y: number, multiplier: number): void {
    const particleCount = Math.floor(180 * multiplier)
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    const velocities = new Float32Array(particleCount * 3)
    const lifetimes = new Float32Array(particleCount)
    const phases = new Float32Array(particleCount)

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 4 + Math.random() * 0.5
      const dist = Math.random() * 20
      positions[i * 3] = x + Math.cos(angle) * dist
      positions[i * 3 + 1] = y + Math.sin(angle) * dist
      positions[i * 3 + 2] = Math.random() * 30

      const shade = 0.5 + Math.random() * 0.5
      colors[i * 3] = 0.2
      colors[i * 3 + 1] = shade
      colors[i * 3 + 2] = 0.3

      sizes[i] = 3 + Math.random() * 5

      phases[i] = Math.random() * Math.PI * 2

      velocities[i * 3] = 0
      velocities[i * 3 + 1] = 0
      velocities[i * 3 + 2] = 2 + Math.random() * 3

      lifetimes[i] = PARTICLE_LIFETIME * (0.8 + Math.random() * 0.4)
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const material = new THREE.PointsMaterial({
      size: 4,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const mesh = new THREE.Points(geometry, material)
    mesh.userData.phases = phases
    this.scene.add(mesh)

    this.particleSystems.push({
      mesh,
      velocities,
      lifetimes,
      startTime: performance.now(),
      element: 'wind',
    })
  }

  private createThunderEffect(x: number, y: number, multiplier: number): void {
    const flashCount = Math.floor(3 * multiplier)
    const particlesPerFlash = 150

    for (let f = 0; f < flashCount; f++) {
      const particleCount = particlesPerFlash
      const geometry = new THREE.BufferGeometry()
      const positions = new Float32Array(particleCount * 3)
      const colors = new Float32Array(particleCount * 3)
      const sizes = new Float32Array(particleCount)
      const velocities = new Float32Array(particleCount * 3)
      const lifetimes = new Float32Array(particleCount)

      const delay = f * 0.1
      let currentX = x + (Math.random() - 0.5) * 40
      let currentY = y + 100

      for (let i = 0; i < particleCount; i++) {
        const progress = i / particleCount
        const stepY = -200 / particleCount

        currentY += stepY
        currentX += (Math.random() - 0.5) * 25 * (1 + multiplier * 0.3)

        positions[i * 3] = currentX + (Math.random() - 0.5) * 5
        positions[i * 3 + 1] = currentY + (Math.random() - 0.5) * 5
        positions[i * 3 + 2] = 0

        const brightness = 0.7 + Math.random() * 0.3
        colors[i * 3] = 0.6 * brightness
        colors[i * 3 + 1] = 0.4 * brightness
        colors[i * 3 + 2] = brightness

        sizes[i] = 3 + Math.random() * 4 * (1 - progress * 0.5)

        velocities[i * 3] = (Math.random() - 0.5) * 1
        velocities[i * 3 + 1] = (Math.random() - 0.5) * 1
        velocities[i * 3 + 2] = 0

        lifetimes[i] = 0.3 + Math.random() * 0.4
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

      const material = new THREE.PointsMaterial({
        size: 4,
        vertexColors: true,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })

      const mesh = new THREE.Points(geometry, material)
      this.scene.add(mesh)

      this.particleSystems.push({
        mesh,
        velocities,
        lifetimes,
        startTime: performance.now() + delay * 1000,
        element: 'thunder',
      })
    }
  }

  private animate(): void {
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this))
    const now = performance.now()
    const delta = 1 / 60

    if (this.starField) {
      const phases = this.starField.userData.phases as Float32Array
      const sizes = this.starField.geometry.attributes.size as THREE.BufferAttribute
      for (let i = 0; i < phases.length; i++) {
        const scale = 0.6 + Math.sin(now * 0.001 + phases[i]) * 0.4
        ;(sizes.array as Float32Array)[i] = (1 + Math.sin(now * 0.002 + phases[i]) * 0.5) * scale
      }
      sizes.needsUpdate = true
      this.starField.rotation.z += 0.00005
    }

    Object.keys(this.elementLights).forEach((key) => {
      const light = this.elementLights[key as ElementType]
      if (light.intensity > 0) {
        light.intensity = Math.max(0, light.intensity - delta * 1.5)
      }
    })

    for (let i = this.particleSystems.length - 1; i >= 0; i--) {
      const system = this.particleSystems[i]
      const elapsed = (now - system.startTime) / 1000

      if (elapsed < 0) continue

      const positions = system.mesh.geometry.attributes.position as THREE.BufferAttribute
      const colors = system.mesh.geometry.attributes.color as THREE.BufferAttribute
      const positionArr = positions.array as Float32Array
      const colorArr = colors.array as Float32Array
      const particleCount = positionArr.length / 3

      let allDead = true

      for (let j = 0; j < particleCount; j++) {
        const lifetime = system.lifetimes[j]
        const particleAge = elapsed

        if (particleAge >= lifetime) continue
        allDead = false

        const lifeRatio = particleAge / lifetime

        if (system.element === 'wind') {
          const phases = system.mesh.userData.phases as Float32Array
          const phase = phases[j]
          const angularSpeed = 8.0
          const radius = 10 + particleAge * 80
          const angle = phase + particleAge * angularSpeed
          positionArr[j * 3] += Math.cos(angle) * 1.5
          positionArr[j * 3 + 1] += Math.sin(angle) * 1.5 + system.velocities[j * 3 + 1] * delta * 10
          positionArr[j * 3 + 2] += system.velocities[j * 3 + 2] * delta * 30
        } else {
          positionArr[j * 3] += system.velocities[j * 3] * delta * 10
          positionArr[j * 3 + 1] += system.velocities[j * 3 + 1] * delta * 10
          positionArr[j * 3 + 2] += system.velocities[j * 3 + 2] * delta * 10
        }

        const fadeOut = 1.0 - lifeRatio
        if (system.mesh.material instanceof THREE.PointsMaterial) {
          system.mesh.material.opacity = Math.max(0, fadeOut * 0.9)
        }

        if (system.element === 'fire' && colors) {
          colorArr[j * 3 + 1] = Math.max(0, 0.3 * (1 - lifeRatio * 1.5))
        }
      }

      positions.needsUpdate = true
      if (colors) colors.needsUpdate = true

      if (allDead || elapsed > 5) {
        this.scene.remove(system.mesh)
        system.mesh.geometry.dispose()
        if (system.mesh.material instanceof THREE.Material) {
          system.mesh.material.dispose()
        }
        this.particleSystems.splice(i, 1)
      }
    }

    this.renderer.render(this.scene, this.camera)
  }

  public getDomElement(): HTMLCanvasElement {
    return this.renderer.domElement
  }

  public clearEffects(): void {
    for (const system of this.particleSystems) {
      this.scene.remove(system.mesh)
      system.mesh.geometry.dispose()
      if (system.mesh.material instanceof THREE.Material) {
        system.mesh.material.dispose()
      }
    }
    this.particleSystems = []
  }

  public destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
    }

    this.clearEffects()

    if (this.starField) {
      this.scene.remove(this.starField)
      this.starField.geometry.dispose()
      if (this.starField.material instanceof THREE.Material) {
        this.starField.material.dispose()
      }
    }

    Object.values(this.elementLights).forEach((light) => {
      this.scene.remove(light)
    })

    this.scene.remove(this.ambientLight)

    window.removeEventListener('resize', this.handleResize.bind(this))
    this.renderer.dispose()
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement)
    }
  }
}
