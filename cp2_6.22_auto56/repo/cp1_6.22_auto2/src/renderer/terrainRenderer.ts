import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { latLonToWorld } from '@/utils/geo'

export class TerrainRenderer {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  controls: OrbitControls
  directionalLight: THREE.DirectionalLight
  ambientLight: THREE.AmbientLight
  terrainGroup: THREE.Group
  measurementGroup: THREE.Group
  private container: HTMLElement
  private animFrameId = 0
  private lightAngle = 0
  private onAnimate: (() => void) | null = null
  private clock = new THREE.Clock()

  constructor(container: HTMLElement) {
    this.container = container
    const w = container.clientWidth
    const h = container.clientHeight

    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2(0x0a1628, 0.0008)

    this.camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 20000)
    this.camera.position.set(200, 150, 200)

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    this.renderer.setSize(w, h)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setClearColor(0x0a1628, 1)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2
    container.appendChild(this.renderer.domElement)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.minDistance = 5
    this.controls.maxDistance = 5000
    this.controls.maxPolarAngle = Math.PI * 0.48

    this.ambientLight = new THREE.AmbientLight(0x334466, 0.6)
    this.scene.add(this.ambientLight)

    this.directionalLight = new THREE.DirectionalLight(0xffeedd, 1.2)
    this.directionalLight.position.set(100, 80, -60)
    this.scene.add(this.directionalLight)

    const hemisphere = new THREE.HemisphereLight(0x4a8ab5, 0x0d3b2e, 0.3)
    this.scene.add(hemisphere)

    this.terrainGroup = new THREE.Group()
    this.scene.add(this.terrainGroup)

    this.measurementGroup = new THREE.Group()
    this.scene.add(this.measurementGroup)

    this.createSkybox()

    window.addEventListener('resize', this.onResize)
  }

  private createSkybox(): void {
    const canvas = document.createElement('canvas')
    canvas.width = 2
    canvas.height = 512
    const ctx = canvas.getContext('2d')!
    const gradient = ctx.createLinearGradient(0, 0, 0, 512)
    gradient.addColorStop(0, '#0a1628')
    gradient.addColorStop(0.3, '#0f2540')
    gradient.addColorStop(0.5, '#1a3a5c')
    gradient.addColorStop(0.7, '#2d5f8a')
    gradient.addColorStop(1, '#4a8ab5')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 2, 512)

    const texture = new THREE.CanvasTexture(canvas)
    texture.mapping = THREE.EquirectangularReflectionMapping
    this.scene.background = texture
  }

  private onResize = (): void => {
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
  }

  addTerrainMesh(geometry: THREE.BufferGeometry, tileLat: number, tileLon: number): THREE.Mesh {
    const existing = this.terrainGroup.children.find(c => {
      const m = c as THREE.Mesh
      return m.userData.tileLat === tileLat && m.userData.tileLon === tileLon
    })
    if (existing) {
      this.terrainGroup.remove(existing)
      ;(existing as THREE.Mesh).geometry.dispose()
      ;(existing as THREE.Mesh).material && ((existing as THREE.Mesh).material as THREE.Material).dispose()
    }

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.05,
      flatShading: false,
      side: THREE.FrontSide,
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.userData.tileLat = tileLat
    mesh.userData.tileLon = tileLon
    mesh.castShadow = false
    mesh.receiveShadow = true
    this.terrainGroup.add(mesh)
    return mesh
  }

  removeTerrainTile(tileLat: number, tileLon: number): void {
    const idx = this.terrainGroup.children.findIndex(c =>
      c.userData.tileLat === tileLat && c.userData.tileLon === tileLon,
    )
    if (idx !== -1) {
      const child = this.terrainGroup.children[idx] as THREE.Mesh
      this.terrainGroup.remove(child)
      child.geometry.dispose()
      ;(child.material as THREE.Material).dispose()
    }
  }

  clearMeasurement(): void {
    while (this.measurementGroup.children.length > 0) {
      const child = this.measurementGroup.children[0] as THREE.Mesh | THREE.Line
      this.measurementGroup.remove(child)
      if ((child as THREE.Mesh).geometry) (child as THREE.Mesh).geometry.dispose()
      if ((child as THREE.Mesh).material) ((child as THREE.Mesh).material as THREE.Material).dispose()
    }
  }

  addMeasurementLine(
    start: THREE.Vector3,
    end: THREE.Vector3,
  ): void {
    this.clearMeasurement()

    const points = [start, end]
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points)
    const lineMat = new THREE.LineBasicMaterial({ color: 0x6bb8e8, linewidth: 2 })
    const line = new THREE.Line(lineGeo, lineMat)
    this.measurementGroup.add(line)

    const dir = new THREE.Vector3().subVectors(end, start).normalize()
    const arrowLen = Math.min(start.distanceTo(end) * 0.08, 5)
    const arrowGeo = new THREE.ConeGeometry(0.8, arrowLen, 8)
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0x6bb8e8 })
    const arrow = new THREE.Mesh(arrowGeo, arrowMat)
    arrow.position.copy(end)
    const quaternion = new THREE.Quaternion()
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
    arrow.setRotationFromQuaternion(quaternion)
    this.measurementGroup.add(arrow)

    const sphereGeo = new THREE.SphereGeometry(1.2, 16, 16)
    const sphereMat = new THREE.MeshBasicMaterial({ color: 0xff6644 })
    const sphere1 = new THREE.Mesh(sphereGeo, sphereMat)
    sphere1.position.copy(start)
    this.measurementGroup.add(sphere1)
    const sphere2 = new THREE.Mesh(sphereGeo.clone(), sphereMat.clone())
    sphere2.position.copy(end)
    this.measurementGroup.add(sphere2)
  }

  updateLighting(delta: number): void {
    this.lightAngle += (delta / 60) * Math.PI * 2
    const radius = 200
    const x = Math.cos(this.lightAngle) * radius * 0.7
    const y = 80 + Math.sin(this.lightAngle) * 20
    const z = -Math.sin(this.lightAngle) * radius * 0.7
    this.directionalLight.position.set(x, y, z)
  }

  getVisibleTileRange(): { minLat: number; maxLat: number; minLon: number; maxLon: number } {
    const camPos = this.camera.position
    const dist = this.controls.getDistance()
    const range = Math.max(3, Math.floor(dist / 30))
    const center = this.controls.target
    const centerLat = -center.z / 111.32
    const centerLon = center.x / (111.32 * Math.cos(centerLat * Math.PI / 180))
    return {
      minLat: Math.floor(centerLat - range),
      maxLat: Math.floor(centerLat + range),
      minLon: Math.floor(centerLon - range),
      maxLon: Math.floor(centerLon + range),
    }
  }

  animateCameraTo(lat: number, lon: number, duration = 1.5): Promise<void> {
    return new Promise(resolve => {
      const target = latLonToWorld(lat, lon)
      const startPos = this.camera.position.clone()
      const startTarget = this.controls.target.clone()

      const endTarget = new THREE.Vector3(target.x, 0, target.z)
      const camDist = 80
      const endPos = new THREE.Vector3(
        target.x + camDist * 0.6,
        camDist * 0.5,
        target.z + camDist * 0.6,
      )

      const startTime = performance.now()
      const ms = duration * 1000

      const animateStep = (): void => {
        const elapsed = performance.now() - startTime
        let t = Math.min(elapsed / ms, 1)
        t = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

        this.camera.position.lerpVectors(startPos, endPos, t)
        this.controls.target.lerpVectors(startTarget, endTarget, t)
        this.controls.update()

        if (t < 1) {
          requestAnimationFrame(animateStep)
        } else {
          resolve()
        }
      }
      requestAnimationFrame(animateStep)
    })
  }

  startLoop(callback?: () => void): void {
    this.onAnimate = callback || null
    const loop = (): void => {
      this.animFrameId = requestAnimationFrame(loop)
      const delta = this.clock.getDelta()
      this.updateLighting(delta)
      this.controls.update()
      if (this.onAnimate) this.onAnimate()
      this.renderer.render(this.scene, this.camera)
    }
    loop()
  }

  stopLoop(): void {
    cancelAnimationFrame(this.animFrameId)
  }

  getVertexCount(): number {
    let total = 0
    this.terrainGroup.traverse(obj => {
      const mesh = obj as THREE.Mesh
      if (mesh.geometry) {
        const pos = mesh.geometry.getAttribute('position')
        if (pos) total += pos.count
      }
    })
    return total
  }

  dispose(): void {
    this.stopLoop()
    window.removeEventListener('resize', this.onResize)
    this.terrainGroup.traverse(obj => {
      const mesh = obj as THREE.Mesh
      if (mesh.geometry) mesh.geometry.dispose()
      if (mesh.material) {
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        materials.forEach(m => m.dispose())
      }
    })
    this.measurementGroup.traverse(obj => {
      const mesh = obj as THREE.Mesh
      if (mesh.geometry) mesh.geometry.dispose()
      if (mesh.material) {
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        materials.forEach(m => m.dispose())
      }
    })
    this.renderer.dispose()
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement)
    }
  }
}
