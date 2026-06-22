import * as THREE from 'three'
import { lerp } from './utils'

export interface GeometryParams {
  scale: number
  rotationSpeed: number
  color: string
}

export interface SceneGeometryItem {
  id: 'cube' | 'sphere' | 'torusknot'
  mesh: THREE.Mesh
  haloMesh: THREE.Mesh
  haloBaseScale: number
  params: GeometryParams
  targetParams: GeometryParams
  selected: boolean
  basePosition: THREE.Vector3
  floatPhase: number
}

type FrameCallback = () => void

const GEOMETRY_CONFIGS: Array<{
  id: 'cube' | 'sphere' | 'torusknot'
  position: [number, number, number]
  color: string
}> = [
  { id: 'cube', position: [-3.2, 0, 0], color: '#64b5f6' },
  { id: 'sphere', position: [0, 0, 0], color: '#f06292' },
  { id: 'torusknot', position: [3.2, 0, 0], color: '#ffb74d' }
]

export class SceneManager {
  private container: HTMLElement
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private geometries: Map<string, SceneGeometryItem> = new Map()
  private raycaster = new THREE.Raycaster()
  private pointer = new THREE.Vector2()
  private frameCallbacks: FrameCallback[] = []
  private rafId: number | null = null
  private clock = new THREE.Clock()
  private ambientLight!: THREE.AmbientLight
  private directionalLight!: THREE.DirectionalLight
  private pointLight!: THREE.PointLight

  constructor(container: HTMLElement) {
    this.container = container
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x1a1a2e)

    const w = container.clientWidth
    const h = container.clientHeight

    this.camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100)
    this.camera.position.set(0, 0, 8.5)
    this.camera.lookAt(0, 0, 0)

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(w, h)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.1
    container.appendChild(this.renderer.domElement)
  }

  init(): void {
    this.setupLights()
    this.createStarfield()
    this.createGeometries()
    window.addEventListener('resize', this.handleResize)
    this.startLoop()
  }

  private setupLights(): void {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    this.scene.add(this.ambientLight)

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.85)
    this.directionalLight.position.set(4, 6, 6)
    this.scene.add(this.directionalLight)

    this.pointLight = new THREE.PointLight(0xff9500, 1.2, 20)
    this.pointLight.position.set(0, 3, 5)
    this.scene.add(this.pointLight)

    const blueLight = new THREE.PointLight(0x4488ff, 0.8, 18)
    blueLight.position.set(-5, -2, 4)
    this.scene.add(blueLight)
  }

  private createStarfield(): void {
    const starCount = 300
    const positions = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 25
      positions[i * 3 + 1] = (Math.random() - 0.5) * 16
      positions[i * 3 + 2] = (Math.random() - 0.5) * 15 - 3
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.03, transparent: true, opacity: 0.7 })
    this.scene.add(new THREE.Points(geo, mat))
  }

  private createGeometries(): void {
    for (const cfg of GEOMETRY_CONFIGS) {
      let geometry: THREE.BufferGeometry
      if (cfg.id === 'cube') {
        geometry = new THREE.BoxGeometry(1.2, 1.2, 1.2, 4, 4, 4)
      } else if (cfg.id === 'sphere') {
        geometry = new THREE.SphereGeometry(0.9, 48, 32)
      } else {
        geometry = new THREE.TorusKnotGeometry(0.6, 0.22, 128, 24, 2, 3)
      }

      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(cfg.color),
        metalness: 0.35,
        roughness: 0.38
      })

      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(...cfg.position)
      mesh.userData.id = cfg.id
      this.scene.add(mesh)

      const haloGeo = new THREE.RingGeometry(1.2, 1.55, 64)
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
        depthWrite: false
      })
      const haloMesh = new THREE.Mesh(haloGeo, haloMat)
      haloMesh.position.copy(mesh.position)
      haloMesh.position.z -= 0.1
      haloMesh.lookAt(this.camera.position)
      this.scene.add(haloMesh)

      const defaultParams: GeometryParams = { scale: 1, rotationSpeed: 1, color: cfg.color }
      this.geometries.set(cfg.id, {
        id: cfg.id,
        mesh,
        haloMesh,
        haloBaseScale: 1,
        params: { ...defaultParams },
        targetParams: { ...defaultParams },
        selected: false,
        basePosition: mesh.position.clone(),
        floatPhase: Math.random() * Math.PI * 2
      })
    }
  }

  onFrame(cb: FrameCallback): void {
    this.frameCallbacks.push(cb)
  }

  private startLoop(): void {
    const tick = () => {
      const delta = this.clock.getDelta()
      const elapsed = this.clock.getElapsedTime()
      this.updateAnimations(delta, elapsed)
      for (const cb of this.frameCallbacks) cb()
      this.renderer.render(this.scene, this.camera)
      this.rafId = requestAnimationFrame(tick)
    }
    this.rafId = requestAnimationFrame(tick)
  }

  private updateAnimations(delta: number, elapsed: number): void {
    for (const item of this.geometries.values()) {
      const t = 0.15
      item.params.scale = lerp(item.params.scale, item.targetParams.scale, t)
      item.params.rotationSpeed = lerp(item.params.rotationSpeed, item.targetParams.rotationSpeed, t)
      const col = new THREE.Color(item.params.color).lerp(new THREE.Color(item.targetParams.color), t)
      item.params.color = '#' + col.getHexString()
      ;(item.mesh.material as THREE.MeshStandardMaterial).color.copy(col)

      item.mesh.scale.setScalar(item.params.scale)

      const speed = item.params.rotationSpeed
      item.mesh.rotation.y += delta * 0.9 * speed
      item.mesh.rotation.x += delta * 0.35 * speed

      const floatY = item.selected ? Math.sin(elapsed * Math.PI + item.floatPhase) * 0.05 : 0
      item.mesh.position.y = item.basePosition.y + floatY

      const haloPulse = item.selected
        ? 1 + Math.sin(elapsed * (2 * Math.PI / 0.8)) * 0.15
        : 1
      const haloScale = item.haloBaseScale * haloPulse
      item.haloMesh.scale.setScalar(haloScale)

      const haloMat = item.haloMesh.material as THREE.MeshBasicMaterial
      const targetOpacity = item.selected ? 0.35 : 0.15
      const targetColor = item.selected ? new THREE.Color(0xff9500) : new THREE.Color(0xffffff)
      haloMat.opacity = lerp(haloMat.opacity, targetOpacity, 0.12)
      ;(haloMat.color as THREE.Color).lerp(targetColor, 0.12)
      item.haloMesh.position.copy(item.mesh.position)
      item.haloMesh.position.z -= 0.1
      item.haloMesh.lookAt(this.camera.position)
    }

    this.pointLight.position.x = Math.sin(elapsed * 0.5) * 3
    this.pointLight.position.y = 2 + Math.cos(elapsed * 0.7) * 1.5
  }

  private handleResize = (): void => {
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
  }

  updateGeometry(id: string, params: Partial<GeometryParams>): void {
    const item = this.geometries.get(id)
    if (!item) return
    if (params.scale !== undefined) item.targetParams.scale = params.scale
    if (params.rotationSpeed !== undefined) item.targetParams.rotationSpeed = params.rotationSpeed
    if (params.color !== undefined) item.targetParams.color = params.color
  }

  setSelected(id: string | null): void {
    for (const item of this.geometries.values()) {
      item.selected = item.id === id
    }
  }

  getParams(id: string): GeometryParams | null {
    const item = this.geometries.get(id)
    return item ? { ...item.params } : null
  }

  raycast(normalizedX: number, normalizedY: number): string | null {
    this.pointer.x = normalizedX * 2 - 1
    this.pointer.y = -(normalizedY * 2 - 1)
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const meshes = Array.from(this.geometries.values()).map(g => g.mesh)
    const hits = this.raycaster.intersectObjects(meshes, false)
    if (hits.length > 0) {
      return hits[0].object.userData.id as string
    }
    return null
  }

  dispose(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId)
    window.removeEventListener('resize', this.handleResize)
    for (const item of this.geometries.values()) {
      item.mesh.geometry.dispose()
      ;(item.mesh.material as THREE.Material).dispose()
      item.haloMesh.geometry.dispose()
      ;(item.haloMesh.material as THREE.Material).dispose()
    }
    this.geometries.clear()
    this.renderer.dispose()
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement)
    }
  }
}
