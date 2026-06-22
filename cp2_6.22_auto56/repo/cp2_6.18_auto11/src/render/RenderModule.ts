import * as THREE from 'three'
import { eventBus, EVENTS } from '../core/EventBus'
import type { ObstacleData, ShardData } from '../engine/PhysicsModule'
import { EffectsModule } from './EffectsModule'

export class RenderModule {
  private container: HTMLElement | null = null
  private scene: THREE.Scene | null = null
  private camera: THREE.PerspectiveCamera | null = null
  private renderer: THREE.WebGLRenderer | null = null

  private playerGroup: THREE.Group | null = null
  private playerBody: THREE.Mesh | null = null
  private leftWing: THREE.Mesh | null = null
  private rightWing: THREE.Mesh | null = null

  private canyonChunks: Map<number, { walls: THREE.Group; obstacles: THREE.Group; shards: THREE.Group }> = new Map()

  private obstaclePool: Map<string, THREE.Mesh> = new Map()
  private shardPool: Map<string, THREE.Mesh> = new Map()

  private wallMaterial: THREE.MeshStandardMaterial | null = null
  private obstacleMaterial: THREE.MeshStandardMaterial | null = null
  private shardMaterial: THREE.MeshStandardMaterial | null = null

  private playerPosition: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 }
  private playerPitch: number = 0
  private playerRoll: number = 0

  private cameraOffset: THREE.Vector3 = new THREE.Vector3(0, 8, -15)
  private cameraShakeIntensity: number = 0
  private cameraShakeDuration: number = 0
  private cameraShakeTime: number = 0

  private wingFlapTime: number = 0
  private wingFlapSpeed: number = 3
  private wingFlapAmount: number = 0.2

  private shardRotationSpeed: number = Math.PI / 6

  private isRunning: boolean = false

  private effectsModule: EffectsModule | null = null

  private rockTexture: THREE.CanvasTexture | null = null
  private rockNormalMap: THREE.CanvasTexture | null = null

  private maxDrawCalls: number = 120
  private currentDrawCalls: number = 0

  constructor() {
    this.bindEvents()
  }

  private bindEvents(): void {
    eventBus.on(EVENTS.PLAYER_POSITION, this.handlePlayerPosition.bind(this))
    eventBus.on(EVENTS.RENDER_CANYON_CHUNK, this.handleCanyonChunk.bind(this))
    eventBus.on(EVENTS.RENDER_REMOVE_CHUNK, this.handleRemoveChunk.bind(this))
    eventBus.on(EVENTS.SHARD_COLLECTED, this.handleShardCollected.bind(this))
    eventBus.on(EVENTS.EFFECTS_SHAKE, this.handleShake.bind(this))
    eventBus.on(EVENTS.GAME_RESTART, this.handleRestart.bind(this))
    eventBus.on(EVENTS.GAME_GAME_OVER, this.handleGameOver.bind(this))
  }

  init(container: HTMLElement): void {
    this.container = container

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0a0a1a)
    this.scene.fog = new THREE.FogExp2(0x0a0a1a, 0.002)

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      5000
    )
    this.camera.position.copy(this.cameraOffset)

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = false
    container.appendChild(this.renderer.domElement)

    this.createRockTextures()
    this.setupMaterials()
    this.setupLights()
    this.createPlayer()

    this.effectsModule = new EffectsModule(this.scene, this.camera)

    window.addEventListener('resize', this.onWindowResize.bind(this))

    this.isRunning = true
  }

  private createRockTextures(): void {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')!

    const gradient = ctx.createLinearGradient(0, 0, 0, 256)
    gradient.addColorStop(0, '#5A4738')
    gradient.addColorStop(0.5, '#4A3728')
    gradient.addColorStop(1, '#3A2718')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 256, 256)

    for (let i = 0; i < 500; i++) {
      const x = Math.random() * 256
      const y = Math.random() * 256
      const size = Math.random() * 8 + 1
      const brightness = Math.random() * 40 - 20
      ctx.fillStyle = `rgba(${74 + brightness}, ${55 + brightness}, ${40 + brightness}, 0.6)`
      ctx.beginPath()
      ctx.ellipse(x, y, size, size * 0.6, Math.random() * Math.PI, 0, Math.PI * 2)
      ctx.fill()
    }

    for (let i = 0; i < 100; i++) {
      const x = Math.random() * 256
      const y = Math.random() * 256
      const size = Math.random() * 3 + 1
      ctx.fillStyle = 'rgba(30, 20, 15, 0.3)'
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
    }

    this.rockTexture = new THREE.CanvasTexture(canvas)
    this.rockTexture.wrapS = THREE.RepeatWrapping
    this.rockTexture.wrapT = THREE.RepeatWrapping
    this.rockTexture.repeat.set(2, 10)

    const normalCanvas = document.createElement('canvas')
    normalCanvas.width = 256
    normalCanvas.height = 256
    const nCtx = normalCanvas.getContext('2d')!

    nCtx.fillStyle = '#8080FF'
    nCtx.fillRect(0, 0, 256, 256)

    for (let i = 0; i < 200; i++) {
      const x = Math.random() * 256
      const y = Math.random() * 256
      const size = Math.random() * 10 + 2
      const nx = Math.random() * 100 - 50
      const ny = Math.random() * 100 - 50

      const r = Math.floor(128 + nx)
      const g = Math.floor(128 + ny)
      const b = Math.floor(200 + Math.random() * 55)

      nCtx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.3)`
      nCtx.beginPath()
      nCtx.ellipse(x, y, size, size * 0.5, Math.random() * Math.PI, 0, Math.PI * 2)
      nCtx.fill()
    }

    this.rockNormalMap = new THREE.CanvasTexture(normalCanvas)
    this.rockNormalMap.wrapS = THREE.RepeatWrapping
    this.rockNormalMap.wrapT = THREE.RepeatWrapping
    this.rockNormalMap.repeat.set(2, 10)
  }

  private setupMaterials(): void {
    this.wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a3728,
      map: this.rockTexture,
      normalMap: this.rockNormalMap,
      normalScale: new THREE.Vector2(0.5, 0.5),
      roughness: 0.9,
      metalness: 0.1,
    })

    this.obstacleMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.8,
      metalness: 0.2,
    })

    this.shardMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      emissive: 0x00ff88,
      emissiveIntensity: 1.0,
      transparent: true,
      opacity: 0.9,
    })
  }

  private setupLights(): void {
    if (!this.scene) return

    const ambientLight = new THREE.AmbientLight(0x404050, 0.6)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(50, 100, 50)
    this.scene.add(directionalLight)

    const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3)
    fillLight.position.set(-50, 30, -50)
    this.scene.add(fillLight)
  }

  private createPlayer(): void {
    if (!this.scene) return

    this.playerGroup = new THREE.Group()

    const bodyGeometry = new THREE.BoxGeometry(2, 1, 1)
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xc0c0c0,
      metalness: 0.7,
      roughness: 0.3,
    })
    this.playerBody = new THREE.Mesh(bodyGeometry, bodyMaterial)
    this.playerGroup.add(this.playerBody)

    const wingGeometry = new THREE.BoxGeometry(6, 0.1, 2)
    const wingMaterial = new THREE.MeshStandardMaterial({
      color: 0xa8d8ea,
      transparent: true,
      opacity: 0.8,
      metalness: 0.5,
      roughness: 0.4,
    })

    this.leftWing = new THREE.Mesh(wingGeometry, wingMaterial)
    this.leftWing.position.set(-4, 0, 0)
    this.leftWing.rotation.y = 0.2
    this.playerGroup.add(this.leftWing)

    this.rightWing = new THREE.Mesh(wingGeometry, wingMaterial)
    this.rightWing.position.set(4, 0, 0)
    this.rightWing.rotation.y = -0.2
    this.playerGroup.add(this.rightWing)

    const headGeometry = new THREE.BoxGeometry(0.8, 0.6, 1.2)
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xd0d0d0,
      metalness: 0.8,
      roughness: 0.2,
    })
    const head = new THREE.Mesh(headGeometry, headMaterial)
    head.position.set(0, 0.2, 1)
    this.playerGroup.add(head)

    const eyeGeometry = new THREE.BoxGeometry(0.2, 0.15, 0.1)
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff88 })
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
    leftEye.position.set(-0.25, 0.25, 1.55)
    this.playerGroup.add(leftEye)

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
    rightEye.position.set(0.25, 0.25, 1.55)
    this.playerGroup.add(rightEye)

    this.playerGroup.position.set(0, 0, 0)
    this.scene.add(this.playerGroup)
  }

  private handlePlayerPosition(data: {
    x: number
    y: number
    z: number
    pitch: number
    roll: number
    speed: number
  }): void {
    this.playerPosition = { x: data.x, y: data.y, z: data.z }
    this.playerPitch = data.pitch
    this.playerRoll = data.roll
  }

  private handleCanyonChunk(data: {
    z: number
    width: number
    obstacles: ObstacleData[]
    shards: ShardData[]
    chunkSize: number
  }): void {
    if (!this.scene) return

    const chunkGroup = {
      walls: new THREE.Group(),
      obstacles: new THREE.Group(),
      shards: new THREE.Group(),
    }

    const { z, width, obstacles, shards, chunkSize } = data

    const leftWall = this.createWallSegment(width, chunkSize, z, 'left')
    chunkGroup.walls.add(leftWall)

    const rightWall = this.createWallSegment(width, chunkSize, z, 'right')
    chunkGroup.walls.add(rightWall)

    obstacles.forEach((obs) => {
      const obstacle = this.createObstacle(obs)
      chunkGroup.obstacles.add(obstacle)
      this.obstaclePool.set(obs.id, obstacle)
    })

    shards.forEach((shard) => {
      const shardMesh = this.createShard(shard)
      chunkGroup.shards.add(shardMesh)
      this.shardPool.set(shard.id, shardMesh)
    })

    this.scene.add(chunkGroup.walls)
    this.scene.add(chunkGroup.obstacles)
    this.scene.add(chunkGroup.shards)

    this.canyonChunks.set(z, chunkGroup)
  }

  private createWallSegment(
    canyonWidth: number,
    chunkDepth: number,
    z: number,
    side: 'left' | 'right'
  ): THREE.Mesh {
    const wallHeight = 200
    const wallThickness = 50

    const geometry = new THREE.BoxGeometry(wallThickness, wallHeight, chunkDepth)

    const mesh = new THREE.Mesh(geometry, this.wallMaterial!)

    const x = side === 'left' ? -canyonWidth / 2 - wallThickness / 2 : canyonWidth / 2 + wallThickness / 2

    mesh.position.set(x, 0, z + chunkDepth / 2)
    mesh.receiveShadow = false

    return mesh
  }

  private createObstacle(data: ObstacleData): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(data.width, data.height, data.depth)
    const mesh = new THREE.Mesh(geometry, this.obstacleMaterial!)
    mesh.position.set(data.x, data.y, data.z)
    mesh.userData = { id: data.id }
    return mesh
  }

  private createShard(data: ShardData): THREE.Mesh {
    const geometry = new THREE.OctahedronGeometry(0.6, 0)
    const mesh = new THREE.Mesh(geometry, this.shardMaterial!.clone())
    mesh.position.set(data.x, data.y, data.z)
    mesh.userData = { id: data.id, collected: false, rotationOffset: Math.random() * Math.PI * 2 }
    return mesh
  }

  private handleRemoveChunk(data: { z: number }): void {
    const chunk = this.canyonChunks.get(data.z)
    if (chunk && this.scene) {
      this.scene.remove(chunk.walls)
      this.scene.remove(chunk.obstacles)
      this.scene.remove(chunk.shards)

      chunk.obstacles.children.forEach((child) => {
        const mesh = child as THREE.Mesh
        const id = mesh.userData.id
        if (id) this.obstaclePool.delete(id)
        mesh.geometry.dispose()
      })

      chunk.shards.children.forEach((child) => {
        const mesh = child as THREE.Mesh
        const id = mesh.userData.id
        if (id) this.shardPool.delete(id)
        mesh.geometry.dispose()
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose())
        } else {
          mesh.material.dispose()
        }
      })

      this.canyonChunks.delete(data.z)
    }
  }

  private handleShardCollected(data: { id: string; position: { x: number; y: number; z: number } }): void {
    const shard = this.shardPool.get(data.id)
    if (shard) {
      shard.userData.collected = true
      shard.userData.collectTime = performance.now() / 1000
    }
  }

  private handleShake(data: { intensity: number; duration: number }): void {
    this.cameraShakeIntensity = data.intensity
    this.cameraShakeDuration = data.duration
    this.cameraShakeTime = 0
  }

  private handleRestart(): void {
    if (this.playerGroup) {
      this.playerGroup.position.set(0, 0, 0)
      this.playerGroup.rotation.set(0, 0, 0)
    }
    this.playerPosition = { x: 0, y: 0, z: 0 }
    this.playerPitch = 0
    this.playerRoll = 0
  }

  private handleGameOver(): void {
    // 游戏结束时的视觉效果
  }

  private onWindowResize(): void {
    if (!this.camera || !this.renderer) return

    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  update(deltaTime: number): void {
    if (!this.isRunning || !this.scene || !this.camera || !this.renderer) return

    this.updatePlayer(deltaTime)
    this.updateCamera(deltaTime)
    this.updateShards(deltaTime)
    this.updateWingFlap(deltaTime)

    if (this.effectsModule) {
      this.effectsModule.update(deltaTime)
    }

    this.renderer.render(this.scene, this.camera)

    this.currentDrawCalls = this.renderer.info.render.calls
  }

  private updatePlayer(deltaTime: number): void {
    if (!this.playerGroup) return

    this.playerGroup.position.x = this.playerPosition.x
    this.playerGroup.position.y = this.playerPosition.y
    this.playerGroup.position.z = this.playerPosition.z

    this.playerGroup.rotation.x = this.playerPitch
    this.playerGroup.rotation.z = this.playerRoll
  }

  private updateCamera(deltaTime: number): void {
    if (!this.camera || !this.playerGroup) return

    const targetX = this.playerPosition.x + this.cameraOffset.x
    const targetY = this.playerPosition.y + this.cameraOffset.y
    const targetZ = this.playerPosition.z + this.cameraOffset.z

    let shakeX = 0
    let shakeY = 0
    let shakeZ = 0

    if (this.cameraShakeTime < this.cameraShakeDuration) {
      this.cameraShakeTime += deltaTime
      const shakeProgress = 1 - this.cameraShakeTime / this.cameraShakeDuration
      const currentIntensity = this.cameraShakeIntensity * shakeProgress

      shakeX = (Math.random() - 0.5) * currentIntensity
      shakeY = (Math.random() - 0.5) * currentIntensity
      shakeZ = (Math.random() - 0.5) * currentIntensity
    }

    this.camera.position.x += (targetX + shakeX - this.camera.position.x) * 0.1
    this.camera.position.y += (targetY + shakeY - this.camera.position.y) * 0.1
    this.camera.position.z += (targetZ + shakeZ - this.camera.position.z) * 0.1

    this.camera.lookAt(
      this.playerPosition.x,
      this.playerPosition.y + 2,
      this.playerPosition.z + 10
    )
  }

  private updateShards(deltaTime: number): void {
    this.shardPool.forEach((shard, id) => {
      if (shard.userData.collected) {
        const now = performance.now() / 1000
        const elapsed = now - shard.userData.collectTime

        if (elapsed < 0.3) {
          const progress = elapsed / 0.3
          const scale = 1 + progress * 0.5
          shard.scale.setScalar(scale)

          const material = shard.material as THREE.MeshStandardMaterial
          if (material.opacity !== undefined) {
            material.opacity = 0.9 * (1 - progress)
          }
        } else {
          shard.visible = false
        }
      } else {
        shard.rotation.y += this.shardRotationSpeed * deltaTime
        shard.rotation.x += this.shardRotationSpeed * 0.5 * deltaTime
      }
    })
  }

  private updateWingFlap(deltaTime: number): void {
    this.wingFlapTime += deltaTime * this.wingFlapSpeed

    const flapAngle = Math.sin(this.wingFlapTime) * this.wingFlapAmount

    if (this.leftWing) {
      this.leftWing.rotation.z = flapAngle
    }
    if (this.rightWing) {
      this.rightWing.rotation.z = -flapAngle
    }
  }

  getDrawCalls(): number {
    return this.currentDrawCalls
  }

  dispose(): void {
    if (this.renderer) {
      this.renderer.dispose()
      if (this.container && this.renderer.domElement.parentNode === this.container) {
        this.container.removeChild(this.renderer.domElement)
      }
    }
    window.removeEventListener('resize', this.onWindowResize.bind(this))
  }

  getScene(): THREE.Scene | null {
    return this.scene
  }

  getCamera(): THREE.PerspectiveCamera | null {
    return this.camera
  }
}
