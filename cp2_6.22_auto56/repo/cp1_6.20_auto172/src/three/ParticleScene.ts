import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  FieldParams,
  ParticleState,
  computeFieldAcceleration,
  resolveElasticCollision,
  updateParticleVerlet,
  getRandomParticleColor,
} from '../utils/physics'

interface Particle extends ParticleState {
  mesh: THREE.Mesh
  glow: THREE.Mesh
  color: string
  charge: number
  trail: THREE.Vector3[]
  trailLine: THREE.Line
}

interface Spark {
  mesh: THREE.Mesh
  life: number
  maxLife: number
  velocity: THREE.Vector3
}

export interface SerializedParticle {
  position: { x: number; y: number; z: number }
  velocity: { x: number; y: number; z: number }
  color: string
  charge: number
}

const PARTICLE_COUNT = 200
const PARTICLE_RADIUS = 0.3
const COLLISION_DISTANCE = 0.6
const BOUNDS = 25

export class ParticleScene {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private controls: OrbitControls
  private particles: Particle[] = []
  private sparks: Spark[] = []
  private trailLength = 30
  private selectedParticle: Particle | null = null
  private velocityArrow: THREE.ArrowHelper | null = null
  private labelDiv: HTMLDivElement | null = null
  private audioContext: AudioContext | null = null
  private raycaster: THREE.Raycaster
  private mouse: THREE.Vector2
  private container: HTMLElement
  private animationId: number = 0
  private currentParams: FieldParams = {
    fieldType: 'gravity',
    strength: 50,
    direction: { x: 0, y: -1, z: 0 },
  }
  private targetParams: FieldParams = {
    fieldType: 'gravity',
    strength: 50,
    direction: { x: 0, y: -1, z: 0 },
  }

  constructor(container: HTMLElement) {
    this.container = container
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()

    this.scene = new THREE.Scene()
    this.setupBackground()

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    )
    this.camera.position.set(0, 5, 35)

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setClearColor(0x000000, 0)
    container.appendChild(this.renderer.domElement)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.minDistance = 10
    this.controls.maxDistance = 80

    this.setupLights()
    this.createParticles()
    this.createLabel()
    this.setupEventListeners()
    this.animate()
  }

  private setupBackground(): void {
    const canvas = document.createElement('canvas')
    canvas.width = 2
    canvas.height = 512
    const ctx = canvas.getContext('2d')!
    const gradient = ctx.createLinearGradient(0, 0, 0, 512)
    gradient.addColorStop(0, '#0b0e14')
    gradient.addColorStop(1, '#1a1f2e')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 2, 512)
    const texture = new THREE.CanvasTexture(canvas)
    this.scene.background = texture
  }

  private setupLights(): void {
    const ambient = new THREE.AmbientLight(0xffffff, 0.4)
    this.scene.add(ambient)
    const pointLight = new THREE.PointLight(0xffffff, 0.8, 100)
    pointLight.position.set(10, 20, 10)
    this.scene.add(pointLight)
  }

  private createParticles(): void {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const color = getRandomParticleColor()
      const position = new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
      )
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      )
      const charge = Math.random() > 0.5 ? 1 : -1

      const geometry = new THREE.SphereGeometry(PARTICLE_RADIUS, 16, 16)
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
      })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.copy(position)
      mesh.userData.index = i

      const glowGeometry = new THREE.SphereGeometry(PARTICLE_RADIUS * 1.8, 16, 16)
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.25,
      })
      const glow = new THREE.Mesh(glowGeometry, glowMaterial)
      glow.position.copy(position)

      const trailGeometry = new THREE.BufferGeometry()
      const trailPositions = new Float32Array(this.trailLength * 3)
      trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3))
      const trailColors = new Float32Array(this.trailLength * 3)
      const baseColor = new THREE.Color(color)
      for (let j = 0; j < this.trailLength; j++) {
        const alpha = 1 - j / this.trailLength
        trailColors[j * 3] = baseColor.r
        trailColors[j * 3 + 1] = baseColor.g
        trailColors[j * 3 + 2] = baseColor.b
        trailPositions[j * 3] = position.x
        trailPositions[j * 3 + 1] = position.y
        trailPositions[j * 3 + 2] = position.z
      }
      trailGeometry.setAttribute('color', new THREE.BufferAttribute(trailColors, 3))
      const trailMaterial = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
      })
      const trailLine = new THREE.Line(trailGeometry, trailMaterial)

      const trail: THREE.Vector3[] = []
      for (let j = 0; j < this.trailLength; j++) {
        trail.push(position.clone())
      }

      this.scene.add(mesh)
      this.scene.add(glow)
      this.scene.add(trailLine)

      this.particles.push({
        position,
        velocity,
        color,
        charge,
        mesh,
        glow,
        trail,
        trailLine,
      })
    }
  }

  private createLabel(): void {
    this.labelDiv = document.createElement('div')
    this.labelDiv.style.cssText = `
      position: absolute;
      background: rgba(15, 20, 35, 0.9);
      color: #fff;
      padding: 6px 10px;
      border-radius: 6px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      pointer-events: none;
      border: 1px solid rgba(74, 158, 255, 0.5);
      display: none;
      z-index: 100;
    `
    this.container.appendChild(this.labelDiv)
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.onResize)
    this.renderer.domElement.addEventListener('click', this.onClick)
  }

  private onResize = (): void => {
    const width = this.container.clientWidth
    const height = this.container.clientHeight
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }

  private onClick = (event: MouseEvent): void => {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, this.camera)
    const meshes = this.particles.map((p) => p.mesh)
    const intersects = this.raycaster.intersectObjects(meshes)

    if (this.velocityArrow) {
      this.scene.remove(this.velocityArrow)
      this.velocityArrow = null
    }

    if (intersects.length > 0) {
      const index = intersects[0].object.userData.index
      this.selectedParticle = this.particles[index]
    } else {
      this.selectedParticle = null
      if (this.labelDiv) this.labelDiv.style.display = 'none'
    }
  }

  private playCollisionSound(): void {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    const ctx = this.audioContext
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.value = 200
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.15, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.1)
  }

  private createSpark(position: THREE.Vector3): void {
    for (let i = 0; i < 5; i++) {
      const geometry = new THREE.SphereGeometry(0.08, 8, 8)
      const material = new THREE.MeshBasicMaterial({
        color: 0x00d2ff,
        transparent: true,
        opacity: 1,
      })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.copy(position)
      this.scene.add(mesh)

      this.sparks.push({
        mesh,
        life: 0.2,
        maxLife: 0.2,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 8
        ),
      })
    }
  }

  private checkCollisions(): void {
    const cellSize = COLLISION_DISTANCE * 1.5
    const grid = new Map<string, number[]>()

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i]
      const key = `${Math.floor(p.position.x / cellSize)},${Math.floor(p.position.y / cellSize)},${Math.floor(p.position.z / cellSize)}`
      if (!grid.has(key)) grid.set(key, [])
      grid.get(key)!.push(i)
    }

    const checked = new Set<string>()

    for (let i = 0; i < this.particles.length; i++) {
      const p1 = this.particles[i]
      const cx = Math.floor(p1.position.x / cellSize)
      const cy = Math.floor(p1.position.y / cellSize)
      const cz = Math.floor(p1.position.z / cellSize)

      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dz = -1; dz <= 1; dz++) {
            const key = `${cx + dx},${cy + dy},${cz + dz}`
            const cell = grid.get(key)
            if (!cell) continue

            for (const j of cell) {
              if (i >= j) continue
              const pairKey = `${Math.min(i, j)}-${Math.max(i, j)}`
              if (checked.has(pairKey)) continue
              checked.add(pairKey)

              const p2 = this.particles[j]
              const dist = p1.position.distanceTo(p2.position)

              if (dist < COLLISION_DISTANCE) {
                resolveElasticCollision(p1, p2)
                const midPoint = p1.position.clone().add(p2.position).multiplyScalar(0.5)
                this.createSpark(midPoint)
                this.playCollisionSound()
              }
            }
          }
        }
      }
    }
  }

  private updateSparks(deltaTime: number): void {
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const spark = this.sparks[i]
      spark.life -= deltaTime
      spark.mesh.position.add(spark.velocity.clone().multiplyScalar(deltaTime))
      ;(spark.mesh.material as THREE.MeshBasicMaterial).opacity =
        spark.life / spark.maxLife

      if (spark.life <= 0) {
        this.scene.remove(spark.mesh)
        spark.mesh.geometry.dispose()
        ;(spark.mesh.material as THREE.Material).dispose()
        this.sparks.splice(i, 1)
      }
    }
  }

  private smoothParams(): void {
    const lerp = 0.1
    this.currentParams.strength +=
      (this.targetParams.strength - this.currentParams.strength) * lerp
    this.currentParams.direction.x +=
      (this.targetParams.direction.x - this.currentParams.direction.x) * lerp
    this.currentParams.direction.y +=
      (this.targetParams.direction.y - this.currentParams.direction.y) * lerp
    this.currentParams.direction.z +=
      (this.targetParams.direction.z - this.currentParams.direction.z) * lerp
    this.currentParams.fieldType = this.targetParams.fieldType
  }

  private updateSelectedParticle(): void {
    if (!this.selectedParticle || !this.labelDiv) return

    const p = this.selectedParticle

    if (this.velocityArrow) {
      this.scene.remove(this.velocityArrow)
    }
    const dir = p.velocity.clone().normalize()
    const length = Math.min(p.velocity.length() * 0.8, 5)
    this.velocityArrow = new THREE.ArrowHelper(
      dir,
      p.position,
      length,
      0xffffff,
      0.8,
      0.4
    )
    ;(this.velocityArrow.cone.material as THREE.Material).transparent = true
    ;(this.velocityArrow.cone.material as THREE.MeshBasicMaterial).opacity = 0.7
    ;(this.velocityArrow.line.material as THREE.Material).transparent = true
    ;(this.velocityArrow.line.material as THREE.LineBasicMaterial).opacity = 0.7
    this.scene.add(this.velocityArrow)

    const screenPos = p.position.clone().project(this.camera)
    const rect = this.renderer.domElement.getBoundingClientRect()
    const x = (screenPos.x * 0.5 + 0.5) * rect.width
    const y = (-screenPos.y * 0.5 + 0.5) * rect.height

    this.labelDiv.style.display = 'block'
    this.labelDiv.style.left = `${x + 15}px`
    this.labelDiv.style.top = `${y - 10}px`
    this.labelDiv.textContent = `X: ${p.position.x.toFixed(2)}  Y: ${p.position.y.toFixed(
      2
    )}  Z: ${p.position.z.toFixed(2)}`
  }

  public updateParticles(params: FieldParams): void {
    this.targetParams = { ...params, direction: { ...params.direction } }
  }

  public setTrailLength(length: number): void {
    this.trailLength = Math.max(10, Math.min(50, length))

    for (const particle of this.particles) {
      while (particle.trail.length < this.trailLength) {
        particle.trail.push(particle.position.clone())
      }
      while (particle.trail.length > this.trailLength) {
        particle.trail.shift()
      }

      const trailPositions = new Float32Array(this.trailLength * 3)
      const trailColors = new Float32Array(this.trailLength * 3)
      const baseColor = new THREE.Color(particle.color)

      for (let j = 0; j < this.trailLength; j++) {
        const alpha = 1 - j / this.trailLength
        trailPositions[j * 3] = particle.trail[j].x
        trailPositions[j * 3 + 1] = particle.trail[j].y
        trailPositions[j * 3 + 2] = particle.trail[j].z
        trailColors[j * 3] = baseColor.r * alpha
        trailColors[j * 3 + 1] = baseColor.g * alpha
        trailColors[j * 3 + 2] = baseColor.b * alpha
      }

      particle.trailLine.geometry.dispose()
      const newGeometry = new THREE.BufferGeometry()
      newGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3))
      newGeometry.setAttribute('color', new THREE.BufferAttribute(trailColors, 3))
      particle.trailLine.geometry = newGeometry
    }
  }

  public resetParticles(): void {
    for (const p of this.particles) {
      p.position.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
      )
      p.velocity.set(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      )
      p.mesh.position.copy(p.position)
      p.glow.position.copy(p.position)

      for (let i = 0; i < p.trail.length; i++) {
        p.trail[i].copy(p.position)
      }
    }
    this.selectedParticle = null
    if (this.velocityArrow) {
      this.scene.remove(this.velocityArrow)
      this.velocityArrow = null
    }
    if (this.labelDiv) this.labelDiv.style.display = 'none'
  }

  public getSerializedParticles(): SerializedParticle[] {
    return this.particles.map((p) => ({
      position: { x: p.position.x, y: p.position.y, z: p.position.z },
      velocity: { x: p.velocity.x, y: p.velocity.y, z: p.velocity.z },
      color: p.color,
      charge: p.charge,
    }))
  }

  public loadSerializedParticles(data: SerializedParticle[]): void {
    for (let i = 0; i < Math.min(data.length, this.particles.length); i++) {
      const p = this.particles[i]
      const d = data[i]
      p.position.set(d.position.x, d.position.y, d.position.z)
      p.velocity.set(d.velocity.x, d.velocity.y, d.velocity.z)
      p.color = d.color
      p.charge = d.charge
      p.mesh.position.copy(p.position)
      p.glow.position.copy(p.position)
      ;(p.mesh.material as THREE.MeshBasicMaterial).color.set(d.color)
      ;(p.glow.material as THREE.MeshBasicMaterial).color.set(d.color)

      for (let j = 0; j < p.trail.length; j++) {
        p.trail[j].copy(p.position)
      }
    }
  }

  private lastTime = performance.now()

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate)
    const currentTime = performance.now()
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.05)
    this.lastTime = currentTime

    this.smoothParams()
    this.controls.update()

    for (const p of this.particles) {
      const acceleration = computeFieldAcceleration(p, this.currentParams)
      updateParticleVerlet(p, acceleration, BOUNDS)
      p.mesh.position.copy(p.position)
      p.glow.position.copy(p.position)

      p.trail.shift()
      p.trail.push(p.position.clone())

      const positions = p.trailLine.geometry.attributes.position.array as Float32Array
      const colors = p.trailLine.geometry.attributes.color.array as Float32Array
      const baseColor = new THREE.Color(p.color)

      for (let j = 0; j < p.trail.length; j++) {
        const alpha = 1 - j / p.trail.length
        positions[j * 3] = p.trail[j].x
        positions[j * 3 + 1] = p.trail[j].y
        positions[j * 3 + 2] = p.trail[j].z
        colors[j * 3] = baseColor.r * alpha
        colors[j * 3 + 1] = baseColor.g * alpha
        colors[j * 3 + 2] = baseColor.b * alpha
      }
      p.trailLine.geometry.attributes.position.needsUpdate = true
      p.trailLine.geometry.attributes.color.needsUpdate = true
    }

    this.checkCollisions()
    this.updateSparks(deltaTime)
    this.updateSelectedParticle()

    this.renderer.render(this.scene, this.camera)
  }

  public dispose(): void {
    cancelAnimationFrame(this.animationId)
    window.removeEventListener('resize', this.onResize)
    this.renderer.domElement.removeEventListener('click', this.onClick)

    for (const p of this.particles) {
      p.mesh.geometry.dispose()
      ;(p.mesh.material as THREE.Material).dispose()
      p.glow.geometry.dispose()
      ;(p.glow.material as THREE.Material).dispose()
      p.trailLine.geometry.dispose()
      ;(p.trailLine.material as THREE.Material).dispose()
    }

    if (this.labelDiv && this.labelDiv.parentNode) {
      this.labelDiv.parentNode.removeChild(this.labelDiv)
    }

    this.controls.dispose()
    this.renderer.dispose()
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement)
    }
  }
}
