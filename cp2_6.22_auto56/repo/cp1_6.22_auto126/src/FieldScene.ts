import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { getVector, type FieldType, type FieldParams, defaultParams } from './ForceField'

const COLOR_LOW = new THREE.Color(0x0066CC)
const COLOR_HIGH = new THREE.Color(0xFF3300)
const BOUNDARY = 10
const GRID_STEP = 2
const MAX_PARTICLES = 5
const PARTICLE_SPEED = 2
const TRAIL_DURATION = 0.8
const SCALE_TRANSITION_TIME = 0.3

interface ArrowData {
  position: THREE.Vector3
  targetScale: number
  currentScale: number
  targetColor: THREE.Color
  currentColor: THREE.Color
  direction: THREE.Vector3
}

interface TrailPoint {
  position: THREE.Vector3
  time: number
}

interface Particle {
  mesh: THREE.Mesh
  trail: THREE.Line
  trailGeometry: THREE.BufferGeometry
  active: boolean
  history: TrailPoint[]
}

export class FieldScene {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private controls: OrbitControls
  private container: HTMLElement

  private arrowHeads!: THREE.InstancedMesh
  private arrowTrails!: THREE.InstancedMesh
  private arrowData: ArrowData[] = []
  private arrowCount = 0

  private particles: Particle[] = []

  private fieldType: FieldType = 'gravity'
  private fieldParams: FieldParams = { ...defaultParams }

  private animationId: number | null = null
  private lastTime = 0
  private currentTime = 0
  private fps = 0
  private fpsFrames = 0
  private fpsLastUpdate = 0
  private fpsCallback?: (fps: number) => void

  private raycaster = new THREE.Raycaster()
  private mouse = new THREE.Vector2()
  private isDragging = false
  private downPos = new THREE.Vector2()

  private dummy = new THREE.Object3D()
  private tmpColor = new THREE.Color()
  private tmpVec = new THREE.Vector3()
  private tmpVec2 = new THREE.Vector3()
  private tmpQuat = new THREE.Quaternion()
  private tmpQuat2 = new THREE.Quaternion()

  constructor(container: HTMLElement) {
    this.container = container
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x000000)

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    )
    this.camera.position.set(15, 12, 18)

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setClearColor(0x000000, 1)
    container.appendChild(this.renderer.domElement)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.target.set(0, 0, 0)
    this.controls.minDistance = 8
    this.controls.maxDistance = 50

    this.initLights()
    this.createStars()
    this.createGridHelper()
    this.createArrows()
    this.initParticles()
    this.setupEventListeners()
  }

  private initLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambientLight)

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight1.position.set(10, 20, 10)
    this.scene.add(directionalLight1)

    const directionalLight2 = new THREE.DirectionalLight(0x88ccff, 0.4)
    directionalLight2.position.set(-10, 5, -10)
    this.scene.add(directionalLight2)
  }

  private createStars(): void {
    const starCount = 500
    const positions = new Float32Array(starCount * 3)
    const sizes = new Float32Array(starCount)
    const opacities = new Float32Array(starCount)

    for (let i = 0; i < starCount; i++) {
      const radius = 50 + Math.random() * 30
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.cos(phi)
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta)

      sizes[i] = 1 + Math.random() * 2
      opacities[i] = 0.3 + Math.random() * 0.4
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1))

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.5,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: false
    })

    const stars = new THREE.Points(geometry, material)
    this.scene.add(stars)
  }

  private createGridHelper(): void {
    const gridHelper = new THREE.GridHelper(20, 20, 0x1a1a2e, 0x11111a)
    gridHelper.position.y = -10
    this.scene.add(gridHelper)

    const axesHelper = new THREE.AxesHelper(12)
    this.scene.add(axesHelper)
  }

  private createArrows(): void {
    const headGeometry = new THREE.ConeGeometry(0.3, 0.6, 8)
    headGeometry.translate(0, 0.3, 0)

    const headMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      flatShading: false
    })

    const trailGeometry = new THREE.PlaneGeometry(0.15, 1.5)
    trailGeometry.translate(0, -0.75, 0)

    const trailMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    })

    const positions: THREE.Vector3[] = []
    for (let x = -BOUNDARY; x <= BOUNDARY; x += GRID_STEP) {
      for (let y = -BOUNDARY; y <= BOUNDARY; y += GRID_STEP) {
        for (let z = -BOUNDARY; z <= BOUNDARY; z += GRID_STEP) {
          positions.push(new THREE.Vector3(x, y, z))
        }
      }
    }

    this.arrowCount = positions.length
    this.arrowHeads = new THREE.InstancedMesh(headGeometry, headMaterial, this.arrowCount)
    this.arrowTrails = new THREE.InstancedMesh(trailGeometry, trailMaterial, this.arrowCount)

    this.arrowData = positions.map((pos) => {
      const vec = getVector(pos, this.fieldType, this.fieldParams)
      const mag = vec.length()
      const normMag = Math.min(mag / 10, 1)
      const color = COLOR_LOW.clone().lerp(COLOR_HIGH, normMag)

      return {
        position: pos.clone(),
        targetScale: 0.5 + normMag * 1.5,
        currentScale: 0.5 + normMag * 1.5,
        targetColor: color.clone(),
        currentColor: color.clone(),
        direction: vec.normalize()
      }
    })

    for (let i = 0; i < this.arrowCount; i++) {
      this.updateArrowInstance(i)
    }

    this.scene.add(this.arrowHeads)
    this.scene.add(this.arrowTrails)
  }

  private updateArrowInstance(index: number): void {
    const data = this.arrowData[index]
    const pos = data.position
    const scale = data.currentScale
    const dir = data.direction

    const quaternion = new THREE.Quaternion()
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())

    this.dummy.position.copy(pos)
    this.dummy.quaternion.copy(quaternion)
    this.dummy.scale.setScalar(scale)
    this.dummy.updateMatrix()

    this.arrowHeads.setMatrixAt(index, this.dummy.matrix)
    this.arrowTrails.setMatrixAt(index, this.dummy.matrix)

    this.tmpColor.copy(data.currentColor)
    this.arrowHeads.setColorAt(index, this.tmpColor)
    this.arrowTrails.setColorAt(index, this.tmpColor)
  }

  private initParticles(): void {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const geometry = new THREE.SphereGeometry(0.2, 16, 16)
      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9
      })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.visible = false

      const trailGeometry = new THREE.BufferGeometry()
      const trailPositions = new Float32Array(100 * 3)
      const trailColors = new Float32Array(100 * 3)
      trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3))
      trailGeometry.setAttribute('color', new THREE.BufferAttribute(trailColors, 3))

      const trailMaterial = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 1,
        linewidth: 1
      })

      const trail = new THREE.Line(trailGeometry, trailMaterial)
      trail.visible = false

      this.particles.push({
        mesh,
        trail,
        trailGeometry,
        active: false,
        history: []
      })

      this.scene.add(mesh)
      this.scene.add(trail)
    }
  }

  private setupEventListeners(): void {
    const canvas = this.renderer.domElement

    canvas.addEventListener('mousedown', (e) => {
      this.isDragging = false
      this.downPos.set(e.clientX, e.clientY)
    })

    canvas.addEventListener('mousemove', (e) => {
      if (Math.abs(e.clientX - this.downPos.x) > 3 ||
          Math.abs(e.clientY - this.downPos.y) > 3) {
        this.isDragging = true
      }
    })

    canvas.addEventListener('mouseup', (e) => {
      if (!this.isDragging) {
        this.handleClick(e)
      }
    })

    canvas.addEventListener('touchstart', (e) => {
      this.isDragging = false
      if (e.touches.length === 1) {
        this.downPos.set(e.touches[0].clientX, e.touches[0].clientY)
      }
    })

    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        const dx = Math.abs(e.touches[0].clientX - this.downPos.x)
        const dy = Math.abs(e.touches[0].clientY - this.downPos.y)
        if (dx > 10 || dy > 10) {
          this.isDragging = true
        }
      }
    })

    canvas.addEventListener('touchend', (e) => {
      if (!this.isDragging && e.changedTouches.length === 1) {
        const touch = e.changedTouches[0]
        this.handleClick({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent)
      }
    })

    window.addEventListener('resize', this.handleResize)
  }

  private handleClick = (event: MouseEvent | { clientX: number; clientY: number }): void => {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, this.camera)

    const intersects = this.raycaster.intersectObject(this.arrowHeads)
    let spawnPos: THREE.Vector3

    if (intersects.length > 0) {
      spawnPos = intersects[0].point.clone()
    } else {
      const direction = new THREE.Vector3()
      this.raycaster.ray.direction.clone()
      const distance = this.camera.position.distanceTo(this.controls.target)
      spawnPos = this.raycaster.ray.origin.clone().add(
        this.raycaster.ray.direction.clone().multiplyScalar(distance)
      )
      spawnPos.clamp(
        new THREE.Vector3(-BOUNDARY, -BOUNDARY, -BOUNDARY),
        new THREE.Vector3(BOUNDARY, BOUNDARY, BOUNDARY)
      )
    }

    this.spawnParticle(spawnPos)
  }

  private spawnParticle(position: THREE.Vector3): void {
    const particle = this.particles.find(p => !p.active)
    if (!particle) return

    particle.active = true
    particle.mesh.visible = true
    particle.trail.visible = true
    particle.mesh.position.copy(position)
    particle.history = [{ position: position.clone(), time: this.currentTime }]
  }

  private updateParticles(dt: number, currentTime: number): void {
    for (const particle of this.particles) {
      if (!particle.active) continue

      const pos = particle.mesh.position
      const vec = getVector(pos, this.fieldType, this.fieldParams)
      const normalizedVec = vec.clone().normalize()

      pos.add(normalizedVec.multiplyScalar(PARTICLE_SPEED * dt))

      particle.history.push({ position: pos.clone(), time: currentTime })

      const cutoffTime = currentTime - TRAIL_DURATION
      particle.history = particle.history.filter(p => p.time >= cutoffTime)

      if (Math.abs(pos.x) > BOUNDARY + 2 ||
          Math.abs(pos.y) > BOUNDARY + 2 ||
          Math.abs(pos.z) > BOUNDARY + 2) {
        particle.active = false
        particle.mesh.visible = false
        particle.trail.visible = false
        continue
      }

      this.updateParticleTrail(particle, currentTime)
    }
  }

  private updateParticleTrail(particle: Particle, currentTime: number): void {
    const history = particle.history
    if (history.length < 2) return

    const positions = particle.trailGeometry.attributes.position.array as Float32Array
    const colors = particle.trailGeometry.attributes.color.array as Float32Array

    for (let i = 0; i < history.length; i++) {
      const idx = history.length - 1 - i
      const point = history[idx]

      positions[i * 3] = point.position.x
      positions[i * 3 + 1] = point.position.y
      positions[i * 3 + 2] = point.position.z

      const age = currentTime - point.time
      const alpha = Math.max(0, 1 - age / TRAIL_DURATION)

      const pos = particle.mesh.position
      const vec = getVector(pos, this.fieldType, this.fieldParams)
      const mag = vec.length()
      const normMag = Math.min(mag / 10, 1)
      const color = COLOR_LOW.clone().lerp(COLOR_HIGH, normMag)

      colors[i * 3] = color.r * alpha
      colors[i * 3 + 1] = color.g * alpha
      colors[i * 3 + 2] = color.b * alpha
    }

    particle.trailGeometry.setDrawRange(0, history.length)
    particle.trailGeometry.attributes.position.needsUpdate = true
    particle.trailGeometry.attributes.color.needsUpdate = true
  }

  private handleResize = (): void => {
    const width = this.container.clientWidth
    const height = this.container.clientHeight
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }

  private updateFieldArrows(): void {
    for (let i = 0; i < this.arrowCount; i++) {
      const data = this.arrowData[i]
      const vec = getVector(data.position, this.fieldType, this.fieldParams)
      const mag = vec.length()
      const normMag = Math.min(mag / 10, 1)

      data.direction.copy(vec.normalize())
      data.targetScale = 0.5 + normMag * 1.5
      data.targetColor.copy(COLOR_LOW).lerp(COLOR_HIGH, normMag)
    }
  }

  private updateArrowAnimations(dt: number): void {
    const lerpFactor = 1 - Math.exp(-dt / SCALE_TRANSITION_TIME)

    for (let i = 0; i < this.arrowCount; i++) {
      const data = this.arrowData[i]

      data.currentScale += (data.targetScale - data.currentScale) * lerpFactor
      data.currentColor.lerp(data.targetColor, lerpFactor)

      this.updateArrowInstance(i)
    }

    this.arrowHeads.instanceMatrix.needsUpdate = true
    this.arrowTrails.instanceMatrix.needsUpdate = true
    if (this.arrowHeads.instanceColor) {
      this.arrowHeads.instanceColor.needsUpdate = true
    }
    if (this.arrowTrails.instanceColor) {
      this.arrowTrails.instanceColor.needsUpdate = true
    }
  }

  private updateTrailBillboards(): void {
    const cameraDir = this.tmpVec
    this.camera.getWorldDirection(cameraDir)

    const up = this.tmpVec2
    const right = new THREE.Vector3()
    const targetUp = new THREE.Vector3()

    for (let i = 0; i < this.arrowCount; i++) {
      const data = this.arrowData[i]
      const pos = data.position
      const scale = data.currentScale

      const dir = data.direction.clone().normalize()
      const quat = this.tmpQuat
      quat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)

      up.set(0, 0, 1).applyQuaternion(quat)
      right.crossVectors(dir, cameraDir).normalize()
      targetUp.crossVectors(right, dir).normalize()

      const alignQuat = this.tmpQuat2
      alignQuat.setFromUnitVectors(up, targetUp)

      const finalQuat = quat.multiply(alignQuat)

      this.dummy.position.copy(pos)
      this.dummy.quaternion.copy(finalQuat)
      this.dummy.scale.setScalar(scale)
      this.dummy.updateMatrix()

      this.arrowTrails.setMatrixAt(i, this.dummy.matrix)
    }
    this.arrowTrails.instanceMatrix.needsUpdate = true
  }

  private animate = (time: number): void => {
    this.animationId = requestAnimationFrame(this.animate)

    const dt = Math.min((time - this.lastTime) / 1000, 0.1)
    this.lastTime = time
    this.currentTime = time / 1000

    this.fpsFrames++
    if (time - this.fpsLastUpdate >= 500) {
      this.fps = Math.round((this.fpsFrames * 1000) / (time - this.fpsLastUpdate))
      this.fpsFrames = 0
      this.fpsLastUpdate = time
      if (this.fpsCallback) {
        this.fpsCallback(this.fps)
      }
    }

    this.controls.update()
    this.updateArrowAnimations(dt)
    this.updateTrailBillboards()
    this.updateParticles(dt, time / 1000)

    this.renderer.render(this.scene, this.camera)
  }

  public startAnimation(): void {
    this.lastTime = performance.now()
    this.fpsLastUpdate = performance.now()
    this.fpsFrames = 0
    this.animationId = requestAnimationFrame(this.animate)
  }

  public stopAnimation(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  public updateField(type: FieldType, params: FieldParams): void {
    this.fieldType = type
    this.fieldParams = { ...params }
    this.updateFieldArrows()
  }

  public resetCamera(): void {
    this.camera.position.set(15, 12, 18)
    this.controls.target.set(0, 0, 0)
    this.controls.update()
  }

  public setFPSCallback(callback: (fps: number) => void): void {
    this.fpsCallback = callback
  }

  public dispose(): void {
    this.stopAnimation()
    window.removeEventListener('resize', this.handleResize)

    this.arrowHeads.geometry.dispose()
    ;(this.arrowHeads.material as THREE.Material).dispose()
    this.arrowTrails.geometry.dispose()
    ;(this.arrowTrails.material as THREE.Material).dispose()

    for (const particle of this.particles) {
      particle.mesh.geometry.dispose()
      ;(particle.mesh.material as THREE.Material).dispose()
      particle.trailGeometry.dispose()
      ;(particle.trail.material as THREE.Material).dispose()
    }

    this.renderer.dispose()
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement)
    }
  }
}
