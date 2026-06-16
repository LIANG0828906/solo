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

export type CameraDragMode = 'none' | 'rotate' | 'pan' | 'axis'

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
  private appearingVoxels: Set<string> = new Set()

  private gridFloor: THREE.GridHelper | null = null
  private gridSize = 32
  private gridDivisions = 32

  private highlightMesh: THREE.Mesh | null = null
  private highlightInfo: HighlightInfo | null = null

  private axisHelperGroup: THREE.Group | null = null
  public draggingAxis: 'x' | 'y' | 'z' | null = null
  private axisDragStart: THREE.Vector3 | null = null
  private axisStartPosition: THREE.Vector3 = new THREE.Vector3(6, 0.5, 6)

  private targetCameraPos = new THREE.Vector3()
  private targetCameraTarget = new THREE.Vector3()
  private cameraAzimuth = Math.PI / 4
  private cameraPolar = Math.PI / 3.5
  private cameraDistance = 25
  private cameraTarget = new THREE.Vector3(0, 1, 0)

  private animationFrameId: number = 0
  private prevVoxelIds = new Set<string>()
  private lerpFactor = 0.12

  private instancedMesh: THREE.InstancedMesh | null = null
  private instancedMaterial: THREE.ShaderMaterial | null = null
  private dummy = new THREE.Object3D()
  private instanceColors: Float32Array | null = null
  private instanceBasePositions: Float32Array | null = null
  private useInstanced = true
  private dirtyInstances = true

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
    this.setupGlobalEvents()

    this.subscribeStore()
    this.resize()
    this.animate()
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

    const createArrow = (color: number, axis: 'x' | 'y' | 'z') => {
      const group = new THREE.Group()
      const dir = new THREE.Vector3(axis === 'x' ? 1 : 0, axis === 'y' ? 1 : 0, axis === 'z' ? 1 : 0)
      const arrowHelper = new THREE.ArrowHelper(dir, new THREE.Vector3(), 1.8, color, 0.45, 0.2)
      group.add(arrowHelper)
      group.userData.axis = axis
      return group
    }

    this.axisHelperGroup.add(createArrow(0xff4040, 'x'))
    this.axisHelperGroup.add(createArrow(0x40ff60, 'y'))
    this.axisHelperGroup.add(createArrow(0x4080ff, 'z'))

    const sphereGeo = new THREE.SphereGeometry(0.15, 16, 16)
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5,
    })
    const sphere = new THREE.Mesh(sphereGeo, sphereMat)
    this.axisHelperGroup.add(sphere)

    this.scene.add(this.axisHelperGroup)
  }

  private setupGlobalEvents() {
    const canvas = this.renderer.domElement
    canvas.style.touchAction = 'none'
    canvas.addEventListener('contextmenu', (e) => e.preventDefault())
    window.addEventListener('resize', this.resize)
  }

  public updateMouse(clientX: number, clientY: number) {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1
  }

  public getAxisIntersection(): 'x' | 'y' | 'z' | null {
    if (!this.axisHelperGroup) return null
    this.raycaster.setFromCamera(this.mouse, this.camera)
    const intersects = this.raycaster.intersectObject(this.axisHelperGroup, true)
    if (intersects.length > 0) {
      let obj: THREE.Object3D | null = intersects[0].object
      while (obj && !obj.userData.axis && obj.parent) obj = obj.parent
      if (obj && obj.userData.axis) return obj.userData.axis as 'x' | 'y' | 'z'
    }
    return null
  }

  public startAxisDrag(axis: 'x' | 'y' | 'z') {
    this.draggingAxis = axis
    this.axisDragStart = new THREE.Vector3()
    this.axisHelperGroup?.getWorldPosition(this.axisDragStart)
  }

  public updateAxisDrag(dx: number, dy: number) {
    if (!this.axisHelperGroup || !this.draggingAxis) return
    const sensitivity = 0.04
    if (this.draggingAxis === 'x') this.axisHelperGroup.position.x += dx * sensitivity
    if (this.draggingAxis === 'y') this.axisHelperGroup.position.y -= dy * sensitivity
    if (this.draggingAxis === 'z') this.axisHelperGroup.position.z += dx * sensitivity
  }

  public endAxisDrag() {
    this.draggingAxis = null
    this.axisDragStart = null
  }

  public startCameraRotate() {}
  public startCameraPan() {}

  public updateCameraRotate(dx: number, dy: number) {
    this.cameraAzimuth -= dx * 0.008
    this.cameraPolar = Math.max(0.15, Math.min(Math.PI / 2 - 0.1, this.cameraPolar - dy * 0.008))
    this.updateCameraPosition(true)
  }

  public updateCameraPan(dx: number, dy: number) {
    const panSpeed = this.cameraDistance * 0.0015
    const right = new THREE.Vector3()
      .crossVectors(this.camera.up, this.camera.getWorldDirection(new THREE.Vector3()))
      .normalize()
    this.cameraTarget.addScaledVector(right, -dx * panSpeed)
    this.cameraTarget.y += dy * panSpeed
    this.updateCameraPosition(true)
  }

  public zoomCamera(delta: number) {
    this.cameraDistance = Math.max(6, Math.min(60, this.cameraDistance * (1 + delta * 0.0015)))
    this.updateCameraPosition(true)
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

  public getIntersection(): { voxelId?: string; position?: THREE.Vector3; normal?: THREE.Vector3; isFloor?: boolean } {
    this.raycaster.setFromCamera(this.mouse, this.camera)

    if (this.instancedMesh && this.useInstanced) {
      const hits = this.raycaster.intersectObject(this.instancedMesh, false)
      if (hits.length > 0 && hits[0].instanceId !== undefined) {
        const hit = hits[0]
        const instanceId = hit.instanceId
        const voxelId = this.getInstanceVoxelId(instanceId)
        if (voxelId) {
          const normal = hit.face?.normal.clone() || new THREE.Vector3()
          normal.transformDirection(this.instancedMesh.matrixWorld)
          const pos = this.getInstancePosition(instanceId)
          return { voxelId, position: pos, normal, isFloor: false }
        }
      }
    }

    const meshes = Array.from(this.voxelMeshes.values())
    const voxelIntersects = this.raycaster.intersectObjects(meshes, false)
    if (voxelIntersects.length > 0) {
      const hit = voxelIntersects[0]
      const mesh = hit.object as THREE.Mesh
      const voxelId = mesh.userData.voxelId as string
      const normal = hit.face?.normal.clone() || new THREE.Vector3()
      normal.transformDirection(mesh.matrixWorld)
      return { voxelId, position: mesh.position.clone(), normal, isFloor: false }
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

  private instanceIdToVoxelId: Map<number, string> = new Map()
  private voxelIdToInstanceId: Map<string, number> = new Map()

  private getInstanceVoxelId(instanceId: number): string | undefined {
    return this.instanceIdToVoxelId.get(instanceId)
  }

  private getInstancePosition(instanceId: number): THREE.Vector3 {
    if (!this.instanceBasePositions) return new THREE.Vector3()
    const idx = instanceId * 3
    return new THREE.Vector3(
      this.instanceBasePositions[idx] + 0.5,
      this.instanceBasePositions[idx + 1] + 0.5,
      this.instanceBasePositions[idx + 2] + 0.5
    )
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
      color: voxel.color, roughness: 0.85, metalness: 0.05,
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(voxel.x + 0.5, voxel.y + 0.5, voxel.z + 0.5)
    mesh.userData.voxelId = voxel.id
    mesh.castShadow = true
    mesh.receiveShadow = true

    const edges = new THREE.EdgesGeometry(geo)
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x0a0a12, transparent: true, opacity: 0.85 })
    mesh.add(new THREE.LineSegments(edges, edgeMat))

    return mesh
  }

  private setupInstancedMesh(count: number) {
    if (this.instancedMesh) {
      this.scene.remove(this.instancedMesh)
      this.instancedMesh.geometry.dispose()
      ;(this.instancedMesh.material as THREE.Material).dispose()
      this.instancedMesh = null
    }

    if (count === 0) return

    const geo = new THREE.BoxGeometry(0.96, 0.96, 0.96)

    const vertexShader = `
      uniform float uTime;
      uniform int uAnimType;
      uniform float uAnimSpeed;

      attribute vec3 aBasePos;
      attribute vec3 aColor;
      attribute float aAnimOffset;

      varying vec3 vColor;
      varying vec3 vNormal;
      varying vec3 vWorldPos;

      vec3 hsl2rgb(vec3 c) {
        vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0);
        return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
      }

      void main() {
        vColor = aColor;
        vNormal = normalMatrix * normal;

        vec3 pos = position + aBasePos;
        float time = uTime * uAnimSpeed;
        float offset = aAnimOffset;

        if (uAnimType == 1) {
          float hue = mod(time * 30.0 + (aBasePos.x + aBasePos.y + aBasePos.z) * 5.0, 360.0);
          vColor = hsl2rgb(vec3(hue / 360.0, 0.7, 0.6));
          float bounce = sin(time * 2.0 + offset) * 0.1;
          pos.y += bounce;
        } else if (uAnimType == 2) {
          float bounce = sin(time * 3.0 + offset) * 0.5;
          float scale = 1.0 + sin(time * 4.0 + offset) * 0.15;
          pos += (position) * (scale - 1.0);
          pos.y += bounce;
          float hue = (sin(time * 2.0 + offset) * 0.5 + 0.5) * 360.0;
          vColor = hsl2rgb(vec3(hue / 360.0, 0.75, 0.6));
        } else if (uAnimType == 3) {
          float dist = sqrt(aBasePos.x * aBasePos.x + aBasePos.z * aBasePos.z);
          float wave = sin(time * 2.5 - dist * 0.4) * 0.8;
          float scale = 1.0 + wave * 0.1;
          pos += position * (scale - 1.0);
          pos.y += wave;
          float hue = mod(dist * 15.0 + time * 40.0, 360.0);
          vColor = hsl2rgb(vec3(hue / 360.0, 0.7, 0.55));
        }

        vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
        vWorldPos = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `

    const fragmentShader = `
      uniform vec3 uLightDir;
      uniform vec3 uAmbient;
      uniform vec3 uDiffuse;

      varying vec3 vColor;
      varying vec3 vNormal;
      varying vec3 vWorldPos;

      void main() {
        vec3 normal = normalize(vNormal);
        vec3 lightDir = normalize(uLightDir);

        float diff = max(dot(normal, lightDir), 0.0);
        vec3 ambient = uAmbient * vColor;
        vec3 diffuse = uDiffuse * diff * vColor;

        vec3 color = ambient + diffuse;
        gl_FragColor = vec4(color, 1.0);
      }
    `

    this.instancedMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uAnimType: { value: 0 },
        uAnimSpeed: { value: 1 },
        uLightDir: { value: new THREE.Vector3(0.6, 1, 0.5).normalize() },
        uAmbient: { value: new THREE.Vector3(0.55, 0.55, 0.6) },
        uDiffuse: { value: new THREE.Vector3(0.9, 0.9, 0.95) },
      },
    })

    this.instancedMesh = new THREE.InstancedMesh(geo, this.instancedMaterial, count)
    this.instancedMesh.castShadow = true
    this.instancedMesh.receiveShadow = true
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)

    this.instanceBasePositions = new Float32Array(count * 3)
    this.instanceColors = new Float32Array(count * 3)
    const animOffsets = new Float32Array(count)

    this.instancedMesh.geometry.setAttribute(
      'aBasePos',
      new THREE.InstancedBufferAttribute(this.instanceBasePositions, 3)
    )
    this.instancedMesh.geometry.setAttribute(
      'aColor',
      new THREE.InstancedBufferAttribute(this.instanceColors, 3)
    )
    this.instancedMesh.geometry.setAttribute(
      'aAnimOffset',
      new THREE.InstancedBufferAttribute(animOffsets, 1)
    )

    this.scene.add(this.instancedMesh)
    this.dirtyInstances = true
  }

  private updateInstancedMesh(voxels: Voxel[]) {
    const count = voxels.length
    if (count === 0) {
      if (this.instancedMesh) {
        this.scene.remove(this.instancedMesh)
        this.instancedMesh.geometry.dispose()
        this.instancedMaterial?.dispose()
        this.instancedMesh = null
        this.instancedMaterial = null
      }
      return
    }

    if (!this.instancedMesh || this.instancedMesh.count !== count) {
      this.setupInstancedMesh(count)
    }
    if (!this.instancedMesh || !this.instanceBasePositions || !this.instanceColors) return

    const color = new THREE.Color()
    this.instanceIdToVoxelId.clear()
    this.voxelIdToInstanceId.clear()

    for (let i = 0; i < count; i++) {
      const v = voxels[i]
      this.instanceIdToVoxelId.set(i, v.id)
      this.voxelIdToInstanceId.set(v.id, i)

      const basePosAttr = this.instancedMesh.geometry.getAttribute('aBasePos') as THREE.InstancedBufferAttribute
      basePosAttr.setXYZ(i, v.x + 0.5, v.y + 0.5, v.z + 0.5)

      color.set(v.color)
      const colorAttr = this.instancedMesh.geometry.getAttribute('aColor') as THREE.InstancedBufferAttribute
      colorAttr.setXYZ(i, color.r, color.g, color.b)

      const offsetAttr = this.instancedMesh.geometry.getAttribute('aAnimOffset') as THREE.InstancedBufferAttribute
      offsetAttr.setX(i, v.animOffset || 0)

      this.dummy.position.set(v.x + 0.5, v.y + 0.5, v.z + 0.5)
      this.dummy.scale.setScalar(1)
      this.dummy.rotation.set(0, 0, 0)
      this.dummy.updateMatrix()
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix)
    }

    const basePosAttr = this.instancedMesh.geometry.getAttribute('aBasePos') as THREE.InstancedBufferAttribute
    basePosAttr.needsUpdate = true
    const colorAttr = this.instancedMesh.geometry.getAttribute('aColor') as THREE.InstancedBufferAttribute
    colorAttr.needsUpdate = true
    const offsetAttr = this.instancedMesh.geometry.getAttribute('aAnimOffset') as THREE.InstancedBufferAttribute
    offsetAttr.needsUpdate = true

    this.instancedMesh.instanceMatrix.needsUpdate = true
    this.dirtyInstances = false
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
        m.visible = !this.useInstanced
        this.scene.add(m)
        this.voxelMeshes.set(voxel.id, m)
        this.voxelAnimStates.set(voxel.id, {
          scale: 0, targetScale: 1, appearTime: performance.now(),
        })
        this.appearingVoxels.add(voxel.id)
      } else {
        const mat = mesh.material as THREE.MeshStandardMaterial
        if (mat.color.getHexString() !== voxel.color.replace('#', '')) {
          mat.color.set(voxel.color)
        }
      }
    }

    if (this.useInstanced) {
      this.updateInstancedMesh(newVoxels)
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

    const lerp = this.lerpFactor
    this.camera.position.lerp(this.targetCameraPos, lerp)
    const lookTarget = new THREE.Vector3().copy(this.cameraTarget).lerp(this.targetCameraTarget, lerp)
    this.camera.lookAt(lookTarget)

    const store = useVoxelStore.getState()
    const { selectedVoxel, animation } = store
    const animTime = animationController.getTime()

    if (this.instancedMaterial && this.useInstanced) {
      this.instancedMaterial.uniforms.uTime.value = animTime
      this.instancedMaterial.uniforms.uAnimSpeed.value = animation.speed
      this.instancedMaterial.uniforms.uAnimType.value = animation.isPlaying
        ? animation.type === 'rotate' ? 1 : animation.type === 'bounce' ? 2 : 3
        : 0
    }

    for (const [id, mesh] of this.voxelMeshes) {
      const voxel = store.voxels.find(v => v.id === id)
      if (!voxel) continue

      const animState = this.voxelAnimStates.get(id)
      let finalScale = 1

      if (animState) {
        const elapsed = (now - animState.appearTime) / 1000
        const t = Math.min(elapsed / 0.3, 1)
        const eased = 1 - Math.pow(1 - t, 3)
        animState.scale = eased
        if (t >= 1) {
          this.voxelAnimStates.delete(id)
          this.appearingVoxels.delete(id)
        }
        finalScale = animState.scale
      }

      if (id === selectedVoxel) {
        finalScale *= 1.08
      }

      mesh.scale.setScalar(finalScale)

      if (this.useInstanced) {
        mesh.visible = this.appearingVoxels.has(id) || this.removingVoxels.has(id)
      }
    }

    for (const [id, info] of this.removingVoxels) {
      const elapsed = (now - info.startTime) / 1000
      const t = Math.min(elapsed / 0.25, 1)
      const easedOut = 1 - Math.pow(1 - t, 4)
      const scale = Math.max(0, 1 - easedOut)
      info.mesh.scale.setScalar(scale * 0.96)
      info.mesh.position.y -= t * 0.4

      const mat = info.mesh.material as THREE.MeshStandardMaterial
      mat.transparent = true
      mat.opacity = Math.max(0, 1 - t)

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

  public setLerpFactor(factor: number) {
    this.lerpFactor = factor
  }

  public destroy() {
    cancelAnimationFrame(this.animationFrameId)
    window.removeEventListener('resize', this.resize)
    this.renderer.dispose()
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement)
    }
  }
}
