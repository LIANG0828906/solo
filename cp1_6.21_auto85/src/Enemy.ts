import * as THREE from 'three'
import { Maze, CELL_SIZE, MAZE_SIZE } from './Maze'
import { Player } from './Player'

const WANDER_SPEED = 0.02
const CHASE_SPEED = 0.04
const SLOW_DURATION = 2
const CAUGHT_DISTANCE = 0.5
const ENEMY_RADIUS = 0.25

export class Enemy {
  public mesh: THREE.Group
  public position: THREE.Vector3
  public isChasing: boolean = false
  private maze: Maze
  private player: Player
  private wanderDirection: THREE.Vector3
  private wanderTimer: number = 0
  private slowTimer: number = 0
  private edgeLines: THREE.LineSegments | null = null
  private pulseTime: number = 0
  private audioContext: AudioContext | null = null
  private oscillator: OscillatorNode | null = null
  private gainNode: GainNode | null = null

  constructor(
    maze: Maze,
    player: Player,
    startX: number,
    startZ: number,
    audioContext: AudioContext | null = null
  ) {
    this.maze = maze
    this.player = player
    this.position = new THREE.Vector3(startX, ENEMY_RADIUS + 0.1, startZ)
    this.wanderDirection = this.getRandomDirection()
    this.audioContext = audioContext
    this.mesh = new THREE.Group()
    this.buildMesh()
    this.setupAudio()
  }

  private buildMesh(): void {
    const bodyGeo = new THREE.IcosahedronGeometry(ENEMY_RADIUS, 0)
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.3,
      metalness: 0.7,
      emissive: 0x100010,
      emissiveIntensity: 0.3,
    })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    this.mesh.add(body)

    const edges = new THREE.EdgesGeometry(bodyGeo)
    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x8a2be2,
      transparent: true,
      opacity: 0.6,
    })
    this.edgeLines = new THREE.LineSegments(edges, edgeMat)
    this.mesh.add(this.edgeLines)

    this.mesh.position.copy(this.position)
  }

  private setupAudio(): void {
    if (!this.audioContext) return
    try {
      this.oscillator = this.audioContext.createOscillator()
      this.oscillator.type = 'sine'
      this.oscillator.frequency.value = 100

      this.gainNode = this.audioContext.createGain()
      this.gainNode.gain.value = 0

      this.oscillator.connect(this.gainNode)
      this.gainNode.connect(this.audioContext.destination)
      this.oscillator.start()
    } catch {
      // Audio setup failed silently
    }
  }

  private getRandomDirection(): THREE.Vector3 {
    const dirs = [
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, -1),
    ]
    return dirs[Math.floor(Math.random() * dirs.length)].clone()
  }

  public update(deltaTime: number, time: number): boolean {
    this.pulseTime = time
    this.updatePulse()

    const dx = this.player.position.x - this.position.x
    const dz = this.player.position.z - this.position.z
    const distanceToPlayer = Math.sqrt(dx * dx + dz * dz)

    const hasLOS = this.maze.hasLineOfSight(
      this.position.x,
      this.position.z,
      this.player.position.x,
      this.player.position.z
    )

    this.isChasing = hasLOS && distanceToPlayer < 15

    this.updateAudio()

    if (this.slowTimer > 0) {
      this.slowTimer -= deltaTime
    }

    const lightRadius = this.player.getTotalLightRadius()
    if (distanceToPlayer < lightRadius) {
      this.slowTimer = SLOW_DURATION
    }

    let speed = this.isChasing ? CHASE_SPEED : WANDER_SPEED
    const orbBonus = Math.min(this.player.collectedOrbs * 0.003, 0.02)
    speed += orbBonus

    if (this.slowTimer > 0) {
      speed *= 0.4
    }

    if (this.isChasing) {
      const chaseDir = new THREE.Vector3(dx, 0, dz).normalize()
      this.tryMove(chaseDir, speed)
    } else {
      this.wander(speed, deltaTime)
    }

    this.mesh.position.copy(this.position)
    this.mesh.rotation.y += deltaTime * 0.5

    return distanceToPlayer < CAUGHT_DISTANCE
  }

  private updatePulse(): void {
    if (this.edgeLines) {
      const mat = this.edgeLines.material as THREE.LineBasicMaterial
      const pulse = 0.4 + 0.4 * Math.sin(this.pulseTime * 4)
      mat.opacity = this.isChasing ? 0.9 : pulse
      mat.color.setHex(this.isChasing ? 0xff00ff : 0x8a2be2)
    }
    this.mesh.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshStandardMaterial
        if (mat.emissive) {
          mat.emissiveIntensity = this.isChasing
            ? 0.8 + 0.3 * Math.sin(this.pulseTime * 8)
            : 0.3 + 0.1 * Math.sin(this.pulseTime * 2)
        }
      }
    })
  }

  private updateAudio(): void {
    if (!this.gainNode) return
    const targetVolume = this.isChasing ? 0.1 : 0
    this.gainNode.gain.value += (targetVolume - this.gainNode.gain.value) * 0.05
  }

  private tryMove(direction: THREE.Vector3, speed: number): void {
    const nx = this.position.x + direction.x * speed
    const nz = this.position.z + direction.z * speed

    if (this.maze.isWalkable(nx, nz, ENEMY_RADIUS * 0.8)) {
      this.position.x = nx
      this.position.z = nz
    } else {
      if (this.maze.isWalkable(nx, this.position.z, ENEMY_RADIUS * 0.8)) {
        this.position.x = nx
      } else if (this.maze.isWalkable(this.position.x, nz, ENEMY_RADIUS * 0.8)) {
        this.position.z = nz
      } else {
        this.wanderDirection = this.getRandomDirection()
        this.wanderTimer = 0
      }
    }
  }

  private wander(speed: number, deltaTime: number): void {
    this.wanderTimer -= deltaTime
    if (this.wanderTimer <= 0) {
      this.wanderDirection = this.getRandomDirection()
      this.wanderTimer = 1 + Math.random() * 2
    }

    const nx = this.position.x + this.wanderDirection.x * speed
    const nz = this.position.z + this.wanderDirection.z * speed

    if (this.maze.isWalkable(nx, nz, ENEMY_RADIUS * 0.8)) {
      this.position.x = nx
      this.position.z = nz
    } else {
      this.wanderDirection = this.getRandomDirection()
      this.wanderTimer = 0.5
    }
  }

  public reset(startX: number, startZ: number): void {
    this.position.set(startX, ENEMY_RADIUS + 0.1, startZ)
    this.mesh.position.copy(this.position)
    this.isChasing = false
    this.slowTimer = 0
    this.wanderDirection = this.getRandomDirection()
    this.wanderTimer = 0
  }

  public dispose(): void {
    if (this.oscillator) {
      try {
        this.oscillator.stop()
        this.oscillator.disconnect()
      } catch {
        // ignore
      }
      this.oscillator = null
    }
    if (this.gainNode) {
      try {
        this.gainNode.disconnect()
      } catch {
        // ignore
      }
      this.gainNode = null
    }
  }
}

export class EnemySystem {
  public enemies: Enemy[] = []
  public group: THREE.Group
  private audioContext: AudioContext | null = null

  constructor(
    maze: Maze,
    player: Player,
    positions: { x: number; z: number }[]
  ) {
    this.group = new THREE.Group()
    this.tryCreateAudioContext()

    positions.forEach((pos) => {
      const enemy = new Enemy(
        maze,
        player,
        pos.x,
        pos.z,
        this.audioContext
      )
      this.enemies.push(enemy)
      this.group.add(enemy.mesh)
    })
  }

  private tryCreateAudioContext(): void {
    try {
      const AC =
        (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      if (AC) {
        this.audioContext = new AC()
      }
    } catch {
      this.audioContext = null
    }
  }

  public resumeAudio(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {
        // ignore
      })
    }
  }

  public update(deltaTime: number, time: number): boolean {
    let caught = false
    for (const enemy of this.enemies) {
      if (enemy.update(deltaTime, time)) {
        caught = true
      }
    }
    return caught
  }

  public reset(maze: Maze, player: Player, positions: { x: number; z: number }[]): void {
    this.enemies.forEach((enemy, i) => {
      const pos = positions[i] || positions[positions.length - 1]
      enemy.reset(pos.x, pos.z)
    })
  }

  public dispose(): void {
    this.enemies.forEach((e) => e.dispose())
  }
}
