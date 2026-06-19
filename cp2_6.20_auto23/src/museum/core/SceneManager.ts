import * as THREE from 'three'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { EventEmitter } from 'events'
import { InputController } from './InputController'
import type { MoveVector } from './InputController'
import { ExhibitFactory } from '../exhibits/ExhibitFactory'
import type { ExhibitData } from '../exhibits/ExhibitFactory'

export type HallId = 'lobby' | 'painting' | 'sculpture' | 'modern'

export interface HallConfig {
  id: HallId
  name: string
  wallColor: number
  floorColor: number
  ambientColor: number
  lightIntensity: number
  fogColor: number
  fogNear: number
  fogFar: number
}

export const HALL_CONFIGS: Record<HallId, HallConfig> = {
  lobby: {
    id: 'lobby',
    name: '中央大厅',
    wallColor: 0x2a2a33,
    floorColor: 0x1f1f26,
    ambientColor: 0x404050,
    lightIntensity: 0.6,
    fogColor: 0x1a1a1f,
    fogNear: 10,
    fogFar: 30,
  },
  painting: {
    id: 'painting',
    name: '油画厅',
    wallColor: 0x5a4530,
    floorColor: 0x3d3024,
    ambientColor: 0x806040,
    lightIntensity: 0.8,
    fogColor: 0x2a1f15,
    fogNear: 8,
    fogFar: 25,
  },
  sculpture: {
    id: 'sculpture',
    name: '雕塑厅',
    wallColor: 0x4a5058,
    floorColor: 0x353a40,
    ambientColor: 0x708090,
    lightIntensity: 0.7,
    fogColor: 0x1e2028,
    fogNear: 8,
    fogFar: 25,
  },
  modern: {
    id: 'modern',
    name: '现代艺术厅',
    wallColor: 0xf5f5f5,
    floorColor: 0xe8e8e8,
    ambientColor: 0xffffff,
    lightIntensity: 0.9,
    fogColor: 0xcccccc,
    fogNear: 12,
    fogFar: 30,
  },
}

export const HALL_ORDER: HallId[] = ['lobby', 'painting', 'sculpture', 'modern']

export class SceneManager extends EventEmitter {
  private container: HTMLElement
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private labelRenderer: CSS2DRenderer
  private inputController: InputController
  private exhibitFactory: ExhibitFactory
  private loadingManager: THREE.LoadingManager
  private clock: THREE.Clock
  private animationFrameId: number = 0
  private currentHall: HallId = 'lobby'
  private hallGroups: Map<HallId, THREE.Group> = new Map()
  private raycaster: THREE.Raycaster
  private mouseVector: THREE.Vector2
  private moveVector: MoveVector = { x: 0, z: 0 }
  private yaw: number = 0
  private pitch: number = 0
  private velocity: THREE.Vector3 = new THREE.Vector3()
  private collisionBoxes: THREE.Box3[] = []
  private playerRadius: number = 0.4
  private exhibitsData: ExhibitData[] = []
  private isNearExhibit: boolean = false
  private hoveredExhibitId: string | null = null
  private elapsedTime: number = 0
  private transitioning: boolean = false
  private totalResources: number = 0
  private loadedResources: number = 0

  constructor(container: HTMLElement) {
    super()
    this.container = container
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x1a1a1f)

    this.camera = new THREE.PerspectiveCamera(
      70,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    )
    this.camera.position.set(0, 1.6, 5)

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.0
    container.appendChild(this.renderer.domElement)

    this.labelRenderer = new CSS2DRenderer()
    this.labelRenderer.setSize(container.clientWidth, container.clientHeight)
    this.labelRenderer.domElement.style.position = 'absolute'
    this.labelRenderer.domElement.style.top = '0'
    this.labelRenderer.domElement.style.pointerEvents = 'none'
    container.appendChild(this.labelRenderer.domElement)

    this.loadingManager = new THREE.LoadingManager()
    this.loadingManager.onProgress = (url, loaded, total) => {
      this.totalResources = total
      this.loadedResources = loaded
      this.emit('loadProgress', { loaded, total, url })
    }
    this.loadingManager.onLoad = () => {
      this.emit('loadComplete')
    }

    this.clock = new THREE.Clock()
    this.raycaster = new THREE.Raycaster()
    this.mouseVector = new THREE.Vector2()

    this.inputController = new InputController()
    this.inputController.init(this.renderer.domElement)

    this.exhibitFactory = new ExhibitFactory(this.scene, this.labelRenderer, this.loadingManager)

    this.bindEvents()
    this.initHalls()
  }

  private bindEvents() {
    this.inputController.on('move', (vec: MoveVector) => {
      this.moveVector = vec
    })
    this.inputController.on('mouseMove', ({ dx, dy }: { dx: number; dy: number }) => {
      this.yaw -= dx * 0.002
      this.pitch -= dy * 0.002
      this.pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, this.pitch))
    })
    this.inputController.on('click', () => {
      this.handleClick()
    })

    window.addEventListener('resize', this.handleResize)
  }

  private handleResize = () => {
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
    this.labelRenderer.setSize(w, h)
  }

  private initHalls() {
    HALL_ORDER.forEach((hallId) => {
      const group = new THREE.Group()
      group.visible = hallId === 'lobby'
      this.hallGroups.set(hallId, group)
      this.scene.add(group)
      this.buildHall(hallId, group)
    })
  }

  private buildHall(hallId: HallId, group: THREE.Group) {
    const config = HALL_CONFIGS[hallId]
    const hallSize = hallId === 'lobby' ? 18 : 16
    const wallHeight = 5

    const floorGeo = new THREE.PlaneGeometry(hallSize, hallSize)
    const floorMat = new THREE.MeshStandardMaterial({
      color: config.floorColor,
      roughness: 0.85,
      metalness: 0.05,
    })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    group.add(floor)

    const ceilingGeo = new THREE.PlaneGeometry(hallSize, hallSize)
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: config.wallColor,
      roughness: 0.9,
      metalness: 0.0,
      side: THREE.DoubleSide,
    })
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat)
    ceiling.rotation.x = Math.PI / 2
    ceiling.position.y = wallHeight
    group.add(ceiling)

    const wallMat = new THREE.MeshStandardMaterial({
      color: config.wallColor,
      roughness: 0.8,
      metalness: 0.05,
    })

    const wallThickness = 0.3
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(hallSize, wallHeight, wallThickness),
      wallMat
    )
    backWall.position.set(0, wallHeight / 2, -hallSize / 2)
    backWall.receiveShadow = true
    group.add(backWall)

    const frontWallLeft = new THREE.Mesh(
      new THREE.BoxGeometry((hallSize - 3) / 2, wallHeight, wallThickness),
      wallMat
    )
    frontWallLeft.position.set(-(hallSize + 3) / 4, wallHeight / 2, hallSize / 2)
    frontWallLeft.receiveShadow = true
    group.add(frontWallLeft)

    const frontWallRight = new THREE.Mesh(
      new THREE.BoxGeometry((hallSize - 3) / 2, wallHeight, wallThickness),
      wallMat
    )
    frontWallRight.position.set((hallSize + 3) / 4, wallHeight / 2, hallSize / 2)
    frontWallRight.receiveShadow = true
    group.add(frontWallRight)

    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, hallSize),
      wallMat
    )
    leftWall.position.set(-hallSize / 2, wallHeight / 2, 0)
    leftWall.receiveShadow = true
    group.add(leftWall)

    const rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, hallSize),
      wallMat
    )
    rightWall.position.set(hallSize / 2, wallHeight / 2, 0)
    rightWall.receiveShadow = true
    group.add(rightWall)

    if (hallId !== 'lobby') {
      const doorFrameMat = new THREE.MeshStandardMaterial({
        color: 0xc9a962,
        roughness: 0.4,
        metalness: 0.8,
      })
      const doorTop = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 0.2, wallThickness + 0.1),
        doorFrameMat
      )
      doorTop.position.set(0, 2.8, hallSize / 2)
      group.add(doorTop)

      const doorLeft = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 2.8, wallThickness + 0.1),
        doorFrameMat
      )
      doorLeft.position.set(-1.5, 1.4, hallSize / 2)
      group.add(doorLeft)

      const doorRight = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 2.8, wallThickness + 0.1),
        doorFrameMat
      )
      doorRight.position.set(1.5, 1.4, hallSize / 2)
      group.add(doorRight)
    }

    if (hallId === 'lobby') {
      ;[-6, 0, 6].forEach((x, idx) => {
        const hallIds: HallId[] = ['painting', 'sculpture', 'modern']
        const targetHall = hallIds[idx]
        const portal = this.createPortal(targetHall)
        portal.position.set(x, 0, -hallSize / 2 + 0.5)
        portal.rotation.y = Math.PI
        group.add(portal)

        const signText = document.createElement('div')
        signText.style.cssText = `
          font-family: 'Cinzel', serif;
          font-size: 18px;
          color: #c9a962;
          letter-spacing: 3px;
          text-shadow: 0 0 12px rgba(201, 169, 98, 0.7);
          pointer-events: none;
          white-space: nowrap;
        `
        signText.textContent = HALL_CONFIGS[targetHall].name
        const signObj = new CSS2DObject(signText)
        signObj.position.set(x, 3.8, -hallSize / 2 + 0.5)
        signObj.rotation.y = Math.PI
        group.add(signObj)
      })
    }

    const ambient = new THREE.AmbientLight(config.ambientColor, config.lightIntensity * 0.4)
    group.add(ambient)

    const mainLight = new THREE.DirectionalLight(0xffffff, config.lightIntensity)
    mainLight.position.set(5, 8, 5)
    mainLight.castShadow = true
    mainLight.shadow.mapSize.width = 1024
    mainLight.shadow.mapSize.height = 1024
    mainLight.shadow.camera.near = 0.5
    mainLight.shadow.camera.far = 30
    mainLight.shadow.camera.left = -10
    mainLight.shadow.camera.right = 10
    mainLight.shadow.camera.top = 10
    mainLight.shadow.camera.bottom = -10
    mainLight.shadow.bias = -0.0005
    group.add(mainLight)

    const spotPositions =
      hallId === 'lobby'
        ? [
            [-5, 4, -5],
            [5, 4, -5],
            [0, 4, 2],
          ]
        : [
            [-4, 4, -4],
            [4, 4, -4],
            [-4, 4, 4],
            [4, 4, 4],
          ]

    spotPositions.forEach(([px, py, pz]) => {
      const spot = new THREE.SpotLight(0xffffff, 0.5, 10, Math.PI / 5, 0.5, 1)
      spot.position.set(px, py, pz)
      spot.target.position.set(px, 0, pz - 2)
      spot.castShadow = true
      group.add(spot)
      group.add(spot.target)
    })

    this.registerCollidable(backWall)
    this.registerCollidable(leftWall)
    this.registerCollidable(rightWall)
    if (hallId !== 'lobby') {
      this.registerCollidable(frontWallLeft)
      this.registerCollidable(frontWallRight)
    }
  }

  private createPortal(targetHall: HallId): THREE.Group {
    const group = new THREE.Group()
    group.userData.portalTarget = targetHall

    const frameGeo = new THREE.BoxGeometry(3, 3, 0.3)
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0xc9a962,
      roughness: 0.3,
      metalness: 0.9,
    })
    const frame = new THREE.Mesh(frameGeo, frameMat)
    frame.position.y = 1.5
    group.add(frame)

    const innerGeo = new THREE.PlaneGeometry(2.6, 2.6)
    const innerMat = new THREE.MeshBasicMaterial({
      color: HALL_CONFIGS[targetHall].wallColor,
      transparent: true,
      opacity: 0.7,
    })
    const inner = new THREE.Mesh(innerGeo, innerMat)
    inner.position.y = 1.5
    inner.position.z = 0.16
    inner.userData.isPortal = true
    inner.userData.portalTarget = targetHall
    group.add(inner)

    return group
  }

  private registerCollidable(mesh: THREE.Mesh) {
    mesh.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(mesh)
    this.collisionBoxes.push(box)
  }

  async loadExhibits(data: ExhibitData[]) {
    this.exhibitsData = data
    const total = data.length
    for (let i = 0; i < data.length; i++) {
      const exhibit = data[i]
      const hallGroup = this.hallGroups.get(exhibit.hallId)
      if (hallGroup) {
        const exhibit3D = await this.exhibitFactory.createExhibit(exhibit)
        hallGroup.add(exhibit3D.group)
      }
      this.emit('exhibitLoadProgress', { loaded: i + 1, total })
    }
  }

  private handleClick() {
    this.mouseVector.set(0, 0)
    this.raycaster.setFromCamera(this.mouseVector, this.camera)
    const intersects = this.raycaster.intersectObjects(this.scene.children, true)

    for (const hit of intersects) {
      const obj = hit.object as THREE.Mesh
      if (obj.userData && obj.userData.isPortal) {
        this.switchHall(obj.userData.portalTarget as HallId)
        return
      }
      if (obj.userData && obj.userData.isExhibit) {
        const exhibit = this.exhibitsData.find((e) => e.id === obj.userData.exhibitId)
        if (exhibit) {
          this.emit('exhibitClick', exhibit)
          return
        }
      }
    }
  }

  switchHall(targetHall: HallId) {
    if (this.transitioning || this.currentHall === targetHall) return
    this.transitioning = true

    const config = HALL_CONFIGS[targetHall]
    this.scene.fog = new THREE.Fog(config.fogColor, config.fogNear, config.fogFar)
    this.scene.background = new THREE.Color(config.fogColor)

    this.hallGroups.forEach((g, id) => {
      g.visible = id === targetHall
    })

    this.currentHall = targetHall
    this.camera.position.set(0, 1.6, 5)
    this.yaw = 0
    this.pitch = 0
    this.emit('hallChange', targetHall)

    setTimeout(() => {
      this.transitioning = false
    }, 300)
  }

  getCurrentHall(): HallId {
    return this.currentHall
  }

  start() {
    const config = HALL_CONFIGS[this.currentHall]
    this.scene.fog = new THREE.Fog(config.fogColor, config.fogNear, config.fogFar)
    this.animate()
  }

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate)
    const delta = Math.min(this.clock.getDelta(), 0.1)
    this.elapsedTime += delta

    this.updatePlayer(delta)
    this.exhibitFactory.updateAnimations(delta, this.elapsedTime)
    this.checkHover()

    this.renderer.render(this.scene, this.camera)
    this.labelRenderer.render(this.scene, this.camera)
  }

  private updatePlayer(delta: number) {
    const speed = 3.5
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw))
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw))

    this.velocity.set(0, 0, 0)
    this.velocity.addScaledVector(forward, -this.moveVector.z * speed * delta)
    this.velocity.addScaledVector(right, this.moveVector.x * speed * delta)

    const newPos = this.camera.position.clone().add(this.velocity)

    const testX = this.camera.position.clone()
    testX.x = newPos.x
    if (!this.checkCollision(testX)) {
      this.camera.position.x = newPos.x
    }

    const testZ = this.camera.position.clone()
    testZ.z = newPos.z
    if (!this.checkCollision(testZ)) {
      this.camera.position.z = newPos.z
    }

    this.camera.rotation.order = 'YXZ'
    this.camera.rotation.y = this.yaw
    this.camera.rotation.x = this.pitch

    if (this.currentHall === 'lobby') {
      const hallSize = 18
      ;[-6, 0, 6].forEach((px, idx) => {
        const hallIds: HallId[] = ['painting', 'sculpture', 'modern']
        const dz = Math.abs(this.camera.position.z + hallSize / 2 + 0.5)
        const dx = Math.abs(this.camera.position.x - px)
        if (dz < 1.5 && dx < 2) {
          this.switchHall(hallIds[idx])
        }
      })
    }

    if (this.currentHall !== 'lobby') {
      const hallSize = 16
      if (this.camera.position.z > hallSize / 2 - 0.5 && Math.abs(this.camera.position.x) < 1.5) {
        this.switchHall('lobby')
      }
    }
  }

  private checkCollision(pos: THREE.Vector3): boolean {
    for (const box of this.collisionBoxes) {
      const expanded = box.clone()
      expanded.expandByScalar(this.playerRadius)
      if (expanded.containsPoint(pos)) {
        return true
      }
    }
    return false
  }

  private checkHover() {
    this.mouseVector.set(0, 0)
    this.raycaster.setFromCamera(this.mouseVector, this.camera)
    const intersects = this.raycaster.intersectObjects(this.scene.children, true)

    let foundExhibit = false
    for (const hit of intersects) {
      const obj = hit.object as THREE.Mesh
      if (obj.userData && obj.userData.isExhibit && hit.distance < 5) {
        foundExhibit = true
        const id = obj.userData.exhibitId as string
        if (this.hoveredExhibitId !== id) {
          this.hoveredExhibitId = id
          this.emit('exhibitHover', id)
        }
        break
      }
      if (obj.userData && obj.userData.isPortal && hit.distance < 5) {
        foundExhibit = true
        break
      }
    }

    if (this.isNearExhibit !== foundExhibit) {
      this.isNearExhibit = foundExhibit
      this.emit('cursorChange', foundExhibit ? 'zoom' : 'default')
      if (!foundExhibit) {
        this.hoveredExhibitId = null
        this.emit('exhibitHover', null)
      }
    }
  }

  setExhibitPulsing(exhibitId: string, isPulsing: boolean) {
    this.exhibitFactory.setExhibitPulsing(exhibitId, isPulsing)
  }

  destroy() {
    cancelAnimationFrame(this.animationFrameId)
    window.removeEventListener('resize', this.handleResize)
    this.inputController.destroy()
    this.exhibitFactory.clear()
    this.renderer.dispose()
    this.labelRenderer.domElement.remove()
    this.renderer.domElement.remove()
  }
}
