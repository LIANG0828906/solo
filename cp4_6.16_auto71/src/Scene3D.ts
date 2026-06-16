import * as THREE from 'three'
import { useVoxelStore, Voxel, BrushSize } from './VoxelStore'
import { animationController } from './AnimationController'

export interface HighlightInfo {
  x: number
  y: number
  z: number
  face: THREE.Vector3
  type: 'place' | 'remove' | 'hover'
}

export class Scene3D {
  public scene: THREE.Scene
  public camera: THREE.PerspectiveCamera
  public renderer: THREE.WebGLRenderer
  public raycaster: THREE.Raycaster
  public mouse: THREE.Vector2

  private container: HTMLElement
  private voxelMeshes: Map<string, THREE.Mesh> = new Map()
  private voxelAnimStates: Map<string, { scale: number; targetScale: number; appearTime: number }> = new Map()
  private removingVoxels: Map<string, { startTime: number; mesh: THREE.Mesh }> = new Map()

  private gridFloor: THREE.GridHelper | null = null
  private gridSize = 32
  private gridDivisions = 32

  private highlightMesh: THREE.Mesh | null = null
  private highlightActive = false
  private highlightInfo: HighlightInfo | null = null

  private axisHelperGroup: THREE.Group | null = null
  private draggingAxis: 'x' | 'y' | 'z' | null = null
  private axisDragStart: THREE.Vector3 | null = null
  private axisStartPosition: THREE.Vector3 = new THREE.Vector3(6, 0.5, 6)

  private targetCameraPos = new THREE.Vector3()
  private targetCameraTarget = new THREE.Vector3()
  private isDraggingCamera = false
  private isPanning = false
  private lastMousePos = { x: 0, y: 0 }
  private cameraAzimuth = Math.PI / 4
  private cameraPolar = Math.PI / 3.5
  private cameraDistance = 25
  private cameraTarget = new THREE.Vector3(0, 1, 0)

  private animationFrameId: number = 0
  private prevVoxelIds = new Set<string>()

  constructor(container: HTMLElement) {
    this.container = container
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x1a1a2e)

    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000)
    this.updateCameraPosition(false)

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(this.renderer.domElement)

    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()

    this.setupLights()
    this.setupGridFloor()
    this.setupHighlightMesh()
    this.setupAxisHelper()
    this.setupEventListeners()

    this.animate()
    this.subscribeStore()
    this.resize()
  }

  private setupLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.55)
    this.scene.add(ambient)

    const dir = new THREE.DirectionalLight(0xffffff, 0.9)
    dir.position.set(12, 20, 10)
    dir.castShadow = true
    dir.shadow.mapSize.set(2048, 2048)
    dir.shadow.camera.near = 0.5
    dir.shadow.camera.far = 100
    dir.shadow.camera.left = -25
    dir.shadow.camera.right = 25
    dir.shadow.camera.top = 25
    dir.shadow.camera.bottom = -25
    this.scene.add(dir)

    const fill = new THREE.DirectionalLight(0x8899ff, 0.35)
    fill.position.set(-8, 12, -6)
    this.scene.add(fill)
  }

  private setupGridFloor() {
    const gridGroup = new THREE.Group()

    const grid = new THREE.GridHelper(this.gridSize, this.gridDivisions, 0x3a3a5a, 0x2a2a40)
    grid.material.transparent = true
    grid.material.opacity = 0.6
    grid.position.y = 0
    gridGroup.add(grid)

    const planeGeo = new THREE.PlaneGeometry(this.gridSize, this.gridSize)
    const planeMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    })
    const plane = new THREE.Mesh(planeGeo, planeMat)
    plane.rotation.x = -Math.PI / 2
    plane.position.y = -0.01
    plane.receiveShadow = true
    plane.name = 'floor'
    gridGroup.add(plane)

    this.gridFloor = grid
    this.scene.add(gridGroup)
  }

  private setupHighlightMesh() {
    const geo = new THREE.BoxGeometry(1.04, 1.04, 1.04)
    const mat = new THREE.MeshBasicMaterial({
      color: 0x40a0ff,
      transparent: true,
      opacity: 0.35,
      wireframe: false,
      side: THREE.DoubleSide,
    })
    this.highlightMesh = new THREE.Mesh(geo, mat)
    this.highlightMesh.visible = false
    this.scene.add(this.highlightMesh)

    const edges = new THREE.EdgesGeometry(geo)
    const lineMat = new THREE.LineBasicMaterial({ color: 0x60c0ff, transparent: true, opacity: 0.9 })
    const lineSegments = new THREE.LineSegments(edges, lineMat)
    this.highlightMesh.add(lineSegments)
  }

  private setupAxisHelper() {
    this.axisHelperGroup = new THREE.Group()
    this.axisHelperGroup.position.copy(this.axisStartPosition)

    const createArrow = (dir: THREE.Vector3, color: number, name: string) => {
      const group = new THREE.Group()
      group.name = name

      const lineGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.6, 8)
      const lineMat = new THREE.MeshStandardMaterial({ color, metalness: 0.4, roughness: 0.3, emissive: color, emissiveIntensity: 0.3 })
      const line = new THREE.Mesh(lineGeo, lineMat)
      line.position.y = 0.8
      line.rotation.z = -Math.PI / 2
      if (name === 'y-axis') line.rotation.z = 0
      if (name === 'z-axis') { line.rotation.x = Math.PI / 2; line.rotation.y = 0 }
      group.add(line)

      const coneGeo = new THREE.ConeGeometry(0.18, 0.45, 12)
      const coneMat = new THREE.MeshStandardMaterial({ color, metalness: 0.4, roughness: 0.3, emissive: color, emissiveIntensity: 0.5 })
      const cone = new THREE.Mesh(coneGeo, coneMat)
      cone.position.y = 1.8
      cone.rotation.z = -Math.PI / 2
      if (name === 'y-axis') cone.rotation.z = 0
      if (name === 'z-axis') { cone.rotation.x = Math.PI / 2 }
      cone.name = 'cone'
      group.add(cone)

      if (name === 'x-axis') {
        group.rotation.y = -Math.PI / 2
      } else if (name === 'z-axis') {
        group.rotation.y = Math.PI
      }

      group.userData.axis = name === 'x-axis' ? 'x' : name === 'y-axis' ? 'y' : 'z'
      return group
    }

    this.axisHelperGroup.add(createArrow(new THREE.Vector3(1, 0, 0), 0xff4040, 'x-axis'))
    this.axisHelperGroup.add(createArrow(new THREE.Vector3(0, 1, 0), 0x40ff60, 'y-axis'))
    this.axisHelperGroup.add(createArrow(new THREE.Vector3(0, 0, 1), 0x4080ff, 'z-axis'))

    const sphereGeo = new THREE.SphereGeometry(0.15, 16, 16)
    const sphereMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5 })
    const sphere = new THREE.Mesh(sphereGeo, sphereMat)
    this.axisHelperGroup.add(sphere)

    this.scene.add(this.axisHelperGroup)
  }

  private setupEventListeners() {
    const canvas = this.renderer.domElement
    canvas.style.touchAction = 'none'

    canvas.addEventListener('pointerdown', this.onPointerDown)
    canvas.addEventListener('pointermove', this.onPointerMove)
    window.addEventListener('pointerup', this.onPointerUp)
    canvas.addEventListener('wheel', this.onWheel, { passive: false })
    canvas.addEventListener('contextmenu', (e) => e.preventDefault())
    window.addEventListener('resize', this.resize)
  }

  private onPointerDown = (e: PointerEvent) => {
    this.updateMouse(e)
    this.lastMousePos = { x: e.clientX, y: e.clientY }

    this.raycaster.setFromCamera(this.mouse, this.camera)

    if (this.axisHelperGroup) {
      const axisIntersects = this.raycaster.intersectObject(this.axisHelperGroup, true)
      if (axisIntersects.length > 0) {
        let obj = axisIntersects[0].object
        while (obj && !obj.userData.axis && obj.parent) obj = obj.parent
        if (obj && obj.userData.axis) {
          this.draggingAxis = obj.userData.axis as 'x' | 'y' | 'z'
          this.axisDragStart = new THREE.Vector3()
          this.axisHelperGroup.getWorldPosition(this.axisDragStart)
          ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
          return
        }
      }
    }

    if (e.button === 2) {
      this.isPanning = true
    } else if (e.button === 0) {
      this.isDraggingCamera = true
    }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  private onPointerMove = (e: PointerEvent) => {
    const store = useVoxelStore.getState()
    this.updateMouse(e)

    if (this.draggingAxis && this.axisHelperGroup && this.axisDragStart) {
      const movement = new THREE.Vector2(e.clientX - this.lastMousePos.x, e.clientY - this.lastMousePos.y)
      movement.multiplyScalar(0.03)
      if (this.draggingAxis === 'x') this.axisHelperGroup.position.x += movement.x
      if (this.draggingAxis === 'y') this.axisHelperGroup.position.y -= movement.y
      if (this.draggingAxis === 'z') this.axisHelperGroup.position.z += movement.x
      this.lastMousePos = { x: e.clientX, y: e.clientY }
      return
    }

    if (this.isDraggingCamera) {
      const dx = e.clientX - this.lastMousePos.x
      const dy = e.clientY - this.lastMousePos.y
      this.cameraAzimuth -= dx * 0.008
      this.cameraPolar = Math.max(0.15, Math.min(Math.PI / 2 - 0.1, this.cameraPolar - dy * 0.008))
      this.lastMousePos = { x: e.clientX, y: e.clientY }
      this.updateCameraPosition(true)
      return
    }

    if (this.isPanning) {
      const dx = e.clientX - this.lastMousePos.x
      const dy = e.clientY - this.lastMousePos.y
      const panSpeed = this.cameraDistance * 0.0015
      const right = new THREE.Vector3().crossVectors(this.camera.up, this.camera.getWorldDirection(new THREE.Vector3())).normalize()
      this.cameraTarget.addScaledVector(right, -dx * panSpeed)
      this.cameraTarget.y += dy * panSpeed
      this.lastMousePos = { x: e.clientX, y: e.clientY }
      this.updateCameraPosition(true)
      return
    }

    this.updateHover()
  }

  private onPointerUp = (e: PointerEvent) => {
    if (this.draggingAxis) {
      this.draggingAxis = null
      this.axisDragStart = null
    }
    this.isDraggingCamera = false
    this.isPanning = false
  }

  private onWheel = (e: WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY * 0.0015
    this.cameraDistance = Math.max(6, Math.min(60, this.cameraDistance * (1 + delta)))
    this.updateCameraPosition(true)
  }

  private updateMouse(e: PointerEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
  }

  private updateCameraPosition(animate: boolean) {
    const x = this.cameraTarget.x + this.cameraDistance * Math.sin(this.cameraPolar) * Math.cos(this.cameraAzimuth)
    const y = this.cameraTarget.y + this.cameraDistance * Math.cos(this.cameraPolar)
    const z = this.cameraTarget.z + this.cameraDistance * Math.sin(this.cameraPolar) * Math.sin(this.cameraAzimuth)
    if (animate) {
      this.targetCameraPos.set(x, y, z)
      this.targetCameraTarget.copy(this.cameraTarget)
    } else {
      this.camera.position.set(x, y, z)
      this.camera.lookAt(this.cameraTarget)
      this.targetCameraPos.set(x, y, z)
      this.targetCameraTarget.copy(this.cameraTarget)
    }
  }

  public getIntersection(): { voxel?: Voxel; position?: THREE.Vector3; normal?: THREE.Vector3; isFloor?: boolean } {
    this.raycaster.setFromCamera(this.mouse, this.camera)
    const meshes = Array.from(this.voxelMeshes.values())
    const voxelIntersects = this.raycaster.intersectObjects(meshes, false)

    if (voxelIntersects.length > 0) {
      const hit = voxelIntersects[0]
      const mesh = hit.object as THREE.Mesh
      const voxelId = mesh.userData.voxelId as string
      const voxel = useVoxelStore.getState().voxels.find(v => v.id === voxelId)
      const normal = hit.face?.normal.clone() || new THREE.Vector3()
      normal.transformDirection(mesh.matrixWorld)
      return { voxel, position: mesh.position.clone(), normal, isFloor: false }
    }

    const floor = this.scene.getObjectByName('floor')
    if (floor) {
      const floorIntersects = this.raycaster.intersectObject(floor, false)
      if (floorIntersects.length > 0) {
        const hit = floorIntersects[0]
        return { position: hit.point.clone(), isFloor: true, normal: new THREE.Vector3(0, 1, 0) }
      }
    }

    return {}
  }

  public updateHighlight(info: HighlightInfo | null) {
    if (!this.highlightMesh) return
    if (!info) {
      this.highlightMesh.visible = false
      this.highlightInfo = null
      return
    }
    this.highlightInfo = info
    this.highlightMesh.visible = true
    this.highlightMesh.position.set(info.x + 0.5, info.y + 0.5, info.z + 0.5)
    const mat = this.highlightMesh.material as THREE.MeshBasicMaterial
    if (info.type === 'remove') {
      mat.color.set(0xff4060)
    } else if (info.type === 'place') {
      mat.color.set(0x40ffa0)
    } else {
      mat.color.set(0x40a0ff)
    }
  }

  public getBrushPositions(cx: number, cy: number, cz: number, size: BrushSize): Array<{ x: number; y: number; z: number }> {
    const positions: Array<{ x: number; y: number; z: number }> = []
    const s = size
    const half = Math.floor(s / 2)
    for (let dx = -half; dx <= half; dx++) {
      for (let dz = -half; dz <= half; dz++) {
        for (let dy = 0; dy < s; dy++) {
          positions.push({ x: cx + dx, y: cy + dy, z: cz + dz })
        }
      }
    }
    return positions
  }

  private createVoxelMesh(voxel: Voxel): THREE.Mesh {
    const geo = new THREE.BoxGeometry(0.96, 0.96, 0.96)
    const mat = new THREE.MeshStandardMaterial({
      color: voxel.color,
      roughness: 0.85,
      metalness: 0.05,
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(voxel.x + 0.5, voxel.y + 0.5, voxel.z + 0.5)
    mesh.userData.voxelId = voxel.id
    mesh.castShadow = true
    mesh.receiveShadow = true

    const edges = new THREE.EdgesGeometry(geo)
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x0a0a12, transparent: true, opacity: 0.85 })
    const lineSegments = new THREE.LineSegments(edges, edgeMat)
    mesh.add(lineSegments)

    return mesh
  }

  private subscribeStore() {
    useVoxelStore.subscribe((state, prevState) => {
      if (state.voxels !== prevState.voxels) {
        this.syncVoxels(state.voxels, prevState.voxels)
      }
    })
  }

  private syncVoxels(newVoxels: Voxel[], oldVoxels: Voxel[]) {
    const newIds = new Set(newVoxels.map(v => v.id))
    const oldMap = new Map(oldVoxels.map(v => [v.id, v]))
    const newMap = new Map(newVoxels.map(v => [v.id, v]))

    for (const id of this.prevVoxelIds) {
      if (!newIds.has(id)) {
        const mesh = this.voxelMeshes.get(id)
        if (mesh) {
          this.removingVoxels.set(id, { startTime: performance.now(), mesh })
          this.voxelMeshes.delete(id)
        }
      }
    }

    for (const voxel of newVoxels) {
      const mesh = this.voxelMeshes.get(voxel.id)
      if (!mesh) {
        const m = this.createVoxelMesh(voxel)
        m.scale.setScalar(0.001)
        this.scene.add(m)
        this.voxelMeshes.set(voxel.id, m)
        this.voxelAnimStates.set(voxel.id, { scale: 0, targetScale: 1, appearTime: performance.now() })
      } else {
        const mat = mesh.material as THREE.MeshStandardMaterial
        if (mat.color.getHexString() !== voxel.color.replace('#', '')) {
          mat.color.set(voxel.color)
        }
      }
    }

    for (const [id, old] of oldMap) {
      const nw = newMap.get(id)
      if (nw && (old.x !== nw.x || old.y !== nw.y || old.z !== nw.z)) {
        const mesh = this.voxelMeshes.get(id)
        if (mesh) mesh.position.set(nw.x + 0.5, nw.y + 0.5, nw.z + 0.5)
      }
    }

    this.prevVoxelIds = newIds
  }

  private resize = () => {
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    if (w === 0 || h === 0) return
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h, false)
  }

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate)
    const now = performance.now()

    animationController.update(1 / 60)

    const lerpFactor = 0.12
    this.camera.position.lerp(this.targetCameraPos, lerpFactor)
    const lookTarget = new THREE.Vector3().copy(this.cameraTarget).lerp(this.targetCameraTarget, lerpFactor)
    this.camera.lookAt(lookTarget)

    const store = useVoxelStore.getState()
    const { selectedVoxel } = store

    for (const [id, mesh] of this.voxelMeshes) {
      const voxel = store.voxels.find(v => v.id === id)
      if (!voxel) continue

      const animState = this.voxelAnimStates.get(id)
      let finalScale = 1

      if (animState) {
        const elapsed = (now - animState.appearTime) / 1000
        const t = Math.min(elapsed / 0.25, 1)
        const eased = 1 - Math.pow(1 - t, 3)
        animState.scale = eased
        if (t >= 1) this.voxelAnimStates.delete(id)
        finalScale = animState.scale
      }

      if (store.animation.isPlaying) {
        const animPos = animationController.getVoxelPosition(voxel)
        const animScale = animationController.getVoxelScale(voxel)
        const animColor = animationController.getVoxelColor(voxel)
        mesh.position.lerp(new THREE.Vector3(animPos.x + 0.5, animPos.y + 0.5, animPos.z + 0.5), 0.3)
        finalScale *= animScale
        const mat = mesh.material as THREE.MeshStandardMaterial
        mat.color.set(animColor)
      } else {
        const basePos = new THREE.Vector3(voxel.x + 0.5, voxel.y + 0.5, voxel.z + 0.5)
        mesh.position.lerp(basePos, 0.25)
        const mat = mesh.material as THREE.MeshStandardMaterial
        if (mat.color.getHexString() !== voxel.color.replace('#', '')) {
          mat.color.lerp(new THREE.Color(voxel.color), 0.2)
        }
      }

      if (id === selectedVoxel) {
        finalScale *= 1.08
      }

      mesh.scale.setScalar(finalScale)
    }

    for (const [id, info] of this.removingVoxels) {
      const elapsed = (now - info.startTime) / 1000
      const t = Math.min(elapsed / 0.2, 1)
      const eased = 1 - t
      info.mesh.scale.setScalar(eased * eased * 0.96)
      info.mesh.position.y -= t * t * 0.3
      const mat = info.mesh.material as THREE.MeshStandardMaterial
      mat.transparent = true
      mat.opacity = 1 - t
      if (t >= 1) {
        this.scene.remove(info.mesh)
        info.mesh.geometry.dispose()
        if (Array.isArray(mat)) mat.forEach(m => m.dispose())
        else mat.dispose()
        this.removingVoxels.delete(id)
      }
    }

    this.renderer.render(this.scene, this.camera)
  }

  public destroy() {
    cancelAnimationFrame(this.animationFrameId)
    window.removeEventListener('resize', this.resize)
    window.removeEventListener('pointerup', this.onPointerUp)
    const canvas = this.renderer.domElement
    canvas.removeEventListener('pointerdown', this.onPointerDown)
    canvas.removeEventListener('pointermove', this.onPointerMove)
    canvas.removeEventListener('wheel', this.onWheel)
    this.renderer.dispose()
    if (canvas.parentElement) canvas.parentElement.removeChild(canvas)
  }
}
