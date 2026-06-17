import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { BuildingGenerator, BuildingData } from './BuildingGenerator'
import { LightSystem } from './LightSystem'
import { EventBus, WeatherType } from '../core/EventBus'

interface BuildingMesh {
  mesh: THREE.Mesh
  roofMesh: THREE.Mesh
  targetHeight: number
  currentHeight: number
  startHeight: number
  animationTime: number
  animationDuration: number
  isAnimating: boolean
  baseColor: THREE.Color
  roofSize: number
}

interface ParticleSystem {
  mesh: THREE.Points
  velocities: Float32Array
  active: boolean
}

export class SceneManager {
  private container: HTMLElement
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private controls: OrbitControls
  private buildingGenerator: BuildingGenerator
  private lightSystem: LightSystem

  private buildingMeshes: BuildingMesh[] = []
  private ground: THREE.Mesh

  private cloudParticles: ParticleSystem | null = null
  private rainParticles: ParticleSystem | null = null
  private duskFog: THREE.Mesh | null = null

  private currentDensity: number = 50
  private currentWeather: WeatherType = 'sunny'

  private clock: THREE.Clock
  private frameCount: number = 0
  private fpsTime: number = 0
  private currentFps: number = 60

  private animationId: number | null = null

  private weatherTransition: {
    active: boolean
    fromWeather: WeatherType
    toWeather: WeatherType
    progress: number
    duration: number
  } = { active: false, fromWeather: 'sunny', toWeather: 'sunny', progress: 1, duration: 1 }

  constructor(container: HTMLElement) {
    this.container = container
    this.clock = new THREE.Clock()

    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.002)

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      500
    )
    this.camera.position.set(80, 60, 80)
    this.camera.lookAt(0, 0, 0)

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.0
    container.appendChild(this.renderer.domElement)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.minDistance = 30
    this.controls.maxDistance = 200
    this.controls.maxPolarAngle = Math.PI / 2.2
    this.controls.target.set(0, 10, 0)

    this.lightSystem = new LightSystem(this.scene)
    this.buildingGenerator = new BuildingGenerator()

    this.createGround()
    this.createBuildings(this.currentDensity)
    this.createParticleSystems()

    this.setupEventListeners()
    this.handleResize = this.handleResize.bind(this)
    window.addEventListener('resize', this.handleResize)

    this.startAnimationLoop()
  }

  private createGround(): void {
    const groundGeometry = new THREE.PlaneGeometry(120, 120, 1, 1)
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.9,
      metalness: 0.1
    })
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial)
    this.ground.rotation.x = -Math.PI / 2
    this.ground.receiveShadow = true
    this.scene.add(this.ground)

    const gridHelper = new THREE.GridHelper(100, 50, 0x2d3748, 0x1a202c)
    gridHelper.position.y = 0.01
    this.scene.add(gridHelper)
  }

  private createBuildings(density: number): void {
    this.clearBuildings()

    const buildingData = this.buildingGenerator.generate(density)

    for (const data of buildingData) {
      const buildingMesh = this.createBuilding(data)
      this.buildingMeshes.push(buildingMesh)
    }
  }

  private createBuilding(data: BuildingData): BuildingMesh {
    const geometry = new THREE.BoxGeometry(data.width, data.height, data.depth)
    const material = new THREE.MeshStandardMaterial({
      color: data.color,
      roughness: 0.7,
      metalness: 0.3
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.copy(data.position)
    mesh.castShadow = true
    mesh.receiveShadow = true
    this.scene.add(mesh)

    const roofGeometry = new THREE.BoxGeometry(data.roofSize, data.roofSize * 0.6, data.roofSize)
    const roofMaterial = new THREE.MeshStandardMaterial({
      color: data.color.clone().multiplyScalar(0.8),
      roughness: 0.6,
      metalness: 0.4
    })
    const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial)
    roofMesh.position.set(
      data.position.x,
      data.height + data.roofSize * 0.3,
      data.position.z
    )
    roofMesh.rotation.y = data.roofRotation
    roofMesh.castShadow = true
    this.scene.add(roofMesh)

    return {
      mesh,
      roofMesh,
      targetHeight: data.height,
      currentHeight: data.height,
      startHeight: data.height,
      animationTime: 0,
      animationDuration: 0.5,
      isAnimating: false,
      baseColor: data.color.clone(),
      roofSize: data.roofSize
    }
  }

  private clearBuildings(): void {
    for (const building of this.buildingMeshes) {
      this.scene.remove(building.mesh)
      this.scene.remove(building.roofMesh)
      building.mesh.geometry.dispose()
      ;(building.mesh.material as THREE.Material).dispose()
      building.roofMesh.geometry.dispose()
      ;(building.roofMesh.material as THREE.Material).dispose()
    }
    this.buildingMeshes = []
  }

  private createParticleSystems(): void {
    this.createCloudParticles()
    this.createRainParticles()
    this.createDuskFog()
    this.updateParticleVisibility()
  }

  private createCloudParticles(): void {
    const particleCount = 200
    const positions = new Float32Array(particleCount * 3)
    const velocities = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 120
      positions[i * 3 + 1] = 40 + Math.random() * 60
      positions[i * 3 + 2] = (Math.random() - 0.5) * 120

      velocities[i * 3] = (Math.random() - 0.5) * 0.5
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.1
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.5
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2.5,
      transparent: true,
      opacity: 0.3,
      sizeAttenuation: true
    })

    const points = new THREE.Points(geometry, material)
    points.visible = false
    this.scene.add(points)

    this.cloudParticles = { mesh: points, velocities, active: false }
  }

  private createRainParticles(): void {
    const particleCount = 1500
    const positions = new Float32Array(particleCount * 3)
    const velocities = new Float32Array(particleCount)

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 120
      positions[i * 3 + 1] = Math.random() * 120
      positions[i * 3 + 2] = (Math.random() - 0.5) * 120
      velocities[i] = 2 + Math.random() * 3
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const material = new THREE.PointsMaterial({
      color: 0x64b5f6,
      size: 0.8,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true
    })

    const points = new THREE.Points(geometry, material)
    points.visible = false
    this.scene.add(points)

    this.rainParticles = { mesh: points, velocities: velocities as unknown as Float32Array, active: false }
  }

  private createDuskFog(): void {
    const geometry = new THREE.PlaneGeometry(150, 80)
    const material = new THREE.MeshBasicMaterial({
      color: 0xff6b35,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    })
    const fogPlane = new THREE.Mesh(geometry, material)
    fogPlane.position.set(0, 40, -60)
    fogPlane.visible = false
    this.scene.add(fogPlane)

    this.duskFog = fogPlane
  }

  private updateParticleVisibility(): void {
    if (this.cloudParticles) {
      const targetOpacity = this.currentWeather === 'cloudy' ? 0.3 : 0
      this.cloudParticles.mesh.visible = this.currentWeather === 'cloudy'
      ;(this.cloudParticles.mesh.material as THREE.PointsMaterial).opacity = targetOpacity
      this.cloudParticles.active = this.currentWeather === 'cloudy'
    }

    if (this.rainParticles) {
      this.rainParticles.mesh.visible = this.currentWeather === 'rain'
      this.rainParticles.active = this.currentWeather === 'rain'
    }

    if (this.duskFog) {
      this.duskFog.visible = this.currentWeather === 'dusk'
      ;(this.duskFog.material as THREE.MeshBasicMaterial).opacity = this.currentWeather === 'dusk' ? 0.15 : 0
    }
  }

  private setupEventListeners(): void {
    EventBus.on('WEATHER_CHANGE', (data) => {
      this.setWeather(data.weather)
    })

    EventBus.on('DENSITY_CHANGE', (data) => {
      this.setDensity(data.density)
    })
  }

  setWeather(weather: WeatherType): void {
    if (weather === this.currentWeather) return

    this.weatherTransition = {
      active: true,
      fromWeather: this.currentWeather,
      toWeather: weather,
      progress: 0,
      duration: 1
    }

    this.currentWeather = weather
    this.lightSystem.setWeather(weather)
  }

  setDensity(density: number): void {
    this.currentDensity = density

    const newBuildingData = this.buildingGenerator.generate(density)

    if (newBuildingData.length > this.buildingMeshes.length) {
      const additionalCount = newBuildingData.length - this.buildingMeshes.length
      for (let i = 0; i < additionalCount; i++) {
        const newData = newBuildingData[this.buildingMeshes.length + i]
        const buildingMesh = this.createBuilding({
          ...newData,
          height: 10
        })
        buildingMesh.currentHeight = 10
        buildingMesh.targetHeight = newData.height
        buildingMesh.startHeight = 10
        buildingMesh.animationTime = 0
        buildingMesh.isAnimating = true
        this.buildingMeshes.push(buildingMesh)
      }
    }

    const minLength = Math.min(this.buildingMeshes.length, newBuildingData.length)

    for (let i = 0; i < minLength; i++) {
      const building = this.buildingMeshes[i]
      const newData = newBuildingData[i]

      building.startHeight = building.currentHeight
      building.targetHeight = newData.height
      building.animationTime = 0
      building.isAnimating = true
      building.baseColor.copy(newData.color)

      building.mesh.position.x = newData.position.x
      building.mesh.position.z = newData.position.z
      building.roofMesh.position.x = newData.position.x
      building.roofMesh.position.z = newData.position.z
      building.roofMesh.rotation.y = newData.roofRotation
    }

    if (this.buildingMeshes.length > newBuildingData.length) {
      const toRemove = this.buildingMeshes.slice(newBuildingData.length)
      for (const building of toRemove) {
        building.startHeight = building.currentHeight
        building.targetHeight = 0
        building.animationTime = 0
        building.isAnimating = true
      }
    }
  }

  private updateBuildings(deltaTime: number): void {
    const toRemove: number[] = []

    for (let i = 0; i < this.buildingMeshes.length; i++) {
      const building = this.buildingMeshes[i]

      if (building.isAnimating) {
        building.animationTime += deltaTime

        if (building.animationTime >= building.animationDuration) {
          building.animationTime = building.animationDuration
          building.isAnimating = false
          building.currentHeight = building.targetHeight
        } else {
          const t = building.animationTime / building.animationDuration
          const elasticT = this.elasticOut(t)
          building.currentHeight = building.startHeight + (building.targetHeight - building.startHeight) * elasticT
        }

        this.updateBuildingGeometry(building)

        if (building.targetHeight <= 0 && !building.isAnimating) {
          toRemove.push(i)
        }
      }

      const material = building.mesh.material as THREE.MeshStandardMaterial
      material.color.copy(building.baseColor)
    }

    for (let i = toRemove.length - 1; i >= 0; i--) {
      const idx = toRemove[i]
      const building = this.buildingMeshes[idx]
      this.scene.remove(building.mesh)
      this.scene.remove(building.roofMesh)
      building.mesh.geometry.dispose()
      ;(building.mesh.material as THREE.Material).dispose()
      building.roofMesh.geometry.dispose()
      ;(building.roofMesh.material as THREE.Material).dispose()
      this.buildingMeshes.splice(idx, 1)
    }
  }

  private updateBuildingGeometry(building: BuildingMesh): void {
    const height = Math.max(0.1, building.currentHeight)

    const oldGeom = building.mesh.geometry
    const pos = building.mesh.position.clone()
    const width = oldGeom.parameters.width
    const depth = oldGeom.parameters.depth

    const newGeom = new THREE.BoxGeometry(width, height, depth)
    building.mesh.geometry = newGeom
    building.mesh.position.y = height / 2

    oldGeom.dispose()

    building.roofMesh.position.y = height + building.roofSize * 0.3
  }

  private elasticOut(t: number): number {
    const p = 0.3
    return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1
  }

  private updateParticles(deltaTime: number): void {
    if (this.cloudParticles && this.cloudParticles.active) {
      const positions = this.cloudParticles.mesh.geometry.attributes.position.array as Float32Array
      const velocities = this.cloudParticles.velocities

      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3] += velocities[i * 3] * deltaTime * 10
        positions[i * 3 + 1] += velocities[i * 3 + 1] * deltaTime * 10
        positions[i * 3 + 2] += velocities[i * 3 + 2] * deltaTime * 10

        if (positions[i * 3] > 60) positions[i * 3] = -60
        if (positions[i * 3] < -60) positions[i * 3] = 60
        if (positions[i * 3 + 2] > 60) positions[i * 3 + 2] = -60
        if (positions[i * 3 + 2] < -60) positions[i * 3 + 2] = 60
      }

      this.cloudParticles.mesh.geometry.attributes.position.needsUpdate = true
    }

    if (this.rainParticles && this.rainParticles.active) {
      const positions = this.rainParticles.mesh.geometry.attributes.position.array as Float32Array
      const velocities = this.rainParticles.velocities

      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3 + 1] -= velocities[i] * deltaTime * 30

        if (positions[i * 3 + 1] < 0) {
          positions[i * 3 + 1] = 120
          positions[i * 3] = (Math.random() - 0.5) * 120
          positions[i * 3 + 2] = (Math.random() - 0.5) * 120
        }
      }

      this.rainParticles.mesh.geometry.attributes.position.needsUpdate = true
    }

    if (this.duskFog && this.duskFog.visible) {
      const material = this.duskFog.material as THREE.MeshBasicMaterial
      const pulse = 0.1 + Math.sin(this.clock.elapsedTime * 0.5) * 0.05
      material.opacity = pulse
    }
  }

  private updateWeatherTransition(deltaTime: number): void {
    if (!this.weatherTransition.active) return

    this.weatherTransition.progress += deltaTime / this.weatherTransition.duration

    if (this.weatherTransition.progress >= 1) {
      this.weatherTransition.progress = 1
      this.weatherTransition.active = false
      this.updateParticleVisibility()
    }
  }

  private startAnimationLoop(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate)

      const deltaTime = Math.min(this.clock.getDelta(), 0.1)

      this.controls.update()
      this.lightSystem.update(deltaTime)
      this.updateBuildings(deltaTime)
      this.updateParticles(deltaTime)
      this.updateWeatherTransition(deltaTime)
      this.updateFps(deltaTime)

      this.renderer.render(this.scene, this.camera)
    }

    animate()
  }

  private updateFps(deltaTime: number): void {
    this.frameCount++
    this.fpsTime += deltaTime

    if (this.fpsTime >= 0.5) {
      this.currentFps = Math.round(this.frameCount / this.fpsTime)
      this.frameCount = 0
      this.fpsTime = 0

      EventBus.emit('FPS_UPDATE', { fps: this.currentFps })
    }
  }

  private handleResize(): void {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
  }

  getFps(): number {
    return this.currentFps
  }

  dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
    }

    window.removeEventListener('resize', this.handleResize)
    this.controls.dispose()
    this.clearBuildings()

    this.renderer.dispose()
    this.container.removeChild(this.renderer.domElement)
  }
}
