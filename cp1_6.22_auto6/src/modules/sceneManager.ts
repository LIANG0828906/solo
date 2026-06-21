import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import gsap from 'gsap'
import { LoadedModel } from './modelLoader'

export class SceneManager {
  private container: HTMLElement
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private controls: OrbitControls
  private currentModel: THREE.Group | null = null
  private currentModelData: LoadedModel | null = null
  private boundingBox: THREE.Box3 = new THREE.Box3()
  private animationFrameId: number | null = null
  private isExploded: boolean = false
  private partOriginalPositions: Map<THREE.Mesh, THREE.Vector3> = new Map()
  private raycaster: THREE.Raycaster
  private mouse: THREE.Vector2

  constructor(container: HTMLElement) {
    this.container = container
    this.scene = new THREE.Scene()
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()

    this.scene.background = new THREE.Color(0x1a1a2e)

    const fov = 45
    const aspect = container.clientWidth / container.clientHeight
    this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000)
    this.camera.position.set(0, 1, 5)

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2
    container.appendChild(this.renderer.domElement)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.dampingFactor = 0.08
    this.controls.minPolarAngle = 0
    this.controls.maxPolarAngle = Math.PI
    this.controls.minDistance = 1
    this.controls.maxDistance = 10
    this.controls.enablePan = false

    this.setupLights()
    this.setupEnvironment()
    this.setupResizeHandler()
    this.animate()
  }

  private setupLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    this.scene.add(ambientLight)

    const mainLight = new THREE.DirectionalLight(0xffffff, 1)
    mainLight.position.set(5, 8, 5)
    mainLight.castShadow = true
    mainLight.shadow.mapSize.width = 2048
    mainLight.shadow.mapSize.height = 2048
    mainLight.shadow.camera.near = 0.5
    mainLight.shadow.camera.far = 50
    mainLight.shadow.camera.left = -10
    mainLight.shadow.camera.right = 10
    mainLight.shadow.camera.top = 10
    mainLight.shadow.camera.bottom = -10
    mainLight.shadow.bias = -0.0001
    this.scene.add(mainLight)

    const fillLight = new THREE.DirectionalLight(0x88ccff, 0.4)
    fillLight.position.set(-5, 3, -3)
    this.scene.add(fillLight)

    const rimLight = new THREE.DirectionalLight(0x00d2ff, 0.3)
    rimLight.position.set(0, 2, -8)
    this.scene.add(rimLight)

    const pointLight = new THREE.PointLight(0x00d2ff, 0.5, 20)
    pointLight.position.set(-3, 2, 3)
    this.scene.add(pointLight)
  }

  private setupEnvironment() {
    const groundGeo = new THREE.PlaneGeometry(30, 30)
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      metalness: 0.3,
      roughness: 0.8,
    })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -2
    ground.receiveShadow = true
    this.scene.add(ground)

    const gridHelper = new THREE.GridHelper(20, 40, 0x00d2ff, 0x2a2a4e)
    gridHelper.position.y = -1.99
    ;(gridHelper.material as THREE.Material).opacity = 0.2
    ;(gridHelper.material as THREE.Material).transparent = true
    this.scene.add(gridHelper)

    const particleCount = 500
    const particles = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30
      positions[i * 3 + 1] = Math.random() * 20 - 2
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    
    const particleMat = new THREE.PointsMaterial({
      color: 0x00d2ff,
      size: 0.05,
      transparent: true,
      opacity: 0.6,
    })
    
    const particleSystem = new THREE.Points(particles, particleMat)
    particleSystem.name = 'particles'
    this.scene.add(particleSystem)
  }

  private setupResizeHandler() {
    window.addEventListener('resize', this.onResize.bind(this))
  }

  private onResize() {
    const width = this.container.clientWidth
    const height = this.container.clientHeight

    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(width, height)
  }

  set dampingFactor(value: number) {
    ;(this.controls as any).dampingFactor = value
  }

  loadModel(modelData: LoadedModel): Promise<void> {
    return new Promise((resolve) => {
      if (this.currentModel) {
        this.scene.remove(this.currentModel)
        this.partOriginalPositions.clear()
      }

      this.currentModelData = modelData
      this.currentModel = modelData.scene
      this.boundingBox = modelData.boundingBox.clone()

      this.currentModel.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          this.partOriginalPositions.set(child, child.position.clone())
        }
      })

      const size = new THREE.Vector3()
      this.boundingBox.getSize(size)
      const maxDim = Math.max(size.x, size.y, size.z)

      this.controls.minDistance = maxDim * 0.5
      this.controls.maxDistance = maxDim * 3
      this.controls.target.copy(this.boundingBox.getCenter(new THREE.Vector3()))

      this.currentModel.position.y = -5
      this.currentModel.rotation.y = Math.PI * 2
      this.currentModel.scale.setScalar(0.1)

      this.scene.add(this.currentModel)

      const tl = gsap.timeline({
        onComplete: () => {
          resolve()
        }
      })

      tl.to(this.currentModel.position, {
        y: 0,
        duration: 1.2,
        ease: 'back.out(1.2)',
      })
      
      tl.to(this.currentModel.rotation, {
        y: 0,
        duration: 1.2,
        ease: 'power2.out',
      }, 0)
      
      tl.to(this.currentModel.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 1.2,
        ease: 'back.out(1.2)',
      }, 0)

      const center = new THREE.Vector3()
      this.boundingBox.getCenter(center)
      tl.to(this.controls.target, {
        x: center.x,
        y: center.y,
        z: center.z,
        duration: 1.2,
        ease: 'power2.out',
      }, 0)

      const distance = maxDim * 1.8
      tl.to(this.camera.position, {
        x: distance * 0.5,
        y: distance * 0.3,
        z: distance,
        duration: 1.2,
        ease: 'power2.out',
      }, 0)
    })
  }

  explode(duration: number = 1.5): Promise<void> {
    if (!this.currentModelData || this.isExploded) return Promise.resolve()

    this.isExploded = true
    const promises: Promise<void>[] = []

    this.currentModelData.parts.forEach((part) => {
      const originalPos = this.partOriginalPositions.get(part)
      if (!originalPos) return

      const normal = originalPos.clone().normalize()
      if (normal.length() < 0.01) {
        normal.set(0, 1, 0)
      }
      const explodeDistance = originalPos.length() * 0.5 + 0.3
      const targetPos = originalPos.clone().add(normal.multiplyScalar(explodeDistance))

      promises.push(new Promise<void>((resolve) => {
        gsap.to(part.position, {
          x: targetPos.x,
          y: targetPos.y,
          z: targetPos.z,
          duration,
          ease: 'power2.inOut',
          onComplete: resolve,
        })
      }))
    })

    return Promise.all(promises).then(() => {})
  }

  assemble(duration: number = 1.5): Promise<void> {
    if (!this.currentModelData || !this.isExploded) return Promise.resolve()

    this.isExploded = false
    const promises: Promise<void>[] = []

    this.currentModelData.parts.forEach((part) => {
      const originalPos = this.partOriginalPositions.get(part)
      if (!originalPos) return

      promises.push(new Promise<void>((resolve) => {
        gsap.to(part.position, {
          x: originalPos.x,
          y: originalPos.y,
          z: originalPos.z,
          duration,
          ease: 'power2.inOut',
          onComplete: resolve,
        })
      }))
    })

    return Promise.all(promises).then(() => {})
  }

  getIsExploded(): boolean {
    return this.isExploded
  }

  pick(normalizedX: number, normalizedY: number): { point: THREE.Vector3; normal: THREE.Vector3; info: any } | null {
    if (!this.currentModel) return null

    this.mouse.set(normalizedX * 2 - 1, -(normalizedY * 2 - 1))
    this.raycaster.setFromCamera(this.mouse, this.camera)

    const meshes: THREE.Mesh[] = []
    this.currentModel.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        meshes.push(child)
      }
    })

    const intersects = this.raycaster.intersectObjects(meshes)

    if (intersects.length > 0) {
      const hit = intersects[0]
      const point = hit.point.clone()
      const normal = hit.face?.normal.clone() || new THREE.Vector3(0, 1, 0)
      
      if (hit.face && hit.object instanceof THREE.Mesh) {
        normal.transformDirection(hit.object.matrixWorld)
      }

      const info = this.currentModelData?.getPointInfo(point, normal) || null

      return { point, normal, info }
    }

    return null
  }

  worldToScreen(point: THREE.Vector3): { x: number; y: number } {
    const vector = point.clone().project(this.camera)
    return {
      x: (vector.x + 1) / 2 * this.container.clientWidth,
      y: (-vector.y + 1) / 2 * this.container.clientHeight,
    }
  }

  private animate() {
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this))

    const particles = this.scene.getObjectByName('particles') as THREE.Points
    if (particles && particles.geometry) {
      const positions = particles.geometry.attributes.position as THREE.BufferAttribute
      const arr = positions.array as Float32Array
      for (let i = 0; i < arr.length; i += 3) {
        arr[i + 1] += 0.002
        if (arr[i + 1] > 18) {
          arr[i + 1] = -2
        }
      }
      positions.needsUpdate = true
    }

    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }

  setCameraPosition(x: number, y: number, z: number) {
    this.camera.position.set(x, y, z)
  }

  setTarget(x: number, y: number, z: number) {
    this.controls.target.set(x, y, z)
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera
  }

  getControls(): OrbitControls {
    return this.controls
  }

  getRendererDomElement(): HTMLCanvasElement {
    return this.renderer.domElement
  }

  getCurrentModel(): THREE.Group | null {
    return this.currentModel
  }

  getCurrentModelData(): LoadedModel | null {
    return this.currentModelData
  }

  getBoundingBox(): THREE.Box3 {
    return this.boundingBox
  }

  dispose() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
    }
    window.removeEventListener('resize', this.onResize.bind(this))
    this.controls.dispose()
    this.renderer.dispose()
  }
}

export default SceneManager
