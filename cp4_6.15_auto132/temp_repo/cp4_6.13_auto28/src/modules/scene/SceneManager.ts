import * as THREE from 'three'
import type { AreaId, MaterialPreset, StylePreset } from '../../types'
import { findMaterialById, findStyleById } from '../material/MaterialLibrary'
import type { InteriorState } from '../../store/useInteriorStore'

type StoreGetState = () => InteriorState

interface MeshEntry {
  mesh: THREE.Mesh
  area: AreaId | 'sofa' | 'sofa_left' | 'sofa_right' | 'table'
  targetColor: THREE.Color
  animateFrom: number | null
  animateTo: number | null
  targetRoughness: number
  targetMetalness: number
  roughnessFrom: number | null
  metalnessFrom: number | null
}

const ROOM_SIZE = 10
const WALL_HEIGHT = 3
const WALL_THICKNESS = 0.2

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

export class SceneManager {
  public scene: THREE.Scene
  public camera: THREE.PerspectiveCamera
  public renderer: THREE.WebGLRenderer
  private meshes: Map<string, MeshEntry> = new Map()
  private animating: Set<string> = new Set()
  private cameraAnimStart: { pos: THREE.Vector3; t: number; duration: number } | null = null
  private cameraTargetEnd: THREE.Vector3 = new THREE.Vector3(0, 0, 0)
  private cameraPosEnd: THREE.Vector3 = new THREE.Vector3(ROOM_SIZE, ROOM_SIZE, ROOM_SIZE)
  private ambientLight!: THREE.AmbientLight
  private directionalLight!: THREE.DirectionalLight
  private animationFrameId: number | null = null
  private lastFpsTime = performance.now()
  private frameCount = 0
  private floorTexture: THREE.Texture | null = null
  private storeGet: StoreGetState

  private static topView = new THREE.Vector3(8, 8, 8)
  private static firstPersonView = new THREE.Vector3(0, 1.6, 3.5)
  private static targetCenter = new THREE.Vector3(0, 1, 0)

  constructor(canvas: HTMLCanvasElement, storeGet: StoreGetState) {
    this.storeGet = storeGet
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color('#e8e4de')

    const { clientWidth, clientHeight } = canvas
    this.camera = new THREE.PerspectiveCamera(50, clientWidth / clientHeight, 0.1, 1000)
    this.camera.position.copy(SceneManager.topView)
    this.camera.lookAt(SceneManager.targetCenter)
    this.cameraPosEnd.copy(SceneManager.topView)

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(clientWidth, clientHeight)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    this.setupLighting()
    this.buildRoom()
    this.addFurniture()

    window.addEventListener('resize', this.handleResize)
  }

  private setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0xfff5e6, 0.6)
    this.scene.add(this.ambientLight)

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.0)
    this.directionalLight.position.set(8, 12, 6)
    this.directionalLight.castShadow = true
    this.directionalLight.shadow.mapSize.set(1024, 1024)
    this.directionalLight.shadow.camera.left = -8
    this.directionalLight.shadow.camera.right = 8
    this.directionalLight.shadow.camera.top = 8
    this.directionalLight.shadow.camera.bottom = -8
    this.directionalLight.shadow.camera.near = 0.5
    this.directionalLight.shadow.camera.far = 30
    this.scene.add(this.directionalLight)
  }

  private registerMesh(
    key: string,
    mesh: THREE.Mesh,
    area: AreaId | 'sofa' | 'sofa_left' | 'sofa_right' | 'table',
    materialId: string,
  ) {
    const preset = findMaterialById(materialId)!
    const color = new THREE.Color(preset.color)
    ;(mesh.material as THREE.MeshStandardMaterial).color.copy(color)
    ;(mesh.material as THREE.MeshStandardMaterial).roughness = preset.roughness
    ;(mesh.material as THREE.MeshStandardMaterial).metalness = preset.metalness
    this.meshes.set(key, {
      mesh,
      area,
      targetColor: color.clone(),
      animateFrom: null,
      animateTo: null,
      targetRoughness: preset.roughness,
      targetMetalness: preset.metalness,
      roughnessFrom: null,
      metalnessFrom: null,
    })
  }

  private buildRoom() {
    const floorGeo = new THREE.PlaneGeometry(ROOM_SIZE, ROOM_SIZE)
    const floorMat = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    this.scene.add(floor)
    this.registerMesh('floor', floor, 'floor', this.storeGet().materialAssignments.floor)

    const half = ROOM_SIZE / 2
    const wallMatMaker = () => new THREE.MeshStandardMaterial({ side: THREE.DoubleSide })

    const northGeo = new THREE.BoxGeometry(ROOM_SIZE, WALL_HEIGHT, WALL_THICKNESS)
    const north = new THREE.Mesh(northGeo, wallMatMaker())
    north.position.set(0, WALL_HEIGHT / 2, -half)
    north.castShadow = true
    north.receiveShadow = true
    this.scene.add(north)
    this.registerMesh('wall_north', north, 'wall_north', this.storeGet().materialAssignments.wall_north)

    const south = new THREE.Mesh(northGeo, wallMatMaker())
    south.position.set(0, WALL_HEIGHT / 2, half)
    south.castShadow = true
    south.receiveShadow = true
    this.scene.add(south)
    this.registerMesh('wall_south', south, 'wall_south', this.storeGet().materialAssignments.wall_south)

    const eastGeo = new THREE.BoxGeometry(WALL_THICKNESS, WALL_HEIGHT, ROOM_SIZE)
    const east = new THREE.Mesh(eastGeo, wallMatMaker())
    east.position.set(half, WALL_HEIGHT / 2, 0)
    east.castShadow = true
    east.receiveShadow = true
    this.scene.add(east)
    this.registerMesh('wall_east', east, 'wall_east', this.storeGet().materialAssignments.wall_east)

    const west = new THREE.Mesh(eastGeo, wallMatMaker())
    west.position.set(-half, WALL_HEIGHT / 2, 0)
    west.castShadow = true
    west.receiveShadow = true
    this.scene.add(west)
    this.registerMesh('wall_west', west, 'wall_west', this.storeGet().materialAssignments.wall_west)
  }

  private addFurniture() {
    const sofaGroup = new THREE.Group()
    const assignments = this.storeGet().materialAssignments

    const baseGeo = new THREE.BoxGeometry(3.5, 0.5, 1.2)
    const baseMat = new THREE.MeshStandardMaterial()
    const base = new THREE.Mesh(baseGeo, baseMat)
    base.position.y = 0.25
    base.castShadow = true
    base.receiveShadow = true
    sofaGroup.add(base)
    this.registerMesh('sofa', base, 'sofa', assignments.sofa)

    const backGeo = new THREE.BoxGeometry(3.5, 0.9, 0.2)
    const backMat = new THREE.MeshStandardMaterial()
    const back = new THREE.Mesh(backGeo, backMat)
    back.position.set(0, 0.95, -0.5)
    back.castShadow = true
    sofaGroup.add(back)

    const armLeftGeo = new THREE.BoxGeometry(0.2, 0.7, 1.2)
    const armLMat = new THREE.MeshStandardMaterial()
    const armL = new THREE.Mesh(armLeftGeo, armLMat)
    armL.position.set(-1.65, 0.6, 0)
    armL.castShadow = true
    sofaGroup.add(armL)
    this.registerMesh('sofa_left', armL, 'sofa_left', assignments.sofa_left)

    const armRMat = new THREE.MeshStandardMaterial()
    const armR = new THREE.Mesh(armLeftGeo, armRMat)
    armR.position.set(1.65, 0.6, 0)
    armR.castShadow = true
    sofaGroup.add(armR)
    this.registerMesh('sofa_right', armR, 'sofa_right', assignments.sofa_right)

    sofaGroup.position.set(0, 0, -3)
    this.scene.add(sofaGroup)

    const tableGroup = new THREE.Group()
    const topGeo = new THREE.BoxGeometry(1.4, 0.08, 0.8)
    const topMat = new THREE.MeshStandardMaterial()
    const top = new THREE.Mesh(topGeo, topMat)
    top.position.y = 0.45
    top.castShadow = true
    top.receiveShadow = true
    tableGroup.add(top)
    this.registerMesh('table', top, 'table', assignments.table)

    const legGeo = new THREE.BoxGeometry(0.08, 0.45, 0.08)
    const legMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5, metalness: 0.3 })
    const positions = [
      [-0.6, 0.225, -0.3],
      [0.6, 0.225, -0.3],
      [-0.6, 0.225, 0.3],
      [0.6, 0.225, 0.3],
    ]
    positions.forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, legMat)
      leg.position.set(x, y, z)
      leg.castShadow = true
      tableGroup.add(leg)
    })

    tableGroup.position.set(0, 0, -0.5)
    this.scene.add(tableGroup)
  }

  private handleResize = () => {
    const canvas = this.renderer.domElement
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
  }

  public applyStyle(styleId: StylePreset['id']) {
    const style = findStyleById(styleId)
    if (!style) return
    const { materials, lighting } = style

    const lightColorTarget = new THREE.Color(lighting.ambientColor)
    this.ambientLight.color.lerp(lightColorTarget, 1)
    this.ambientLight.intensity = lighting.ambientIntensity
    const dirColorTarget = new THREE.Color(lighting.directionalColor)
    this.directionalLight.color.lerp(dirColorTarget, 1)
    this.directionalLight.intensity = lighting.directionalIntensity

    const mapping: Array<[string, string]> = [
      ['floor', materials.floor],
      ['wall_north', materials.walls.north],
      ['wall_south', materials.walls.south],
      ['wall_east', materials.walls.east],
      ['wall_west', materials.walls.west],
      ['sofa', materials.sofa],
      ['sofa_left', materials.sofa],
      ['sofa_right', materials.sofa],
      ['table', materials.table],
    ]
    mapping.forEach(([key, matId]) => this.setMeshMaterial(key, matId))
  }

  public setAreaMaterial(area: AreaId, materialId: string) {
    const mapping: Record<AreaId, string[]> = {
      floor: ['floor'],
      wall_north: ['wall_north'],
      wall_south: ['wall_south'],
      wall_east: ['wall_east'],
      wall_west: ['wall_west'],
    }
    const keys = mapping[area] || [area]
    keys.forEach((k) => this.setMeshMaterial(k, materialId))
  }

  public setMeshMaterial(key: string, materialId: string) {
    const entry = this.meshes.get(key)
    const preset = findMaterialById(materialId)
    if (!entry || !preset) return
    const mat = entry.mesh.material as THREE.MeshStandardMaterial

    const from = mat.color.clone()
    const to = new THREE.Color(preset.color)
    entry.targetColor = to
    entry.animateFrom = performance.now()
    entry.animateTo = performance.now() + 500
    ;(entry as MeshEntry & { _fromColor?: THREE.Color })._fromColor = from
    entry.targetRoughness = preset.roughness
    entry.targetMetalness = preset.metalness
    entry.roughnessFrom = mat.roughness
    entry.metalnessFrom = mat.metalness
    this.animating.add(key)

    if (key === 'floor' && preset.color) {
      if (this.floorTexture) {
        mat.map = this.floorTexture
        mat.needsUpdate = true
      }
    }
  }

  public setFloorTextureImage(imageUrl: string) {
    const loader = new THREE.TextureLoader()
    loader.load(imageUrl, (tex) => {
      tex.wrapS = THREE.RepeatWrapping
      tex.wrapT = THREE.RepeatWrapping
      tex.repeat.set(1, 1)
      tex.colorSpace = THREE.SRGBColorSpace
      this.floorTexture = tex
      const floorEntry = this.meshes.get('floor')
      if (floorEntry) {
        const mat = floorEntry.mesh.material as THREE.MeshStandardMaterial
        mat.map = tex
        mat.needsUpdate = true
      }
    })
  }

  public clearFloorTexture() {
    this.floorTexture = null
    const floorEntry = this.meshes.get('floor')
    if (floorEntry) {
      const mat = floorEntry.mesh.material as THREE.MeshStandardMaterial
      mat.map = null
      mat.needsUpdate = true
    }
  }

  public animateCameraTo(view: 'top' | 'firstPerson', rotateOffset = 0) {
    const endPos =
      view === 'top' ? SceneManager.topView.clone() : SceneManager.firstPersonView.clone()
    if (rotateOffset !== 0 && view === 'top') {
      const angle = (rotateOffset * Math.PI) / 180
      const radius = Math.sqrt(endPos.x * endPos.x + endPos.z * endPos.z)
      const currentAngle = Math.atan2(endPos.z, endPos.x)
      const newAngle = currentAngle + angle
      endPos.x = radius * Math.cos(newAngle)
      endPos.z = radius * Math.sin(newAngle)
    }
    this.cameraPosEnd.copy(endPos)
    this.cameraAnimStart = {
      pos: this.camera.position.clone(),
      t: performance.now(),
      duration: 1000,
    }
  }

  public resetCamera() {
    this.cameraPosEnd.copy(SceneManager.topView)
    this.cameraAnimStart = {
      pos: this.camera.position.clone(),
      t: performance.now(),
      duration: 1000,
    }
  }

  public rotateCamera(deg: number) {
    const angle = (deg * Math.PI) / 180
    const start = this.camera.position.clone()
    const radius = Math.sqrt(start.x * start.x + start.z * start.z)
    const currentAngle = Math.atan2(start.z, start.x)
    const newAngle = currentAngle + angle
    const endPos = start.clone()
    endPos.x = radius * Math.cos(newAngle)
    endPos.z = radius * Math.sin(newAngle)
    this.cameraPosEnd.copy(endPos)
    this.cameraAnimStart = {
      pos: start,
      t: performance.now(),
      duration: 1000,
    }
  }

  public pickArea(ndc: { x: number; y: number }): AreaId | null {
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(new THREE.Vector2(ndc.x, ndc.y), this.camera)
    const targets = Array.from(this.meshes.entries())
      .filter(([k]) => k.startsWith('floor') || k.startsWith('wall_'))
      .map(([, v]) => v.mesh)
    const hits = raycaster.intersectObjects(targets, false)
    if (hits.length === 0) return null
    const name = Array.from(this.meshes.entries()).find(([, v]) => v.mesh === hits[0].object)?.[0]
    if (!name) return null
    if (name === 'floor') return 'floor'
    if (name.startsWith('wall_')) return name as AreaId
    return null
  }

  public getHighlightMesh(area: AreaId): THREE.Mesh | null {
    const entry = this.meshes.get(area)
    return entry ? entry.mesh : null
  }

  public start() {
    const loop = () => {
      this.tick()
      this.animationFrameId = requestAnimationFrame(loop)
    }
    loop()
  }

  private tick() {
    const now = performance.now()
    this.frameCount++
    if (now - this.lastFpsTime >= 500) {
      const fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsTime))
      this.storeGet().setFps(fps)
      this.frameCount = 0
      this.lastFpsTime = now
    }

    if (this.cameraAnimStart) {
      const t = Math.min(1, (now - this.cameraAnimStart.t) / this.cameraAnimStart.duration)
      const e = easeInOut(t)
      this.camera.position.lerpVectors(this.cameraAnimStart.pos, this.cameraPosEnd, e)
      this.camera.lookAt(SceneManager.targetCenter)
      if (t >= 1) this.cameraAnimStart = null
    }

    if (this.animating.size > 0) {
      const toRemove: string[] = []
      this.animating.forEach((key) => {
        const entry = this.meshes.get(key) as MeshEntry & { _fromColor?: THREE.Color }
        if (!entry || entry.animateTo == null) return
        const t = Math.min(1, (now - (entry.animateFrom ?? now)) / 500)
        const e = easeInOut(t)
        const fromCol = entry._fromColor ?? entry.targetColor
        const mat = entry.mesh.material as THREE.MeshStandardMaterial
        mat.color.lerpColors(fromCol, entry.targetColor, e)
        if (entry.roughnessFrom != null) {
          mat.roughness = entry.roughnessFrom + (entry.targetRoughness - entry.roughnessFrom) * e
        }
        if (entry.metalnessFrom != null) {
          mat.metalness = entry.metalnessFrom + (entry.targetMetalness - entry.metalnessFrom) * e
        }
        if (t >= 1) {
          toRemove.push(key)
          entry.animateFrom = null
          entry.animateTo = null
          entry.roughnessFrom = null
          entry.metalnessFrom = null
          delete entry._fromColor
        }
      })
      toRemove.forEach((k) => this.animating.delete(k))
    }

    this.renderer.render(this.scene, this.camera)
  }

  public dispose() {
    if (this.animationFrameId != null) cancelAnimationFrame(this.animationFrameId)
    window.removeEventListener('resize', this.handleResize)
    this.meshes.forEach(({ mesh }) => {
      mesh.geometry.dispose()
      const mat = mesh.material as THREE.Material | THREE.Material[]
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
      else mat.dispose()
    })
    this.floorTexture?.dispose()
    this.renderer.dispose()
  }
}
