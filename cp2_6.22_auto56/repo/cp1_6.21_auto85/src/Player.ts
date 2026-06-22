import * as THREE from 'three'
import { Maze, CELL_SIZE, MAZE_SIZE } from './Maze'

const MOVE_SPEED = 0.05
const ROTATE_SPEED = 0.03
const MOUSE_ROTATE_SPEED = 0.005
const CAMERA_DISTANCE = 5
const CAMERA_HEIGHT = 3.5
const PLAYER_RADIUS = 0.3
const BASE_LIGHT_RADIUS = 2
const MAX_LIGHT_BONUS = 2

export class Player {
  public mesh: THREE.Group
  public position: THREE.Vector3
  public camera: THREE.PerspectiveCamera
  public playerLight: THREE.PointLight
  public collectedOrbs: number = 0
  public lightRadiusBonus: number = 0

  private yaw: number = Math.PI / 4
  private pitch: number = -0.7
  private keys: { [key: string]: boolean } = {}
  private maze: Maze
  private isDragging: boolean = false
  private lastMouseX: number = 0
  private lastMouseY: number = 0
  private haloMesh: THREE.Mesh
  private canvas: HTMLCanvasElement

  constructor(maze: Maze, canvas: HTMLCanvasElement) {
    this.maze = maze
    this.canvas = canvas
    this.position = new THREE.Vector3()
    this.mesh = new THREE.Group()
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    )
    this.playerLight = new THREE.PointLight(0x88ffff, 1.5, BASE_LIGHT_RADIUS, 2)
    this.haloMesh = this.createHalo()
    this.init()
  }

  private init(): void {
    const halfSize = (MAZE_SIZE * CELL_SIZE) / 2 - CELL_SIZE / 2
    this.position.set(-halfSize, PLAYER_RADIUS, -halfSize)

    const playerGeo = new THREE.SphereGeometry(PLAYER_RADIUS, 24, 24)
    const playerMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    })
    const playerCore = new THREE.Mesh(playerGeo, playerMat)
    this.mesh.add(playerCore)

    this.mesh.add(this.haloMesh)

    this.mesh.position.copy(this.position)

    this.playerLight.position.copy(this.position)
    this.playerLight.castShadow = true

    this.setupEventListeners()
    this.updateCamera()
  }

  private createHalo(): THREE.Mesh {
    const haloGeo = new THREE.SphereGeometry(0.8, 24, 24)
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x88ffff,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide,
    })
    return new THREE.Mesh(haloGeo, haloMat)
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true
    })
    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false
    })

    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true
      this.lastMouseX = e.clientX
      this.lastMouseY = e.clientY
    })

    window.addEventListener('mouseup', () => {
      this.isDragging = false
    })

    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const dx = e.clientX - this.lastMouseX
        const dy = e.clientY - this.lastMouseY
        this.yaw -= dx * MOUSE_ROTATE_SPEED
        this.pitch = Math.max(-1.2, Math.min(0.2, this.pitch - dy * MOUSE_ROTATE_SPEED * 0.5))
        this.lastMouseX = e.clientX
        this.lastMouseY = e.clientY
      }
    })

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight
      this.camera.updateProjectionMatrix()
    })
  }

  public update(): void {
    if (this.keys['a']) {
      this.yaw += ROTATE_SPEED
    }
    if (this.keys['d']) {
      this.yaw -= ROTATE_SPEED
    }

    if (this.keys['w']) {
      const nx = this.position.x + Math.sin(this.yaw) * MOVE_SPEED
      const nz = this.position.z + Math.cos(this.yaw) * MOVE_SPEED
      if (this.maze.isWalkable(nx, nz, PLAYER_RADIUS * 0.8)) {
        this.position.x = nx
        this.position.z = nz
      } else {
        if (this.maze.isWalkable(nx, this.position.z, PLAYER_RADIUS * 0.8)) {
          this.position.x = nx
        }
        if (this.maze.isWalkable(this.position.x, nz, PLAYER_RADIUS * 0.8)) {
          this.position.z = nz
        }
      }
    }
    if (this.keys['s']) {
      const nx = this.position.x - Math.sin(this.yaw) * MOVE_SPEED
      const nz = this.position.z - Math.cos(this.yaw) * MOVE_SPEED
      if (this.maze.isWalkable(nx, nz, PLAYER_RADIUS * 0.8)) {
        this.position.x = nx
        this.position.z = nz
      } else {
        if (this.maze.isWalkable(nx, this.position.z, PLAYER_RADIUS * 0.8)) {
          this.position.x = nx
        }
        if (this.maze.isWalkable(this.position.x, nz, PLAYER_RADIUS * 0.8)) {
          this.position.z = nz
        }
      }
    }

    this.mesh.position.copy(this.position)
    this.playerLight.position.copy(this.position)
    this.playerLight.distance = BASE_LIGHT_RADIUS + this.lightRadiusBonus
    this.updateCamera()
  }

  private updateCamera(): void {
    const camX =
      this.position.x - Math.sin(this.yaw) * Math.cos(this.pitch) * CAMERA_DISTANCE
    const camY = this.position.y + CAMERA_HEIGHT - Math.sin(this.pitch) * CAMERA_DISTANCE
    const camZ =
      this.position.z - Math.cos(this.yaw) * Math.cos(this.pitch) * CAMERA_DISTANCE

    this.camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.15)
    this.camera.lookAt(
      this.position.x,
      this.position.y + 1,
      this.position.z
    )
  }

  public increaseLightRadius(): void {
    this.lightRadiusBonus = Math.min(MAX_LIGHT_BONUS, this.lightRadiusBonus + 0.3)
    this.haloMesh.scale.setScalar(1 + this.lightRadiusBonus / 2)
    const mat = this.haloMesh.material as THREE.MeshBasicMaterial
    mat.opacity = Math.min(0.5, 0.3 + this.lightRadiusBonus * 0.05)
  }

  public getTotalLightRadius(): number {
    return BASE_LIGHT_RADIUS + this.lightRadiusBonus
  }

  public reset(): void {
    const halfSize = (MAZE_SIZE * CELL_SIZE) / 2 - CELL_SIZE / 2
    this.position.set(-halfSize, PLAYER_RADIUS, -halfSize)
    this.yaw = Math.PI / 4
    this.pitch = -0.4
    this.collectedOrbs = 0
    this.lightRadiusBonus = 0
    this.playerLight.distance = BASE_LIGHT_RADIUS
    this.haloMesh.scale.setScalar(1)
    const mat = this.haloMesh.material as THREE.MeshBasicMaterial
    mat.opacity = 0.3
    this.mesh.position.copy(this.position)
    this.playerLight.position.copy(this.position)
    this.updateCamera()
    this.camera.position.set(
      this.position.x - Math.sin(this.yaw) * Math.cos(this.pitch) * CAMERA_DISTANCE,
      this.position.y + CAMERA_HEIGHT - Math.sin(this.pitch) * CAMERA_DISTANCE,
      this.position.z - Math.cos(this.yaw) * Math.cos(this.pitch) * CAMERA_DISTANCE
    )
  }
}
