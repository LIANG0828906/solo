import * as THREE from 'three'
import { Maze, CELL_SIZE, MAZE_SIZE } from './Maze'
import { Player } from './Player'
import { LightOrbSystem } from './LightOrb'
import { EnemySystem } from './Enemy'

const ORB_COUNT = 6
const ENEMY_COUNT = 2
const VICTORY_DISTANCE = 1.5

export class Game {
  private scene: THREE.Scene
  private renderer: THREE.WebGLRenderer
  private maze: Maze
  private player: Player
  private orbSystem: LightOrbSystem
  private enemySystem: EnemySystem
  private canvas: HTMLCanvasElement
  private clock: THREE.Clock
  private gameTime: number = 0
  private isGameOver: boolean = false
  private isVictory: boolean = false
  private isRunning: boolean = true

  private orbCountEl: HTMLElement | null = null
  private lightRadiusEl: HTMLElement | null = null
  private gameOverEl: HTMLElement | null = null
  private victoryEl: HTMLElement | null = null
  private scoreEl: HTMLElement | null = null
  private victoryScoreEl: HTMLElement | null = null
  private restartBtn: HTMLButtonElement | null = null
  private victoryRestartBtn: HTMLButtonElement | null = null

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement
    if (!this.canvas) {
      throw new Error(`Canvas element with id '${canvasId}' not found`)
    }

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0a0a12)
    this.scene.fog = new THREE.Fog(0x0a0a12, 8, 25)

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.1

    this.clock = new THREE.Clock()

    this.maze = new Maze()
    this.scene.add(this.maze.group)

    this.player = new Player(this.maze, this.canvas)
    this.scene.add(this.player.mesh)
    this.scene.add(this.player.playerLight)

    const orbPositions = this.maze.getRandomEmptyPositions(ORB_COUNT)
    this.orbSystem = new LightOrbSystem(orbPositions, this.scene, this.player)
    this.scene.add(this.orbSystem.group)

    const enemyPositions = this.maze.getRandomEmptyPositions(ENEMY_COUNT)
    this.enemySystem = new EnemySystem(this.maze, this.player, enemyPositions)
    this.scene.add(this.enemySystem.group)

    this.setupAmbientLight()
    this.setupUI()
    this.setupWindowEvents()
  }

  private setupAmbientLight(): void {
    const ambient = new THREE.AmbientLight(0x202035, 0.4)
    this.scene.add(ambient)

    const hemi = new THREE.HemisphereLight(0x404060, 0x101020, 0.3)
    this.scene.add(hemi)
  }

  private setupUI(): void {
    this.orbCountEl = document.getElementById('orb-count')
    this.lightRadiusEl = document.getElementById('light-radius')
    this.gameOverEl = document.getElementById('game-over')
    this.victoryEl = document.getElementById('victory')
    this.scoreEl = document.getElementById('score')
    this.victoryScoreEl = document.getElementById('victory-score')
    this.restartBtn = document.getElementById('restart-btn') as HTMLButtonElement
    this.victoryRestartBtn = document.getElementById(
      'victory-restart-btn'
    ) as HTMLButtonElement

    this.restartBtn?.addEventListener('click', () => this.restart())
    this.victoryRestartBtn?.addEventListener('click', () => this.restart())

    const resumeHandler = () => {
      this.enemySystem.resumeAudio()
      document.removeEventListener('click', resumeHandler)
      document.removeEventListener('keydown', resumeHandler)
    }
    document.addEventListener('click', resumeHandler)
    document.addEventListener('keydown', resumeHandler)
  }

  private setupWindowEvents(): void {
    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight)
    })
  }

  public start(): void {
    this.isRunning = true
    this.animate()
  }

  private animate = (): void => {
    if (!this.isRunning) return
    requestAnimationFrame(this.animate)

    const deltaTime = this.clock.getDelta()
    this.gameTime += deltaTime

    if (!this.isGameOver && !this.isVictory) {
      this.update(deltaTime, this.gameTime)
    }

    this.renderer.render(this.scene, this.player.camera)
  }

  private update(deltaTime: number, time: number): void {
    this.player.update()
    this.maze.update(deltaTime)
    this.orbSystem.update(deltaTime, time)

    const caught = this.enemySystem.update(deltaTime, time)
    if (caught) {
      this.endGame()
      return
    }

    this.checkVictory()
    this.updateHUD()
  }

  private checkVictory(): void {
    const dx = this.player.position.x - this.maze.exitPosition.x
    const dz = this.player.position.z - this.maze.exitPosition.z
    const dist = Math.sqrt(dx * dx + dz * dz)

    if (dist < VICTORY_DISTANCE) {
      this.victory()
    }
  }

  private updateHUD(): void {
    if (this.orbCountEl) {
      const collected = this.orbSystem.getCollectedCount()
      const total = this.orbSystem.getTotalCount()
      this.orbCountEl.textContent = `${collected} / ${total}`
    }
    if (this.lightRadiusEl) {
      this.lightRadiusEl.textContent = this.player.getTotalLightRadius().toFixed(1)
    }
  }

  private endGame(): void {
    this.isGameOver = true
    const score = this.player.collectedOrbs * 1000
    if (this.scoreEl) {
      this.scoreEl.textContent = score.toString()
    }
    if (this.gameOverEl) {
      this.gameOverEl.classList.remove('hidden')
    }
  }

  private victory(): void {
    this.isVictory = true
    const score = this.player.collectedOrbs * 1000 + 5000
    if (this.victoryScoreEl) {
      this.victoryScoreEl.textContent = score.toString()
    }
    if (this.victoryEl) {
      this.victoryEl.classList.remove('hidden')
    }
  }

  private restart(): void {
    this.isGameOver = false
    this.isVictory = false

    if (this.gameOverEl) {
      this.gameOverEl.classList.add('hidden')
    }
    if (this.victoryEl) {
      this.victoryEl.classList.add('hidden')
    }

    this.scene.remove(this.maze.group)
    this.scene.remove(this.player.mesh)
    this.scene.remove(this.player.playerLight)
    this.scene.remove(this.orbSystem.group)
    this.scene.remove(this.enemySystem.group)
    this.enemySystem.dispose()

    this.maze = new Maze()
    this.scene.add(this.maze.group)

    this.player.reset()
    this.scene.add(this.player.mesh)
    this.scene.add(this.player.playerLight)

    const orbPositions = this.maze.getRandomEmptyPositions(ORB_COUNT)
    this.orbSystem.reset(orbPositions)
    this.scene.add(this.orbSystem.group)

    const enemyPositions = this.maze.getRandomEmptyPositions(ENEMY_COUNT)
    this.enemySystem.reset(this.maze, this.player, enemyPositions)
    this.scene.add(this.enemySystem.group)

    this.gameTime = 0
    this.clock.start()
    this.updateHUD()
  }

  public destroy(): void {
    this.isRunning = false
    this.enemySystem.dispose()
    this.renderer.dispose()
  }
}
