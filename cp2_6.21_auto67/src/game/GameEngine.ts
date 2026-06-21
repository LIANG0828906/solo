import { EntityManager, Entity, CollisionCallback } from './EntityManager'

export interface GameState {
  score: number
  speed: number
  combo: number
  lives: number
  multiplier: number
  multiplierTime: number
  distance: number
  isRunning: boolean
  isGameOver: boolean
  highScore: number
  frameRate: number
  extraLives: number
  showFrameDropWarning: boolean
  speedBoostActive: boolean
  speedBoostTime: number
}

export type GameStatus = 'ready' | 'running' | 'paused' | 'gameover'

type SubscriberCallback = (state: GameState) => void

const INITIAL_SPEED = 5
const MAX_SPEED = 20
const SPEED_PER_COIN = 0.1
const SPEED_PER_OBSTACLE = 0.05
const BASE_SCORE_PER_COIN = 100
const COMBO_FOR_EXTRA_LIFE = 10
const MAX_EXTRA_LIVES = 3
const MULTIPLIER_DURATION = 5000
const SPEED_BOOST_DURATION = 2000
const OBSTACLE_DENSITY_INTERVAL = 5000
const OBSTACLE_DENSITY_INCREASE = 0.1
const TARGET_FPS = 60
const FPS_WARNING_THRESHOLD = 0.05

export class GameEngine {
  private state: GameState
  private entityManager: EntityManager
  private subscribers: Set<SubscriberCallback> = new Set()
  private animationFrameId: number | null = null
  private lastTime = 0
  private frameCount = 0
  private fpsUpdateTime = 0
  private currentFPS = 60
  private frameTimes: number[] = []
  private lastObstacleDensityUpdate = 0
  private audioContext: AudioContext | null = null
  private status: GameStatus = 'ready'
  private coinStreak = 0

  constructor() {
    const highScore = this.loadHighScore()

    this.state = {
      score: 0,
      speed: INITIAL_SPEED,
      combo: 0,
      lives: 3,
      multiplier: 1,
      multiplierTime: 0,
      distance: 0,
      isRunning: false,
      isGameOver: false,
      highScore,
      frameRate: 60,
      extraLives: 0,
      showFrameDropWarning: false,
      speedBoostActive: false,
      speedBoostTime: 0
    }

    const callbacks: CollisionCallback = {
      onCoinCollect: this.handleCoinCollect.bind(this),
      onObstacleHit: this.handleObstacleHit.bind(this),
      onSpeedBoost: this.handleSpeedBoost.bind(this),
      onGameOver: this.handleGameOver.bind(this),
      onObstacleCleared: this.handleObstacleCleared.bind(this)
    }

    this.entityManager = new EntityManager(callbacks)
  }

  private loadHighScore(): number {
    try {
      const saved = localStorage.getItem('nightRollerHighScore')
      return saved ? parseInt(saved, 10) : 0
    } catch {
      return 0
    }
  }

  private saveHighScore(): void {
    try {
      localStorage.setItem('nightRollerHighScore', this.state.highScore.toString())
    } catch {
      // Ignore storage errors
    }
  }

  private initAudio(): void {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
  }

  private playSound(frequencyStart: number, frequencyEnd: number, duration: number, type: OscillatorType = 'sine'): void {
    if (!this.audioContext) return

    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      oscillator.type = type
      oscillator.frequency.setValueAtTime(frequencyStart, this.audioContext.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(frequencyEnd, this.audioContext.currentTime + duration / 1000)

      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000)

      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + duration / 1000)
    } catch {
      // Ignore audio errors
    }
  }

  playJumpSound(): void {
    this.initAudio()
    this.playSound(400, 800, 200, 'sine')
  }

  playCoinSound(): void {
    this.initAudio()
    this.playSound(800, 1000, 100, 'triangle')
  }

  playHitSound(): void {
    this.initAudio()
    this.playSound(200, 100, 300, 'square')
  }

  subscribe(callback: SubscriberCallback): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback({ ...this.state }))
  }

  getState(): GameState {
    return { ...this.state }
  }

  getEntityManager(): EntityManager {
    return this.entityManager
  }

  getStatus(): GameStatus {
    return this.status
  }

  start(): void {
    if (this.status === 'running') return

    this.initAudio()

    if (this.status === 'ready' || this.status === 'gameover') {
      this.reset()
    }

    this.status = 'running'
    this.state.isRunning = true
    this.lastTime = performance.now()
    this.lastObstacleDensityUpdate = this.lastTime

    this.gameLoop()
  }

  stop(): void {
    this.status = 'paused'
    this.state.isRunning = false

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }

    this.notifySubscribers()
  }

  reset(): void {
    this.stop()

    this.state = {
      score: 0,
      speed: INITIAL_SPEED,
      combo: 0,
      lives: 3,
      multiplier: 1,
      multiplierTime: 0,
      distance: 0,
      isRunning: false,
      isGameOver: false,
      highScore: this.state.highScore,
      frameRate: 60,
      extraLives: 0,
      showFrameDropWarning: false,
      speedBoostActive: false,
      speedBoostTime: 0
    }

    this.coinStreak = 0
    this.entityManager.reset()
    this.status = 'ready'
    this.frameTimes = []
    this.frameCount = 0
    this.fpsUpdateTime = 0

    this.notifySubscribers()
  }

  jump(): void {
    if (this.status !== 'running') return

    const jumped = this.entityManager.jump()
    if (jumped) {
      this.playJumpSound()
    }
  }

  doubleJump(): void {
    if (this.status !== 'running') return

    const jumped = this.entityManager.doubleJump()
    if (jumped) {
      this.playJumpSound()
      this.state.speed = Math.min(this.state.speed * 1.05, MAX_SPEED)
      this.notifySubscribers()
    }
  }

  private gameLoop = (): void => {
    if (this.status !== 'running') return

    const currentTime = performance.now()
    const deltaTime = currentTime - this.lastTime
    this.lastTime = currentTime

    this.updateFPS(currentTime, deltaTime)
    this.update(currentTime, deltaTime)
    this.notifySubscribers()

    this.animationFrameId = requestAnimationFrame(this.gameLoop)
  }

  private updateFPS(currentTime: number, deltaTime: number): void {
    this.frameTimes.push(deltaTime)
    if (this.frameTimes.length > 60) {
      this.frameTimes.shift()
    }

    this.frameCount++

    if (currentTime - this.fpsUpdateTime >= 500) {
      const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
      this.currentFPS = 1000 / avgFrameTime
      this.state.frameRate = Math.round(this.currentFPS)
      this.fpsUpdateTime = currentTime

      const fpsDrop = (TARGET_FPS - this.currentFPS) / TARGET_FPS
      if (fpsDrop > FPS_WARNING_THRESHOLD) {
        this.state.showFrameDropWarning = true
        this.entityManager.setReducedQuality(true)
      } else {
        this.state.showFrameDropWarning = false
        this.entityManager.setReducedQuality(false)
      }
    }
  }

  private update(currentTime: number, deltaTime: number): void {
    let effectiveSpeed = this.state.speed
    if (this.state.speedBoostActive) {
      effectiveSpeed *= 2
      this.state.speedBoostTime -= deltaTime
      if (this.state.speedBoostTime <= 0) {
        this.state.speedBoostActive = false
      }
    }

    if (this.state.multiplierTime > 0) {
      this.state.multiplierTime -= deltaTime
      if (this.state.multiplierTime <= 0) {
        this.state.multiplier = 1
      }
    }

    if (currentTime - this.lastObstacleDensityUpdate >= OBSTACLE_DENSITY_INTERVAL) {
      this.entityManager.increaseObstacleDensity(OBSTACLE_DENSITY_INCREASE)
      this.lastObstacleDensityUpdate = currentTime
    }

    this.entityManager.update(effectiveSpeed, deltaTime)

    this.state.distance += effectiveSpeed
  }

  private handleCoinCollect(_entity: Entity): void {
    this.state.score += BASE_SCORE_PER_COIN * this.state.multiplier
    this.state.speed = Math.min(this.state.speed + SPEED_PER_COIN, MAX_SPEED)
    this.state.combo++
    this.coinStreak++

    this.playCoinSound()

    if (this.coinStreak >= 5) {
      this.state.multiplier = 2
      this.state.multiplierTime = MULTIPLIER_DURATION
      this.coinStreak = 0
    }

    if (this.state.combo % COMBO_FOR_EXTRA_LIFE === 0 && this.state.extraLives < MAX_EXTRA_LIVES) {
      this.state.extraLives++
    }

    this.notifySubscribers()
  }

  private handleObstacleHit(_entity: Entity): void {
    this.state.speed = Math.max(this.state.speed * 0.5, INITIAL_SPEED)
    this.state.lives--
    this.state.combo = 0
    this.coinStreak = 0
    this.state.multiplier = 1
    this.state.multiplierTime = 0

    this.playHitSound()

    if (this.state.lives <= 0) {
      if (this.state.extraLives > 0) {
        this.state.extraLives--
        this.state.lives = 1
      } else {
        this.handleGameOver()
      }
    }

    this.notifySubscribers()
  }

  private handleSpeedBoost(_entity: Entity): void {
    this.state.speedBoostActive = true
    this.state.speedBoostTime = SPEED_BOOST_DURATION
    this.notifySubscribers()
  }

  private handleObstacleCleared(): void {
    this.state.speed = Math.min(this.state.speed + SPEED_PER_OBSTACLE, MAX_SPEED)
    this.state.combo++

    if (this.state.combo % COMBO_FOR_EXTRA_LIFE === 0 && this.state.extraLives < MAX_EXTRA_LIVES) {
      this.state.extraLives++
    }

    this.notifySubscribers()
  }

  private handleGameOver(): void {
    this.stop()
    this.status = 'gameover'
    this.state.isGameOver = true

    if (this.state.score > this.state.highScore) {
      this.state.highScore = this.state.score
      this.saveHighScore()
    }

    this.notifySubscribers()
  }

  getCanvasSize(): { width: number; height: number } {
    return { width: 1000, height: 600 }
  }
}
