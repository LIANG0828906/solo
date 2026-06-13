import * as THREE from 'three'
import type { WallMaterial, LightPreset, FrameColor, PaintingData } from '@/types'

const WALL_WIDTH = 12
const WALL_HEIGHT = 6
const WALL_DEPTH = 0.2
const MIN_SCALE = 0.5
const MAX_SCALE = 2.5
const SCALE_STEP = 0.1
const MIN_ROTATION = -Math.PI / 4
const MAX_ROTATION = Math.PI / 4
const MIN_CAMERA_DISTANCE = 3
const MAX_CAMERA_DISTANCE = 15
const SNAP_THRESHOLD = 0.05
const PULSE_DURATION = 300
const MATERIAL_TRANSITION_DURATION = 1000

interface ScenePainting {
  id: string
  group: THREE.Group
  frameMesh: THREE.Mesh
  canvasMesh: THREE.Mesh
  pulseMesh: THREE.Mesh
  baseHeight: number
  baseWidth: number
  frameColor: FrameColor
  aspectRatio: number
}

interface PaintingUpdateCallback {
  (id: string, updates: Partial<Pick<PaintingData, 'position' | 'scale' | 'rotationY'>>): void
}

class SceneManager {
  private container: HTMLElement
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private wallMesh!: THREE.Mesh
  private wallMaterials: Record<WallMaterial, THREE.MeshStandardMaterial> = {} as Record<WallMaterial, THREE.MeshStandardMaterial>
  private currentWallMaterial: WallMaterial = 'white'
  private targetWallMaterial: WallMaterial = 'white'
  private materialTransitionStart = 0
  private isTransitioningMaterial = false
  private groundMesh!: THREE.Mesh
  private ambientLight!: THREE.AmbientLight
  private directionalLight!: THREE.DirectionalLight
  private spotLight!: THREE.SpotLight
  private hemisphereLight!: THREE.HemisphereLight
  private currentLightPreset: LightPreset = 'natural'
  private paintings: Map<string, ScenePainting> = new Map()
  private raycaster = new THREE.Raycaster()
  private mouse = new THREE.Vector2()
  private isDragging = false
  private isRotating = false
  private isPanning = false
  private draggedPainting: ScenePainting | null = null
  private dragOffset = new THREE.Vector3()
  private lastMousePos = { x: 0, y: 0 }
  private cameraDistance = 6
  private cameraAngleX = 0
  private cameraAngleY = 0.3
  private cameraTarget = new THREE.Vector3(0, 1.5, 0)
  private initialCameraDistance = 6
  private initialCameraAngleX = 0
  private initialCameraAngleY = 0.3
  private initialCameraTarget = new THREE.Vector3(0, 1.5, 0)
  private animationId: number | null = null
  private onPaintingUpdate: PaintingUpdateCallback | null = null
  private pulseAnimations: Map<string, { startTime: number }> = new Map()

  constructor(container: HTMLElement, onPaintingUpdate?: PaintingUpdateCallback) {
    this.container = container
    this.onPaintingUpdate = onPaintingUpdate || null

    this.scene = new THREE.Scene()
    this.setupSkyBackground()

    this.camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    )
    this.updateCameraPosition()

    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    container.appendChild(this.renderer.domElement)

    this.createWall()
    this.createGround()
    this.createLights()
    this.setupEventListeners()
    this.animate()
  }

  private setupSkyBackground() {
    const canvas = document.createElement('canvas')
    canvas.width = 2
    canvas.height = 256
    const ctx = canvas.getContext('2d')!
    const gradient = ctx.createLinearGradient(0, 0, 0, 256)
    gradient.addColorStop(0, '#87CEEB')
    gradient.addColorStop(1, '#FFFFFF')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 2, 256)
    const texture = new THREE.CanvasTexture(canvas)
    this.scene.background = texture
  }

  private createWall() {
    const wallGeometry = new THREE.BoxGeometry(WALL_WIDTH, WALL_HEIGHT, WALL_DEPTH)
    this.wallMaterials = {
      white: new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.8, metalness: 0.1 }),
      brick: this.createBrickMaterial(),
      wood: this.createWoodMaterial(),
      marble: this.createMarbleMaterial(),
    }
    this.wallMesh = new THREE.Mesh(wallGeometry, this.wallMaterials.white)
    this.wallMesh.position.set(0, WALL_HEIGHT / 2, -WALL_DEPTH / 2)
    this.wallMesh.receiveShadow = true
    this.scene.add(this.wallMesh)
  }

  private createBrickMaterial(): THREE.MeshStandardMaterial {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#8B4513'
    ctx.fillRect(0, 0, 512, 512)
    ctx.fillStyle = '#A0522D'
    const brickW = 64
    const brickH = 32
    for (let y = 0; y < 512; y += brickH) {
      const offset = (y / brickH) % 2 === 0 ? 0 : brickW / 2
      for (let x = -brickW; x < 512 + brickW; x += brickW) {
        ctx.fillRect(x + offset + 2, y + 2, brickW - 4, brickH - 4)
      }
    }
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(4, 2)
    return new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9, metalness: 0.05 })
  }

  private createWoodMaterial(): THREE.MeshStandardMaterial {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#D2B48C'
    ctx.fillRect(0, 0, 512, 512)
    for (let i = 0; i < 80; i++) {
      ctx.strokeStyle = `rgba(139, 90, 43, ${Math.random() * 0.4 + 0.1})`
      ctx.lineWidth = Math.random() * 3 + 1
      ctx.beginPath()
      const y = Math.random() * 512
      ctx.moveTo(0, y)
      ctx.bezierCurveTo(128, y + (Math.random() - 0.5) * 20, 384, y + (Math.random() - 0.5) * 20, 512, y + (Math.random() - 0.5) * 10)
      ctx.stroke()
    }
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(3, 2)
    return new THREE.MeshStandardMaterial({ map: texture, roughness: 0.7, metalness: 0.05 })
  }

  private createMarbleMaterial(): THREE.MeshStandardMaterial {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#F0EDE8'
    ctx.fillRect(0, 0, 512, 512)
    for (let i = 0; i < 30; i++) {
      ctx.strokeStyle = `rgba(180, 180, 190, ${Math.random() * 0.5 + 0.2})`
      ctx.lineWidth = Math.random() * 2 + 0.5
      ctx.beginPath()
      ctx.moveTo(Math.random() * 512, 0)
      for (let y = 0; y < 512; y += 20) {
        ctx.lineTo(ctx.currentPath ? 0 : Math.random() * 512, y)
      }
      ctx.stroke()
    }
    for (let i = 0; i < 50; i++) {
      ctx.strokeStyle = `rgba(200, 200, 210, ${Math.random() * 0.3})`
      ctx.lineWidth = Math.random()
      ctx.beginPath()
      const startX = Math.random() * 512
      const startY = Math.random() * 512
      ctx.moveTo(startX, startY)
      ctx.quadraticCurveTo(startX + (Math.random() - 0.5) * 200, startY + (Math.random() - 0.5) * 200, startX + (Math.random() - 0.5) * 300, startY + (Math.random() - 0.5) * 300)
      ctx.stroke()
    }
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(2, 2)
    return new THREE.MeshStandardMaterial({ map: texture, roughness: 0.3, metalness: 0.2 })
  }

  private createGround() {
    const groundGeometry = new THREE.PlaneGeometry(30, 30)
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#E8E8E8'
    ctx.fillRect(0, 0, 512, 512)
    ctx.strokeStyle = '#CCCCCC'
    ctx.lineWidth = 1
    const gridSize = 32
    for (let i = 0; i <= 512; i += gridSize) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, 512)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(512, i)
      ctx.stroke()
    }
    const groundTexture = new THREE.CanvasTexture(canvas)
    groundTexture.wrapS = THREE.RepeatWrapping
    groundTexture.wrapT = THREE.RepeatWrapping
    groundTexture.repeat.set(10, 10)
    const groundMaterial = new THREE.MeshStandardMaterial({ map: groundTexture, roughness: 0.9 })
    this.groundMesh = new THREE.Mesh(groundGeometry, groundMaterial)
    this.groundMesh.rotation.x = -Math.PI / 2
    this.groundMesh.position.y = 0
    this.groundMesh.receiveShadow = true
    this.scene.add(this.groundMesh)
  }

  private createLights() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    this.scene.add(this.ambientLight)

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    this.directionalLight.position.set(5, 8, 5)
    this.directionalLight.castShadow = true
    this.directionalLight.shadow.mapSize.width = 2048
    this.directionalLight.shadow.mapSize.height = 2048
    this.directionalLight.shadow.camera.left = -10
    this.directionalLight.shadow.camera.right = 10
    this.directionalLight.shadow.camera.top = 10
    this.directionalLight.shadow.camera.bottom = -10
    this.scene.add(this.directionalLight)

    this.hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x8B7355, 0.3)
    this.scene.add(this.hemisphereLight)

    this.spotLight = new THREE.SpotLight(0xffffff, 0)
    this.spotLight.castShadow = true
    this.spotLight.angle = Math.PI / 4
    this.spotLight.penumbra = 0.3
    this.spotLight.decay = 1.5
    this.spotLight.distance = 30
    this.scene.add(this.spotLight)
    this.scene.add(this.spotLight.target)
    this.setLightPreset('natural')
  }

  private kelvinToRGB(kelvin: number): number {
    const temp = kelvin / 100
    let red: number, green: number, blue: number
    if (temp <= 66) {
      red = 255
      green = Math.min(255, Math.max(0, 99.4708025861 * Math.log(temp) - 161.1195681661))
    } else {
      red = Math.min(255, Math.max(0, 329.698727446 * Math.pow(temp - 60, -0.1332047592)))
      green = Math.min(255, Math.max(0, 288.1221695283 * Math.pow(temp - 60, -0.0755148492)))
    }
    blue = temp >= 66 ? 255 : (temp <= 19 ? 0 : Math.min(255, Math.max(0, 138.5177312231 * Math.log(temp - 10) - 305.0447927307)))
    return (Math.round(red) << 16) | (Math.round(green) << 8) | Math.round(blue)
  }

  setLightPreset(preset: LightPreset) {
    this.currentLightPreset = preset
    switch (preset) {
      case 'warm':
        this.ambientLight.color.setHex(this.kelvinToRGB(3500))
        this.ambientLight.intensity = 0.5
        this.directionalLight.color.setHex(this.kelvinToRGB(3500))
        this.directionalLight.intensity = 1.2
        this.directionalLight.position.set(5, 8, 5)
        this.directionalLight.target.position.set(0, 2, 0)
        this.hemisphereLight.color.setHex(this.kelvinToRGB(3500))
        this.hemisphereLight.groundColor.setHex(0x8B7355)
        this.hemisphereLight.intensity = 0.3
        this.spotLight.intensity = 0
        break
      case 'cool':
        this.ambientLight.color.setHex(this.kelvinToRGB(6500))
        this.ambientLight.intensity = 0.5
        this.directionalLight.color.setHex(this.kelvinToRGB(6500))
        this.directionalLight.intensity = 1.0
        this.directionalLight.position.set(5, 8, 5)
        this.directionalLight.target.position.set(0, 2, 0)
        this.hemisphereLight.color.setHex(this.kelvinToRGB(6500))
        this.hemisphereLight.groundColor.setHex(0x6B6B6B)
        this.hemisphereLight.intensity = 0.3
        this.spotLight.intensity = 0
        break
      case 'spot':
        this.ambientLight.color.setHex(0xffffff)
        this.ambientLight.intensity = 0.15
        this.directionalLight.intensity = 0
        this.hemisphereLight.intensity = 0.1
        this.spotLight.color.setHex(this.kelvinToRGB(4500))
        this.spotLight.intensity = 1.5
        this.spotLight.position.set(0, 3, 6)
        this.spotLight.target.position.set(0, 2, 0)
        this.spotLight.angle = Math.PI / 2.5
        this.spotLight.penumbra = 0.2
        this.spotLight.decay = 1
        this.spotLight.distance = 20
        break
      case 'natural':
      default:
        this.ambientLight.color.setHex(0xffffff)
        this.ambientLight.intensity = 0.4
        this.directionalLight.color.setHex(0xfff8e7)
        this.directionalLight.intensity = 0.8
        this.directionalLight.position.set(3, 6, 4)
        this.directionalLight.target.position.set(0, 2, 0)
        this.hemisphereLight.color.setHex(0x87CEEB)
        this.hemisphereLight.groundColor.setHex(0x8B7355)
        this.hemisphereLight.intensity = 0.5
        this.spotLight.intensity = 0
        break
    }
  }

  setWallMaterial(material: WallMaterial) {
    if (material === this.currentWallMaterial) return
    this.targetWallMaterial = material
    this.isTransitioningMaterial = true
    this.materialTransitionStart = performance.now()
  }

  private updateMaterialTransition() {
    if (!this.isTransitioningMaterial) return
    const elapsed = performance.now() - this.materialTransitionStart
    const t = Math.min(1, elapsed / MATERIAL_TRANSITION_DURATION)
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
    const fromMat = this.wallMaterials[this.currentWallMaterial]
    const toMat = this.wallMaterials[this.targetWallMaterial]
    const currentMat = this.wallMesh.material as THREE.MeshStandardMaterial
    currentMat.color.lerpColors(fromMat.color, toMat.color, eased)
    if (fromMat.map && toMat.map) {
      currentMat.opacity = 1
    }
    currentMat.roughness = fromMat.roughness + (toMat.roughness - fromMat.roughness) * eased
    currentMat.metalness = fromMat.metalness + (toMat.metalness - fromMat.metalness) * eased
    if (t >= 1) {
      this.isTransitioningMaterial = false
      this.currentWallMaterial = this.targetWallMaterial
      this.wallMesh.material = this.wallMaterials[this.currentWallMaterial]
    }
    this.wallMesh.material.needsUpdate = true
  }

  private updateCameraPosition() {
    const x = this.cameraTarget.x + Math.sin(this.cameraAngleX) * this.cameraDistance * Math.cos(this.cameraAngleY)
    const y = this.cameraTarget.y + Math.sin(this.cameraAngleY) * this.cameraDistance
    const z = this.cameraTarget.z + Math.cos(this.cameraAngleX) * this.cameraDistance * Math.cos(this.cameraAngleY)
    this.camera.position.set(x, y, z)
    this.camera.lookAt(this.cameraTarget)
  }

  private setupEventListeners() {
    const dom = this.renderer.domElement
    dom.addEventListener('mousedown', this.onMouseDown)
    dom.addEventListener('mousemove', this.onMouseMove)
    dom.addEventListener('mouseup', this.onMouseUp)
    dom.addEventListener('wheel', this.onWheel, { passive: false })
    dom.addEventListener('contextmenu', (e) => e.preventDefault())
    window.addEventListener('resize', this.onResize)
  }

  private onMouseDown = (e: MouseEvent) => {
    this.lastMousePos = { x: e.clientX, y: e.clientY }
    if (e.button === 0) {
      this.updateMouse(e)
      this.raycaster.setFromCamera(this.mouse, this.camera)
      const paintingMeshes: THREE.Object3D[] = []
      this.paintings.forEach((p) => paintingMeshes.push(p.group))
      const intersects = this.raycaster.intersectObjects(paintingMeshes, true)
      if (intersects.length > 0) {
        let obj: THREE.Object3D | null = intersects[0].object
        while (obj && !this.paintings.has(obj.name)) {
          obj = obj.parent
        }
        if (obj && this.paintings.has(obj.name)) {
          this.isDragging = true
          this.draggedPainting = this.paintings.get(obj.name)!
          const hitPoint = intersects[0].point
          this.dragOffset.copy(this.draggedPainting.group.position).sub(hitPoint)
          this.dragOffset.z = 0
        }
      }
    } else if (e.button === 2) {
      this.updateMouse(e)
      this.raycaster.setFromCamera(this.mouse, this.camera)
      const paintingMeshes: THREE.Object3D[] = []
      this.paintings.forEach((p) => paintingMeshes.push(p.group))
      const intersects = this.raycaster.intersectObjects(paintingMeshes, true)
      if (intersects.length > 0) {
        let obj: THREE.Object3D | null = intersects[0].object
        while (obj && !this.paintings.has(obj.name)) {
          obj = obj.parent
        }
        if (obj && this.paintings.has(obj.name)) {
          this.isRotating = true
          this.draggedPainting = this.paintings.get(obj.name)!
        }
      }
    } else if (e.button === 1) {
      e.preventDefault()
      this.isPanning = true
    }
  }

  private onMouseMove = (e: MouseEvent) => {
    const dx = e.clientX - this.lastMousePos.x
    const dy = e.clientY - this.lastMousePos.y
    this.lastMousePos = { x: e.clientX, y: e.clientY }
    if (this.isDragging && this.draggedPainting) {
      this.updateMouse(e)
      this.raycaster.setFromCamera(this.mouse, this.camera)
      const wallPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
      const intersectPoint = new THREE.Vector3()
      this.raycaster.ray.intersectPlane(wallPlane, intersectPoint)
      if (intersectPoint) {
        const newPos = intersectPoint.add(this.dragOffset)
        this.movePainting(this.draggedPainting.id, { x: newPos.x, y: newPos.y }, true)
      }
    } else if (this.isRotating && this.draggedPainting) {
      const painting = this.draggedPainting
      let newRot = painting.group.rotation.y + dx * 0.01
      newRot = Math.max(MIN_ROTATION, Math.min(MAX_ROTATION, newRot))
      this.rotatePainting(painting.id, newRot, true)
    } else if (this.isPanning) {
      this.cameraTarget.x -= dx * 0.01
      this.cameraTarget.y += dy * 0.01
      this.updateCameraPosition()
    }
  }

  private onMouseUp = () => {
    if (this.isDragging && this.draggedPainting) {
      const id = this.draggedPainting.id
      const painting = this.draggedPainting
      if (this.onPaintingUpdate) {
        this.onPaintingUpdate(id, { position: { x: painting.group.position.x, y: painting.group.position.y } })
      }
    }
    if (this.isRotating && this.draggedPainting) {
      const id = this.draggedPainting.id
      const painting = this.draggedPainting
      if (this.onPaintingUpdate) {
        this.onPaintingUpdate(id, { rotationY: painting.group.rotation.y })
      }
    }
    this.isDragging = false
    this.isRotating = false
    this.isPanning = false
    this.draggedPainting = null
  }

  private onWheel = (e: WheelEvent) => {
    e.preventDefault()
    this.updateMouse(e)
    this.raycaster.setFromCamera(this.mouse, this.camera)
    const paintingMeshes: THREE.Object3D[] = []
    this.paintings.forEach((p) => paintingMeshes.push(p.group))
    const intersects = this.raycaster.intersectObjects(paintingMeshes, true)
    if (intersects.length > 0) {
      let obj: THREE.Object3D | null = intersects[0].object
      while (obj && !this.paintings.has(obj.name)) {
        obj = obj.parent
      }
      if (obj && this.paintings.has(obj.name)) {
        const painting = this.paintings.get(obj.name)!
        const delta = e.deltaY > 0 ? -SCALE_STEP : SCALE_STEP
        const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, +(painting.group.scale.x + delta).toFixed(2)))
        this.scalePainting(painting.id, newScale, true)
        if (this.onPaintingUpdate) {
          this.onPaintingUpdate(painting.id, { scale: newScale })
        }
        return
      }
    }
    this.cameraDistance = Math.max(MIN_CAMERA_DISTANCE, Math.min(MAX_CAMERA_DISTANCE, this.cameraDistance + e.deltaY * 0.01))
    this.updateCameraPosition()
  }

  private updateMouse(e: MouseEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
  }

  private onResize = () => {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
  }

  private getPaintingWorldBounds(painting: ScenePainting) {
    const halfW = (painting.baseWidth * painting.group.scale.x) / 2
    const halfH = (painting.baseHeight * painting.group.scale.y) / 2
    const cx = painting.group.position.x
    const cy = painting.group.position.y
    return {
      left: cx - halfW,
      right: cx + halfW,
      bottom: cy - halfH,
      top: cy + halfH,
      centerX: cx,
      centerY: cy,
    }
  }

  private triggerPulse(paintingId: string) {
    const painting = this.paintings.get(paintingId)
    if (!painting) return
    this.pulseAnimations.set(paintingId, { startTime: performance.now() })
  }

  private updatePulseAnimations() {
    const now = performance.now()
    this.pulseAnimations.forEach((anim, id) => {
      const painting = this.paintings.get(id)
      if (!painting) {
        this.pulseAnimations.delete(id)
        return
      }
      const elapsed = now - anim.startTime
      if (elapsed >= PULSE_DURATION) {
        const mat = painting.pulseMesh.material as THREE.MeshBasicMaterial
        mat.opacity = 0
        this.pulseAnimations.delete(id)
        return
      }
      const t = elapsed / PULSE_DURATION
      const opacity = Math.sin(t * Math.PI) * 0.6
      const scale = 1 + t * 0.08
      const mat = painting.pulseMesh.material as THREE.MeshBasicMaterial
      mat.opacity = opacity
      painting.pulseMesh.scale.set(scale, scale, 1)
    })
  }

  movePainting(id: string, position: { x: number; y: number }, fromDrag = false) {
    const painting = this.paintings.get(id)
    if (!painting) return
    const halfW = (painting.baseWidth * painting.group.scale.x) / 2
    const halfH = (painting.baseHeight * painting.group.scale.y) / 2
    let newX = position.x
    let newY = position.y
    const wallLeft = -WALL_WIDTH / 2 + halfW + 0.1
    const wallRight = WALL_WIDTH / 2 - halfW - 0.1
    const wallBottom = halfH + 0.1
    const wallTop = WALL_HEIGHT - halfH - 0.1
    let snapped = false
    if (Math.abs(newX - wallLeft) < SNAP_THRESHOLD) { newX = wallLeft; snapped = true }
    if (Math.abs(newX - wallRight) < SNAP_THRESHOLD) { newX = wallRight; snapped = true }
    if (Math.abs(newY - wallBottom) < SNAP_THRESHOLD) { newY = wallBottom; snapped = true }
    if (Math.abs(newY - wallTop) < SNAP_THRESHOLD) { newY = wallTop; snapped = true }
    newX = Math.max(wallLeft, Math.min(wallRight, newX))
    newY = Math.max(wallBottom, Math.min(wallTop, newY))
    this.paintings.forEach((other, otherId) => {
      if (otherId === id) return
      const otherBounds = this.getPaintingWorldBounds(other)
      const myBounds = {
        left: newX - halfW, right: newX + halfW,
        bottom: newY - halfH, top: newY + halfH,
      }
      const yOverlap = myBounds.bottom < otherBounds.top && myBounds.top > otherBounds.bottom
      const xOverlap = myBounds.left < otherBounds.right && myBounds.right > otherBounds.left
      if (yOverlap) {
        if (Math.abs(myBounds.right - otherBounds.left) < SNAP_THRESHOLD) { newX = otherBounds.left - halfW; snapped = true }
        if (Math.abs(myBounds.left - otherBounds.right) < SNAP_THRESHOLD) { newX = otherBounds.right + halfW; snapped = true }
      }
      if (xOverlap) {
        if (Math.abs(myBounds.top - otherBounds.bottom) < SNAP_THRESHOLD) { newY = otherBounds.bottom - halfH; snapped = true }
        if (Math.abs(myBounds.bottom - otherBounds.top) < SNAP_THRESHOLD) { newY = otherBounds.top + halfH; snapped = true }
      }
      if (yOverlap && Math.abs((myBounds.left + myBounds.right) / 2 - (otherBounds.left + otherBounds.right) / 2) < SNAP_THRESHOLD) {
        newX = (otherBounds.left + otherBounds.right) / 2
        snapped = true
      }
      if (xOverlap && Math.abs((myBounds.bottom + myBounds.top) / 2 - (otherBounds.bottom + otherBounds.top) / 2) < SNAP_THRESHOLD) {
        newY = (otherBounds.bottom + otherBounds.top) / 2
        snapped = true
      }
    })
    painting.group.position.set(newX, newY, 0.01)
    if (snapped && fromDrag && !this.pulseAnimations.has(id)) {
      this.triggerPulse(id)
    }
  }

  scalePainting(id: string, scale: number, _fromWheel = false) {
    const painting = this.paintings.get(id)
    if (!painting) return
    const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale))
    painting.group.scale.set(clamped, clamped, 1)
    this.movePainting(id, { x: painting.group.position.x, y: painting.group.position.y })
  }

  rotatePainting(id: string, rotationY: number, _fromDrag = false) {
    const painting = this.paintings.get(id)
    if (!painting) return
    const clamped = Math.max(MIN_ROTATION, Math.min(MAX_ROTATION, rotationY))
    painting.group.rotation.y = clamped
  }

  async addPainting(data: PaintingData): Promise<void> {
    return new Promise((resolve, reject) => {
      const loader = new THREE.TextureLoader()
      loader.load(
        data.imageUrl,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace
          const aspect = data.aspectRatio || (texture.image.width / texture.image.height)
          const baseHeight = 1.2
          const baseWidth = baseHeight * aspect
          const group = new THREE.Group()
          group.name = data.id
          group.position.set(data.position.x, data.position.y, 0.01)
          group.scale.set(data.scale, data.scale, 1)
          group.rotation.y = data.rotationY
          const frameThickness = 0.06
          const frameDepth = 0.08
          const frameColorHex = data.frameColor === 'gold' ? 0xD4AF37 : data.frameColor === 'black' ? 0x1a1a1a : 0xf0f0f0
          const frameMaterial = new THREE.MeshStandardMaterial({ color: frameColorHex, metalness: data.frameColor === 'gold' ? 0.7 : 0.1, roughness: 0.4 })
          const frameShapes = [
            { w: baseWidth + frameThickness * 2, h: frameThickness, x: 0, y: baseHeight / 2 + frameThickness / 2 },
            { w: baseWidth + frameThickness * 2, h: frameThickness, x: 0, y: -baseHeight / 2 - frameThickness / 2 },
            { w: frameThickness, h: baseHeight + frameThickness * 2, x: -baseWidth / 2 - frameThickness / 2, y: 0 },
            { w: frameThickness, h: baseHeight + frameThickness * 2, x: baseWidth / 2 + frameThickness / 2, y: 0 },
          ]
          frameShapes.forEach((fs) => {
            const frameGeo = new THREE.BoxGeometry(fs.w, fs.h, frameDepth)
            const frameMesh = new THREE.Mesh(frameGeo, frameMaterial)
            frameMesh.position.set(fs.x, fs.y, frameDepth / 2)
            frameMesh.castShadow = true
            group.add(frameMesh)
          })
          const outerFrameGeo = new THREE.BoxGeometry(baseWidth + frameThickness * 2, baseHeight + frameThickness * 2, 0.02)
          const outerFrameMesh = new THREE.Mesh(outerFrameGeo, frameMaterial)
          outerFrameMesh.position.set(0, 0, -0.01)
          outerFrameMesh.castShadow = true
          group.add(outerFrameMesh)
          const canvasGeo = new THREE.PlaneGeometry(baseWidth, baseHeight)
          const canvasMaterial = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.7 })
          const canvasMesh = new THREE.Mesh(canvasGeo, canvasMaterial)
          canvasMesh.position.set(0, 0, 0.005)
          canvasMesh.castShadow = true
          group.add(canvasMesh)
          const pulseGeo = new THREE.PlaneGeometry(baseWidth + frameThickness * 2 + 0.1, baseHeight + frameThickness * 2 + 0.1)
          const pulseMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
          const pulseMesh = new THREE.Mesh(pulseGeo, pulseMaterial)
          pulseMesh.position.set(0, 0, -0.02)
          group.add(pulseMesh)
          const scenePainting: ScenePainting = {
            id: data.id,
            group,
            frameMesh: outerFrameMesh,
            canvasMesh,
            pulseMesh,
            baseHeight,
            baseWidth,
            frameColor: data.frameColor,
            aspectRatio: aspect,
          }
          this.paintings.set(data.id, scenePainting)
          this.scene.add(group)
          resolve()
        },
        undefined,
        (err) => reject(err)
      )
    })
  }

  removePainting(id: string) {
    const painting = this.paintings.get(id)
    if (!painting) return
    this.scene.remove(painting.group)
    painting.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose())
        } else {
          obj.material.dispose()
        }
      }
    })
    this.paintings.delete(id)
    this.pulseAnimations.delete(id)
  }

  clearPaintings() {
    Array.from(this.paintings.keys()).forEach((id) => this.removePainting(id))
  }

  resetCamera() {
    this.cameraDistance = this.initialCameraDistance
    this.cameraAngleX = this.initialCameraAngleX
    this.cameraAngleY = this.initialCameraAngleY
    this.cameraTarget.copy(this.initialCameraTarget)
    this.updateCameraPosition()
  }

  async screenshot(): Promise<Blob> {
    const prevSize = this.renderer.getSize(new THREE.Vector2())
    const prevPixelRatio = this.renderer.getPixelRatio()
    this.renderer.setPixelRatio(1)
    this.renderer.setSize(1920, 1080, false)
    this.camera.aspect = 1920 / 1080
    this.camera.updateProjectionMatrix()
    this.renderer.render(this.scene, this.camera)
    return new Promise((resolve, reject) => {
      this.renderer.domElement.toBlob(
        (blob) => {
          this.renderer.setPixelRatio(prevPixelRatio)
          this.renderer.setSize(prevSize.x, prevSize.y, false)
          this.camera.aspect = this.container.clientWidth / this.container.clientHeight
          this.camera.updateProjectionMatrix()
          if (blob) resolve(blob)
          else reject(new Error('Failed to create screenshot blob'))
        },
        'image/png'
      )
    })
  }

  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate)
    this.updateMaterialTransition()
    this.updatePulseAnimations()
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    if (this.animationId !== null) cancelAnimationFrame(this.animationId)
    window.removeEventListener('resize', this.onResize)
    const dom = this.renderer.domElement
    dom.removeEventListener('mousedown', this.onMouseDown)
    dom.removeEventListener('mousemove', this.onMouseMove)
    dom.removeEventListener('mouseup', this.onMouseUp)
    dom.removeEventListener('wheel', this.onWheel)
    this.clearPaintings()
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose())
        } else {
          obj.material.dispose()
        }
      }
    })
    this.renderer.dispose()
    if (dom.parentElement) dom.parentElement.removeChild(dom)
  }
}

export default SceneManager
