import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  GeoDataSource,
  GRID_SIZE,
  PARTICLE_COUNT,
  TEMP_MIN,
  TEMP_MAX,
  ELEVATION_MIN,
  ELEVATION_MAX,
  TIME_STEPS,
  SensorPoint,
} from './GeoDataSource'
import { EventBus, WindLevel } from './EventBus'

const WIND_CALM_MAX = 1.0
const WIND_BREEZE_MAX = 3.5

export function temperatureToColor(t: number): THREE.Color {
  const ratio = Math.max(0, Math.min(1, (t - TEMP_MIN) / (TEMP_MAX - TEMP_MIN)))
  const hue = (1 - ratio) * (2 / 3)
  return new THREE.Color().setHSL(hue, 1, 0.5)
}

export class Scene3D {
  private container: HTMLElement
  private dataSource: GeoDataSource
  private eventBus: EventBus

  private renderer!: THREE.WebGLRenderer
  private scene!: THREE.Scene
  private camera!: THREE.PerspectiveCamera
  private controls!: OrbitControls

  private terrainMesh!: THREE.Mesh
  private terrainWireframe!: THREE.LineSegments
  private terrainColors!: Float32Array

  private particles!: THREE.Points
  private particlePositions!: Float32Array
  private particleColors!: Float32Array
  private particleBasePositions!: Float32Array
  private particleTrails!: THREE.LineSegments
  private trailPositions!: Float32Array

  private sensorMeshes: THREE.Mesh[] = []
  private sensorDataMap = new Map<THREE.Object3D, SensorPoint>()
  private sensorLabels: Map<THREE.Mesh, HTMLDivElement> = new Map()

  private raycaster = new THREE.Raycaster()
  private mouseNDC = new THREE.Vector2()
  private hoveredSensor: THREE.Mesh | null = null

  private timeIndex = 0
  private humidityRange: [number, number] = [0, 100]
  private windLevel: WindLevel = 'breeze'
  private humidityMask!: Uint8Array

  private rafId = 0
  private lastTime = 0
  private clock = new THREE.Clock()

  constructor(container: HTMLElement, dataSource: GeoDataSource, eventBus: EventBus) {
    this.container = container
    this.dataSource = dataSource
    this.eventBus = eventBus
    this.humidityMask = new Uint8Array(GRID_SIZE * GRID_SIZE).fill(1)
    this.init()
  }

  private init(): void {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.renderer.setClearColor(0x0d1117, 1)
    this.container.appendChild(this.renderer.domElement)

    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.Fog(0x0d1117, 120, 250)

    this.camera = new THREE.PerspectiveCamera(
      60,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000,
    )
    this.camera.position.set(80, 60, 80)
    this.camera.lookAt(0, 0, 0)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.enablePan = false
    this.controls.minPolarAngle = 0.1
    this.controls.maxPolarAngle = Math.PI / 2 - 0.1
    this.controls.minDistance = 30
    this.controls.maxDistance = 200
    this.controls.target.set(0, 0, 0)

    const ambient = new THREE.AmbientLight(0xffffff, 0.4)
    this.scene.add(ambient)
    const dir = new THREE.DirectionalLight(0xffffff, 0.8)
    dir.position.set(50, 70, 30)
    this.scene.add(dir)

    this.buildTerrain()
    this.buildParticles()
    this.buildSensors()
    this.updateTerrainColors()
    this.updateParticleColors()

    window.addEventListener('resize', this.onResize)
    this.renderer.domElement.addEventListener('pointermove', this.onPointerMove)
    this.renderer.domElement.addEventListener('click', this.onClick)

    this.eventBus.on('time:change', (idx) => this.setTimeIndex(idx))
    this.eventBus.on('filter:change', ({ humidityRange, windLevel }) =>
      this.setFilter(humidityRange, windLevel),
    )
    this.eventBus.on('camera:reset', () => this.resetCamera())
    this.eventBus.on('screenshot:export', () => this.exportScreenshot())

    this.animate()
    this.eventBus.emit('scene:ready', undefined)
  }

  private buildTerrain(): void {
    const geo = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE, GRID_SIZE - 1, GRID_SIZE - 1)
    geo.rotateX(-Math.PI / 2)
    const pos = geo.attributes.position as THREE.BufferAttribute
    const vertexCount = pos.count
    this.terrainColors = new Float32Array(vertexCount * 3)
    for (let i = 0; i < vertexCount; i++) {
      const ix = i % GRID_SIZE
      const iz = Math.floor(i / GRID_SIZE)
      const cell = this.dataSource.grid[iz][ix]
      const y = cell.elevation
      pos.setY(i, y)
    }
    pos.needsUpdate = true
    geo.computeVertexNormals()
    geo.setAttribute('color', new THREE.BufferAttribute(this.terrainColors, 3))

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      flatShading: false,
      roughness: 0.85,
      metalness: 0.05,
    })
    this.terrainMesh = new THREE.Mesh(geo, mat)
    this.terrainMesh.position.set(-GRID_SIZE / 2, 0, -GRID_SIZE / 2)
    this.scene.add(this.terrainMesh)

    const wireGeo = new THREE.WireframeGeometry(geo)
    const wireMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 })
    this.terrainWireframe = new THREE.LineSegments(wireGeo, wireMat)
    this.terrainWireframe.position.copy(this.terrainMesh.position)
    this.scene.add(this.terrainWireframe)
  }

  private updateTerrainColors(): void {
    const pos = this.terrainMesh.geometry.attributes.position as THREE.BufferAttribute
    const colors = this.terrainMesh.geometry.attributes.color as THREE.BufferAttribute
    const color = new THREE.Color()
    for (let i = 0; i < pos.count; i++) {
      const ix = i % GRID_SIZE
      const iz = Math.floor(i / GRID_SIZE)
      const cell = this.dataSource.grid[iz][ix]
      const inRange =
        cell.humidity[this.timeIndex] >= this.humidityRange[0] &&
        cell.humidity[this.timeIndex] <= this.humidityRange[1]
      this.humidityMask[iz * GRID_SIZE + ix] = inRange ? 1 : 0
      if (inRange) {
        temperatureToColor(cell.temperature[this.timeIndex]).toArray(this.terrainColors, i * 3)
      } else {
        color.setRGB(0.15, 0.17, 0.2).toArray(this.terrainColors, i * 3)
      }
    }
    colors.needsUpdate = true
    this.terrainMesh.geometry.computeVertexNormals()
  }

  private buildParticles(): void {
    const geo = new THREE.BufferGeometry()
    this.particlePositions = new Float32Array(PARTICLE_COUNT * 3)
    this.particleBasePositions = new Float32Array(PARTICLE_COUNT * 3)
    this.particleColors = new Float32Array(PARTICLE_COUNT * 3)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const x = Math.random() * GRID_SIZE
      const z = Math.random() * GRID_SIZE
      const gx = Math.min(GRID_SIZE - 1, Math.floor(x))
      const gz = Math.min(GRID_SIZE - 1, Math.floor(z))
      const y = this.dataSource.grid[gz][gx].elevation + 0.5 + Math.random() * 6
      const wx = x - GRID_SIZE / 2
      const wz = z - GRID_SIZE / 2
      this.particlePositions[i * 3] = wx
      this.particlePositions[i * 3 + 1] = y
      this.particlePositions[i * 3 + 2] = wz
      this.particleBasePositions[i * 3] = wx
      this.particleBasePositions[i * 3 + 1] = y
      this.particleBasePositions[i * 3 + 2] = wz
    }
    geo.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(this.particleColors, 3))

    const mat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    this.particles = new THREE.Points(geo, mat)
    this.scene.add(this.particles)

    const trailGeo = new THREE.BufferGeometry()
    this.trailPositions = new Float32Array(PARTICLE_COUNT * 2 * 3)
    trailGeo.setAttribute('position', new THREE.BufferAttribute(this.trailPositions, 3))
    const trailMat = new THREE.LineBasicMaterial({
      vertexColors: false,
      color: 0x88ccff,
      transparent: true,
      opacity: 0.35,
    })
    this.particleTrails = new THREE.LineSegments(trailGeo, trailMat)
    this.scene.add(this.particleTrails)
  }

  private updateParticleColors(): void {
    const color = new THREE.Color()
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const baseX = this.particleBasePositions[i * 3]
      const baseZ = this.particleBasePositions[i * 3 + 2]
      const gx = Math.min(GRID_SIZE - 1, Math.max(0, Math.floor(baseX + GRID_SIZE / 2)))
      const gz = Math.min(GRID_SIZE - 1, Math.max(0, Math.floor(baseZ + GRID_SIZE / 2)))
      const cell = this.dataSource.grid[gz][gx]
      temperatureToColor(cell.temperature[this.timeIndex]).toArray(this.particleColors, i * 3)
    }
    ;(this.particles.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true
  }

  private buildSensors(): void {
    const sphereGeo = new THREE.SphereGeometry(0.3, 16, 16)
    const yellow = new THREE.MeshStandardMaterial({
      color: 0xffdd00,
      emissive: 0xffaa00,
      emissiveIntensity: 0.4,
      roughness: 0.4,
    })
    const yellowHover = new THREE.MeshStandardMaterial({
      color: 0xffff44,
      emissive: 0xffcc00,
      emissiveIntensity: 0.8,
      roughness: 0.3,
    })
    for (const sp of this.dataSource.sensors) {
      const mesh = new THREE.Mesh(sphereGeo, yellow)
      mesh.userData.baseMaterial = yellow
      mesh.userData.hoverMaterial = yellowHover
      const cell = this.dataSource.grid[sp.gridZ][sp.gridX]
      mesh.position.set(sp.gridX - GRID_SIZE / 2, cell.elevation + 1.2, sp.gridZ - GRID_SIZE / 2)
      this.scene.add(mesh)
      this.sensorMeshes.push(mesh)
      this.sensorDataMap.set(mesh, sp)
    }
  }

  private createLabel(mesh: THREE.Mesh, text: string): HTMLDivElement {
    const label = document.createElement('div')
    label.textContent = text
    label.style.position = 'absolute'
    label.style.pointerEvents = 'none'
    label.style.color = '#E6EDF3'
    label.style.background = 'rgba(22, 27, 34, 0.9)'
    label.style.border = '1px solid #30363D'
    label.style.borderRadius = '6px'
    label.style.padding = '3px 8px'
    label.style.fontSize = '12px'
    label.style.fontFamily = 'monospace'
    label.style.transform = 'translate(-50%, -130%)'
    label.style.whiteSpace = 'nowrap'
    label.style.zIndex = '10'
    this.container.appendChild(label)
    this.sensorLabels.set(mesh, label)
    return label
  }

  private positionLabel(mesh: THREE.Mesh): void {
    const label = this.sensorLabels.get(mesh)
    if (!label) return
    const pos = mesh.position.clone()
    pos.project(this.camera)
    const rect = this.container.getBoundingClientRect()
    const x = (pos.x * 0.5 + 0.5) * rect.width
    const y = (-pos.y * 0.5 + 0.5) * rect.height
    label.style.left = `${x}px`
    label.style.top = `${y}px`
  }

  private removeLabel(mesh: THREE.Mesh): void {
    const label = this.sensorLabels.get(mesh)
    if (label) {
      this.container.removeChild(label)
      this.sensorLabels.delete(mesh)
    }
  }

  private onResize = (): void => {
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
  }

  private onPointerMove = (e: PointerEvent): void => {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    this.raycaster.setFromCamera(this.mouseNDC, this.camera)
    const hits = this.raycaster.intersectObjects(this.sensorMeshes, false)
    if (hits.length > 0) {
      const mesh = hits[0].object as THREE.Mesh
      if (this.hoveredSensor !== mesh) {
        if (this.hoveredSensor) {
          this.hoveredSensor.scale.set(1, 1, 1)
          this.hoveredSensor.material = this.hoveredSensor.userData.baseMaterial
          this.removeLabel(this.hoveredSensor)
          const prevData = this.sensorDataMap.get(this.hoveredSensor)
          if (prevData) this.eventBus.emit('sensor:hover', { point: prevData, hovering: false })
        }
        this.hoveredSensor = mesh
        mesh.scale.set(0.5 / 0.3, 0.5 / 0.3, 0.5 / 0.3)
        mesh.material = mesh.userData.hoverMaterial
        const data = this.sensorDataMap.get(mesh)!
        const label = this.createLabel(mesh, `${data.temperature[this.timeIndex].toFixed(1)}°C`)
        label.style.display = 'block'
        this.eventBus.emit('sensor:hover', { point: data, hovering: true })
      }
    } else if (this.hoveredSensor) {
      this.hoveredSensor.scale.set(1, 1, 1)
      this.hoveredSensor.material = this.hoveredSensor.userData.baseMaterial
      const prevData = this.sensorDataMap.get(this.hoveredSensor)
      this.removeLabel(this.hoveredSensor)
      if (prevData) this.eventBus.emit('sensor:hover', { point: prevData, hovering: false })
      this.hoveredSensor = null
    }
  }

  private onClick = (): void => {
    if (this.hoveredSensor) {
      const data = this.sensorDataMap.get(this.hoveredSensor)
      if (data) this.eventBus.emit('sensor:click', data)
    }
  }

  setTimeIndex(idx: number): void {
    const t0 = performance.now()
    this.timeIndex = Math.max(0, Math.min(TIME_STEPS - 1, idx))
    this.updateTerrainColors()
    this.updateParticleColors()
    this.sensorLabels.forEach((label, mesh) => {
      const data = this.sensorDataMap.get(mesh)
      if (data) label.textContent = `${data.temperature[this.timeIndex].toFixed(1)}°C`
    })
    const dt = performance.now() - t0
    if (dt > 50) console.warn(`[Scene3D] setTimeIndex took ${dt.toFixed(1)}ms`)
  }

  setFilter(humidityRange: [number, number], windLevel: WindLevel): void {
    this.humidityRange = humidityRange
    this.windLevel = windLevel
    this.updateTerrainColors()
  }

  resetCamera(): void {
    this.camera.position.set(80, 60, 80)
    this.controls.target.set(0, 0, 0)
    this.controls.update()
  }

  exportScreenshot(): string {
    this.renderer.render(this.scene, this.camera)
    return this.renderer.domElement.toDataURL('image/png')
  }

  private windSpeedAllowed(speed: number): boolean {
    if (this.windLevel === 'calm') return speed <= WIND_CALM_MAX
    if (this.windLevel === 'breeze') return speed > WIND_CALM_MAX && speed <= WIND_BREEZE_MAX
    return speed > WIND_BREEZE_MAX
  }

  private animate = (): void => {
    this.rafId = requestAnimationFrame(this.animate)
    const delta = Math.min(this.clock.getDelta(), 0.05)
    this.controls.update()
    this.updateParticles(delta)
    if (this.hoveredSensor) this.positionLabel(this.hoveredSensor)
    this.renderer.render(this.scene, this.camera)
  }

  private updateParticles(delta: number): void {
    const positions = this.particlePositions
    const base = this.particleBasePositions
    const trailLimit = 3.0
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3
      const bx = base[idx]
      const by = base[idx + 1]
      const bz = base[idx + 2]
      const cx = positions[idx]
      let cy = positions[idx + 1]
      const cz = positions[idx + 2]
      if (cy < -900) cy = by
      const gx = Math.min(GRID_SIZE - 1, Math.max(0, Math.floor((cx + bx) / 2 + GRID_SIZE / 2)))
      const gz = Math.min(GRID_SIZE - 1, Math.max(0, Math.floor((cz + bz) / 2 + GRID_SIZE / 2)))
      const cell = this.dataSource.grid[gz][gx]
      const u = cell.windU[this.timeIndex]
      const v = cell.windV[this.timeIndex]
      const speed = Math.sqrt(u * u + v * v)
      let nx = cx + u * delta * 0.8
      let nz = cz + v * delta * 0.8
      const dx = nx - bx
      const dz = nz - bz
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist > trailLimit) {
        const scale = trailLimit / dist
        nx = bx + dx * scale
        nz = bz + dz * scale
      }
      if (nx < -GRID_SIZE / 2) nx = GRID_SIZE / 2 - 0.01
      if (nx > GRID_SIZE / 2) nx = -GRID_SIZE / 2 + 0.01
      if (nz < -GRID_SIZE / 2) nz = GRID_SIZE / 2 - 0.01
      if (nz > GRID_SIZE / 2) nz = -GRID_SIZE / 2 + 0.01
      const visible = this.windSpeedAllowed(speed)
      if (visible) {
        positions[idx] = nx
        positions[idx + 1] = by
        positions[idx + 2] = nz
        this.trailPositions[i * 6] = bx
        this.trailPositions[i * 6 + 1] = by
        this.trailPositions[i * 6 + 2] = bz
        this.trailPositions[i * 6 + 3] = nx
        this.trailPositions[i * 6 + 4] = by
        this.trailPositions[i * 6 + 5] = nz
      } else {
        positions[idx] = bx
        positions[idx + 1] = by - 1000
        positions[idx + 2] = bz
        this.trailPositions[i * 6] = bx
        this.trailPositions[i * 6 + 1] = by - 1000
        this.trailPositions[i * 6 + 2] = bz
        this.trailPositions[i * 6 + 3] = bx
        this.trailPositions[i * 6 + 4] = by - 1000
        this.trailPositions[i * 6 + 5] = bz
      }
      temperatureToColor(cell.temperature[this.timeIndex]).toArray(this.particleColors, idx)
    }
    ;(this.particles.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true
    ;(this.particles.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true
    ;(this.particleTrails.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true
  }

  dispose(): void {
    cancelAnimationFrame(this.rafId)
    window.removeEventListener('resize', this.onResize)
    this.renderer.domElement.removeEventListener('pointermove', this.onPointerMove)
    this.renderer.domElement.removeEventListener('click', this.onClick)
    this.eventBus.clear()
    this.sensorLabels.forEach((l) => this.container.removeChild(l))
    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (mesh.geometry) mesh.geometry.dispose()
      const mat = mesh.material as THREE.Material | THREE.Material[]
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
      else if (mat) mat.dispose()
    })
    this.renderer.dispose()
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement)
    }
  }
}
