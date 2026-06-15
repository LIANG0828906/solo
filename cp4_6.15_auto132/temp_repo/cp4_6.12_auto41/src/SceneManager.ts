import * as THREE from 'three'
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'

class PerlinNoise {
  private permutation: number[] = []
  constructor(seed: number = Math.random() * 10000) {
    const p: number[] = []
    for (let i = 0; i < 256; i++) p[i] = i
    for (let i = 255; i > 0; i--) {
      const j = Math.floor((seed % 1) * (i + 1))
      ;[p[i], p[j]] = [p[j], p[i]]
    }
    this.permutation = [...p, ...p]
  }
  private fade(t: number): number { return t * t * t * (t * (t * 6 - 15) + 10) }
  private lerp(a: number, b: number, t: number): number { return a + t * (b - a) }
  private grad(hash: number, x: number, y: number): number {
    const h = hash & 3
    const u = h < 2 ? x : y
    const v = h < 2 ? y : x
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v)
  }
  noise(x: number, y: number): number {
    const X = Math.floor(x) & 255
    const Y = Math.floor(y) & 255
    x -= Math.floor(x)
    y -= Math.floor(y)
    const u = this.fade(x)
    const v = this.fade(y)
    const A = this.permutation[X] + Y
    const B = this.permutation[X + 1] + Y
    return this.lerp(
      this.lerp(this.grad(this.permutation[A], x, y), this.grad(this.permutation[B], x - 1, y), u),
      this.lerp(this.grad(this.permutation[A + 1], x, y - 1), this.grad(this.permutation[B + 1], x - 1, y - 1), u),
      v
    )
  }
}

interface CoralData {
  group: THREE.Group
  targetScale: number
  animationProgress: number
}

interface FishData {
  mesh: THREE.Group
  center: THREE.Vector3
  angle: number
  speed: number
  baseRadius: number
  depthFactor: number
}

interface ParticleData {
  position: THREE.Vector3
  velocity: THREE.Vector3
  life: number
  maxLife: number
  size: number
  color: THREE.Color
}

interface BiomeParticleSystem {
  points: THREE.Points
  particles: ParticleData[]
  maxParticles: number
  spawnRate: number
  spawnTimer: number
  particleLife: number
  sizeRange: [number, number]
  colorRange: THREE.Color[]
}

interface LightStats {
  intensity: number
  angle: number
  visibility: number
}

interface PerformanceStats {
  fps: number
  particles: number
  triangles: number
}

export class SceneManager {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer

  terrain!: THREE.Mesh
  coralDatas: CoralData[] = []
  fishDatas: FishData[] = []
  sunSphere!: THREE.Mesh
  lightCone!: THREE.Mesh

  currentBiome: THREE.Group | null = null
  biomeFish: FishData[] = []
  particleSystems: BiomeParticleSystem[] = []
  burstParticles: BiomeParticleSystem | null = null

  sunY: number = 100
  private isDraggingSun: boolean = false
  private lightStats: LightStats = { intensity: 0, angle: 0, visibility: 0 }
  private performanceStats: PerformanceStats = { fps: 60, particles: 0, triangles: 0 }

  private lookAt: THREE.Vector3 = new THREE.Vector3(0, 50, 0)
  private cameraDistance: number = 150
  private theta: number = Math.PI / 4
  private phi: number = Math.PI / 4
  private isRotating: boolean = false
  private isPanning: boolean = false
  private lastMouseX: number = 0
  private lastMouseY: number = 0

  private eventTarget: EventTarget = new EventTarget()
  private noise: PerlinNoise = new PerlinNoise(42)
  private raycaster: THREE.Raycaster = new THREE.Raycaster()
  private mouse: THREE.Vector2 = new THREE.Vector2()

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
    this.scene = scene
    this.camera = camera
    this.renderer = renderer
  }

  init() {
    this.setupSceneBackground()
    this.setupLighting()
    this.createTerrain()
    this.createCorals()
    this.createFishSchool()
    this.createSunAndLight()
    this.setupCameraControls()
    this.setupSunDrag()
    this.updateLightStats()
    this.updateTriangleCount()
  }

  private setupSceneBackground() {
    const canvas = document.createElement('canvas')
    canvas.width = 2
    canvas.height = 256
    const ctx = canvas.getContext('2d')!
    const gradient = ctx.createLinearGradient(0, 0, 0, 256)
    gradient.addColorStop(0, '#0099ff')
    gradient.addColorStop(1, '#000033')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 2, 256)
    const texture = new THREE.CanvasTexture(canvas)
    this.scene.background = texture
    this.scene.fog = new THREE.FogExp2(0x000033, 0.0015)
  }

  private setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x404060, 0.5)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(50, 150, 50)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 500
    directionalLight.shadow.camera.left = -250
    directionalLight.shadow.camera.right = 250
    directionalLight.shadow.camera.top = 250
    directionalLight.shadow.camera.bottom = -250
    this.scene.add(directionalLight)

    const pointLight = new THREE.PointLight(0x44aaff, 0.5, 300)
    pointLight.position.set(0, 100, 0)
    this.scene.add(pointLight)
  }

  private createTerrain() {
    const width = 400
    const depth = 400
    const segments = 64
    const geometry = new THREE.PlaneGeometry(width, depth, segments, segments)
    geometry.rotateX(-Math.PI / 2)

    const positions = geometry.attributes.position
    const colors = new Float32Array(positions.count * 3)
    const sandColor = new THREE.Color(0xf4d03f)
    const rockColor = new THREE.Color(0x424949)

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const z = positions.getZ(i)
      const noiseVal = this.noise.noise(x * 0.015, z * 0.015)
      const height = (noiseVal * 0.5 + 0.5) * 40
      positions.setY(i, height)

      const t = height / 40
      const color = sandColor.clone().lerp(rockColor, t)
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.computeVertexNormals()

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.9,
      metalness: 0.1,
      flatShading: false
    })

    this.terrain = new THREE.Mesh(geometry, material)
    this.terrain.receiveShadow = true
    this.terrain.name = 'terrain'
    this.scene.add(this.terrain)
  }

  getTerrainHeight(x: number, z: number): number {
    const noiseVal = this.noise.noise(x * 0.015, z * 0.015)
    return (noiseVal * 0.5 + 0.5) * 40
  }

  private createCorals() {
    const coralCount = 40
    for (let i = 0; i < coralCount; i++) {
      const x = (Math.random() - 0.5) * 360
      const z = (Math.random() - 0.5) * 360
      const y = this.getTerrainHeight(x, z)
      this.createCoral(x, y, z)
    }
  }

  private createCoral(x: number, y: number, z: number) {
    const group = new THREE.Group()
    group.position.set(x, y, z)

    const branchCount = 3 + Math.floor(Math.random() * 3)
    const baseColor = new THREE.Color(0xff6633)
    const tipColor = new THREE.Color(0x33cc66)

    for (let i = 0; i < branchCount; i++) {
      const branchGroup = new THREE.Group()
      const angleX = (Math.random() - 0.5) * Math.PI / 2
      const angleY = Math.random() * Math.PI * 2
      const angleZ = (Math.random() - 0.5) * Math.PI / 2
      branchGroup.rotation.set(angleX, angleY, angleZ)

      const segments = 4 + Math.floor(Math.random() * 3)
      for (let j = 0; j < segments; j++) {
        const size = 0.8 - j * 0.15
        if (size <= 0.1) break

        const igeo = new THREE.IcosahedronGeometry(size, 0)
        const t = j / segments
        const color = baseColor.clone().lerp(tipColor, t)
        const imat = new THREE.MeshStandardMaterial({
          color: color,
          roughness: 0.6,
          metalness: 0.2
        })
        const mesh = new THREE.Mesh(igeo, imat)
        mesh.position.y = j * 0.7
        mesh.castShadow = true
        branchGroup.add(mesh)
      }

      group.add(branchGroup)
    }

    const targetScale = 0.5 + Math.random() * 1.0
    group.scale.set(0, 0, 0)
    this.scene.add(group)

    this.coralDatas.push({
      group,
      targetScale,
      animationProgress: -Math.random() * 0.5
    })
  }

  private createFishSchool() {
    const fishCount = 30 + Math.floor(Math.random() * 31)
    for (let i = 0; i < fishCount; i++) {
      this.createFish()
    }
  }

  private createFish(isBiome: boolean = false, colorPalette?: THREE.Color[]): FishData {
    const group = new THREE.Group()

    const bodyGeo = new THREE.SphereGeometry(1, 16, 16)
    bodyGeo.scale(1.5, 1, 1)
    const bodyColor = colorPalette
      ? colorPalette[Math.floor(Math.random() * colorPalette.length)]
      : new THREE.Color().setHSL(Math.random() * 0.1 + 0.05, 0.8, 0.6)
    const bodyMat = new THREE.MeshStandardMaterial({
      color: bodyColor,
      roughness: 0.3,
      metalness: 0.5
    })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.castShadow = true
    group.add(body)

    const tailCount = 2 + Math.floor(Math.random() * 4)
    for (let i = 0; i < tailCount; i++) {
      const tailGeo = new THREE.ConeGeometry(0.4, 1.2, 3)
      tailGeo.rotateZ(Math.PI / 2)
      const tailMat = new THREE.MeshStandardMaterial({
        color: bodyColor.clone().multiplyScalar(0.8),
        roughness: 0.4,
        metalness: 0.4,
        side: THREE.DoubleSide
      })
      const tail = new THREE.Mesh(tailGeo, tailMat)
      tail.position.x = -1.2
      tail.position.y = (i - tailCount / 2) * 0.3
      tail.castShadow = true
      group.add(tail)
    }

    const eyeGeo = new THREE.SphereGeometry(0.15, 8, 8)
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 })
    const eye1 = new THREE.Mesh(eyeGeo, eyeMat)
    eye1.position.set(0.8, 0.3, 0.3)
    const eye2 = new THREE.Mesh(eyeGeo, eyeMat)
    eye2.position.set(0.8, 0.3, -0.3)
    group.add(eye1, eye2)

    const scale = 0.8 + Math.random() * 0.8
    group.scale.setScalar(scale)

    const centerX = (Math.random() - 0.5) * 300
    const centerZ = (Math.random() - 0.5) * 300
    const depth = 30 + Math.random() * 120
    const center = new THREE.Vector3(centerX, 200 - depth, centerZ)

    const fishData: FishData = {
      mesh: group,
      center,
      angle: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.3,
      baseRadius: 15 + Math.random() * 25,
      depthFactor: 1 - depth / 200
    }

    this.updateFishPosition(fishData, 0)
    this.scene.add(group)

    return fishData
  }

  private updateFishPosition(fish: FishData, delta: number) {
    fish.angle += fish.speed * delta * 0.5
    const radius = fish.baseRadius * fish.depthFactor
    const x = fish.center.x + Math.cos(fish.angle) * radius
    const z = fish.center.z + Math.sin(fish.angle) * radius
    const y = fish.center.y + Math.sin(fish.angle * 0.7) * 5

    const oldPos = fish.mesh.position.clone()
    fish.mesh.position.set(x, y, z)

    if (oldPos.distanceTo(fish.mesh.position) > 0.01) {
      const direction = new THREE.Vector3().subVectors(fish.mesh.position, oldPos).normalize()
      const targetQuat = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(1, 0, 0),
        direction
      )
      fish.mesh.quaternion.slerp(targetQuat, 0.1)
    }
  }

  private createSunAndLight() {
    const sunGeo = new THREE.SphereGeometry(4, 32, 32)
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.7
    })
    this.sunSphere = new THREE.Mesh(sunGeo, sunMat)
    this.sunSphere.position.set(0, this.sunY, 0)
    this.sunSphere.name = 'sun'
    this.scene.add(this.sunSphere)

    this.updateLightCone()
  }

  private updateLightCone() {
    if (this.lightCone) {
      this.scene.remove(this.lightCone)
    }

    const coneHeight = Math.max(3, this.sunY - 3)
    const baseRadius = this.sunY * 0.35

    const canvas = document.createElement('canvas')
    canvas.width = 2
    canvas.height = 256
    const ctx = canvas.getContext('2d')!
    const gradient = ctx.createLinearGradient(0, 0, 0, 256)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)')
    gradient.addColorStop(1, 'rgba(255, 255, 200, 0.1)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 2, 256)
    const texture = new THREE.CanvasTexture(canvas)

    const coneGeo = new THREE.ConeGeometry(baseRadius, coneHeight, 32, 1, true)
    const coneMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      depthWrite: false
    })
    this.lightCone = new THREE.Mesh(coneGeo, coneMat)
    this.lightCone.position.set(0, coneHeight / 2, 0)
    this.lightCone.rotation.x = Math.PI
    this.scene.add(this.lightCone)
  }

  private setupCameraControls() {
    const canvas = this.renderer.domElement

    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0 && !this.isDraggingSun) {
        this.isRotating = true
        this.lastMouseX = e.clientX
        this.lastMouseY = e.clientY
      } else if (e.button === 2) {
        this.isPanning = true
        this.lastMouseX = e.clientX
        this.lastMouseY = e.clientY
      }
    })

    canvas.addEventListener('mousemove', (e) => {
      if (this.isRotating) {
        const deltaX = e.clientX - this.lastMouseX
        const deltaY = e.clientY - this.lastMouseY
        this.theta -= deltaX * 0.002
        this.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.phi - deltaY * 0.002))
        this.lastMouseX = e.clientX
        this.lastMouseY = e.clientY
      } else if (this.isPanning) {
        const deltaX = e.clientX - this.lastMouseX
        const deltaY = e.clientY - this.lastMouseY
        const right = new THREE.Vector3()
        const up = new THREE.Vector3(0, 1, 0)
        this.camera.getWorldDirection(right)
        right.cross(up).normalize()
        this.lookAt.addScaledVector(right, -deltaX * 0.5)
        this.lookAt.addScaledVector(up, deltaY * 0.5)
        this.lastMouseX = e.clientX
        this.lastMouseY = e.clientY
      }
    })

    canvas.addEventListener('mouseup', () => {
      this.isRotating = false
      this.isPanning = false
    })

    canvas.addEventListener('mouseleave', () => {
      this.isRotating = false
      this.isPanning = false
    })

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault()
      this.cameraDistance = Math.max(10, Math.min(300, this.cameraDistance + e.deltaY * 0.1))
    }, { passive: false })

    canvas.addEventListener('contextmenu', (e) => e.preventDefault())
  }

  private setupSunDrag() {
    const canvas = this.renderer.domElement

    canvas.addEventListener('mousedown', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
      this.raycaster.setFromCamera(this.mouse, this.camera)
      const intersects = this.raycaster.intersectObject(this.sunSphere)
      if (intersects.length > 0) {
        this.isDraggingSun = true
      }
    })

    canvas.addEventListener('mousemove', (e) => {
      if (!this.isDraggingSun) return

      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
      this.raycaster.setFromCamera(this.mouse, this.camera)

      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
      const point = new THREE.Vector3()
      this.raycaster.ray.intersectPlane(plane, point)

      if (point) {
        const newY = Math.max(0, Math.min(200, point.y))
        this.onSunDrag(newY)
      }
    })

    canvas.addEventListener('mouseup', () => {
      this.isDraggingSun = false
    })
  }

  onSunDrag(y: number) {
    this.sunY = y
    this.sunSphere.position.y = y
    this.updateLightCone()
    this.updateLightStats()
    this.dispatchUpdateEvent()
  }

  private updateLightStats() {
    this.lightStats.intensity = (this.sunY / 200) * 100
    this.lightStats.angle = Math.atan2(this.sunY, 80) * 180 / Math.PI
    this.lightStats.visibility = (this.lightStats.intensity / 100) * 50
  }

  getLightStats(): LightStats {
    return { ...this.lightStats }
  }

  getPerformanceStats(): PerformanceStats {
    return { ...this.performanceStats }
  }

  addUpdateListener(callback: () => void) {
    this.eventTarget.addEventListener('update', callback)
  }

  private dispatchUpdateEvent() {
    this.eventTarget.dispatchEvent(new Event('update'))
  }

  generateBiome() {
    if (this.currentBiome) {
      this.scene.remove(this.currentBiome)
      this.biomeFish.forEach(f => this.scene.remove(f.mesh))
      this.biomeFish = []
      this.particleSystems.forEach(ps => this.scene.remove(ps.points))
      this.particleSystems = []
    }

    this.currentBiome = new THREE.Group()
    this.scene.add(this.currentBiome)

    const centerX = 0
    const centerZ = 0
    const radius = 60
    const intensity = this.lightStats.intensity

    this.createBurstEffect(centerX, this.sunY * 0.5, centerZ)

    let fishColors: THREE.Color[]
    let particleConfig: {
      max: number, rate: number, life: number,
      sizeRange: [number, number], colors: THREE.Color[]
    }

    if (intensity > 60) {
      fishColors = [new THREE.Color(0xff8c00), new THREE.Color(0xffd700), new THREE.Color(0xff6347)]
      particleConfig = {
        max: 500, rate: 20, life: 1.5,
        sizeRange: [0.3, 0.8],
        colors: [new THREE.Color(0xffffff)]
      }
    } else if (intensity >= 30) {
      fishColors = [new THREE.Color(0x708090), new THREE.Color(0x4682b4), new THREE.Color(0x5f9ea0)]
      particleConfig = {
        max: 300, rate: 10, life: 2,
        sizeRange: [0.1, 0.4],
        colors: [new THREE.Color(0x87ceeb), new THREE.Color(0xb0c4de)]
      }
    } else {
      fishColors = [new THREE.Color(0x483d8b), new THREE.Color(0x8b008b), new THREE.Color(0x800000)]
      particleConfig = {
        max: 600, rate: 15, life: 3,
        sizeRange: [0.2, 0.6],
        colors: [new THREE.Color(0x00ff88)]
      }
    }

    const fishCount = 15 + Math.floor(Math.random() * 16)
    for (let i = 0; i < fishCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const r = Math.random() * radius
      const fx = centerX + Math.cos(angle) * r
      const fz = centerZ + Math.sin(angle) * r
      const fy = this.getTerrainHeight(fx, fz) + 10 + Math.random() * 30

      const fish = this.createFish(true, fishColors)
      fish.center.set(fx, fy, fz)
      fish.baseRadius = 5 + Math.random() * 15
      this.biomeFish.push(fish)
    }

    this.createParticleSystem(particleConfig, centerX, centerZ, radius)
    this.updateTriangleCount()
    this.dispatchUpdateEvent()
  }

  private createBurstEffect(x: number, y: number, z: number) {
    const burstCount = 200
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(burstCount * 3)
    const velocities: THREE.Vector3[] = []
    const colors = new Float32Array(burstCount * 3)
    const sizes = new Float32Array(burstCount)

    const burstColor = new THREE.Color(0xffff00)

    for (let i = 0; i < burstCount; i++) {
      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ).normalize().multiplyScalar(20 + Math.random() * 30)
      velocities.push(vel)

      colors[i * 3] = burstColor.r
      colors[i * 3 + 1] = burstColor.g
      colors[i * 3 + 2] = burstColor.b

      sizes[i] = 0.5 + Math.random() * 0.8
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const material = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      sizeAttenuation: true
    })

    const points = new THREE.Points(geometry, material)
    this.scene.add(points)

    const startTime = performance.now()
    const duration = 600

    const animateBurst = () => {
      const elapsed = performance.now() - startTime
      const t = Math.min(1, elapsed / duration)
      const easeOut = 1 - Math.pow(1 - t, 3)

      const posAttr = geometry.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < burstCount; i++) {
        const vel = velocities[i]
        posAttr.setX(i, x + vel.x * easeOut)
        posAttr.setY(i, y + vel.y * easeOut)
        posAttr.setZ(i, z + vel.z * easeOut)
      }
      posAttr.needsUpdate = true
      material.opacity = 1 - t

      if (t < 1) {
        requestAnimationFrame(animateBurst)
      } else {
        this.scene.remove(points)
