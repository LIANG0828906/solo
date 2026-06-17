import { eventBus } from './EventBus'
import { useGameStore } from './state'
import { BeatManager } from './BeatManager'
import { PlayerController } from './Player'
import type { AudioAnalysisResult } from './AudioAnalyzer'

export class GameController {
  private beatManager: BeatManager
  private playerController: PlayerController
  private animationFrameId: number | null = null
  private audioElement: HTMLAudioElement | null = null
  private audioUrl: string | null = null
  private beatTimes: number[] = []
  private currentBeatIndex: number = 0
  private isRunning: boolean = false
  private gameTime: number = 0
  private lastFrameTime: number = 0
  private unsubscribers: Array<() => void> = []

  constructor() {
    this.beatManager = new BeatManager()
    this.playerController = new PlayerController()

    this.unsubscribers.push(eventBus.on('startGame', this.handleStartGame.bind(this)))
    this.unsubscribers.push(eventBus.on('pauseGame', this.handlePauseGame.bind(this)))
    this.unsubscribers.push(eventBus.on('resumeGame', this.handleResumeGame.bind(this)))
    this.unsubscribers.push(eventBus.on('restartGame', this.handleRestartGame.bind(this)))
    this.unsubscribers.push(eventBus.on('audioAnalyzed', this.handleAudioAnalyzed.bind(this)))
  }

  private handleAudioAnalyzed(bpm: number, beatTimes: number[]): void {
    this.beatTimes = beatTimes
    this.currentBeatIndex = 0
    useGameStore.getState().setBpm(bpm)
    useGameStore.getState().setBeatSyncTime(0)
  }

  setAudioFile(file: File, analysisResult: AudioAnalysisResult): void {
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl)
    }
    this.audioUrl = URL.createObjectURL(file)
    this.audioElement = new Audio(this.audioUrl)
    this.audioElement.crossOrigin = 'anonymous'

    eventBus.emit('audioAnalyzed', analysisResult.bpm, analysisResult.beatTimes)
    useGameStore.getState().setGameState('ready')
  }

  startDemo(): void {
    const demoBpm = 120
    const beatInterval = 60 / demoBpm
    const demoBeatTimes: number[] = []

    for (let i = 0; i < 1000; i++) {
      demoBeatTimes.push(i * beatInterval)
    }

    this.beatTimes = demoBeatTimes
    this.currentBeatIndex = 0
    useGameStore.getState().setBpm(demoBpm)
    useGameStore.getState().setBeatSyncTime(0)
    useGameStore.getState().setGameState('ready')
  }

  private handleStartGame(): void {
    if (!this.audioElement && this.beatTimes.length === 0) return

    useGameStore.getState().resetGame()
    useGameStore.getState().setGameState('playing')

    this.gameTime = 0
    this.lastFrameTime = performance.now()
    this.currentBeatIndex = 0
    this.isRunning = true

    this.beatManager.reset()

    if (this.audioElement) {
      this.audioElement.currentTime = 0
      this.audioElement.play().catch((e) => console.error('Audio play error:', e))
    }

    this.startGameLoop()
    this.playerController.attach()
  }

  private handlePauseGame(): void {
    useGameStore.getState().setGameState('paused')
    this.isRunning = false
    if (this.audioElement) {
      this.audioElement.pause()
    }
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  private handleResumeGame(): void {
    if (useGameStore.getState().gameState !== 'paused') return

    useGameStore.getState().setGameState('playing')
    this.isRunning = true
    this.lastFrameTime = performance.now()

    if (this.audioElement) {
      this.audioElement.play().catch((e) => console.error('Audio play error:', e))
    }

    this.startGameLoop()
  }

  private handleRestartGame(): void {
    this.handlePauseGame()
    useGameStore.getState().resetGame()
    useGameStore.getState().setGameState('ready')
    this.gameTime = 0
    this.currentBeatIndex = 0
  }

  private startGameLoop(): void {
    if (this.animationFrameId) return

    const loop = (currentTime: number) => {
      if (!this.isRunning) return

      const deltaTime = (currentTime - this.lastFrameTime) / 1000
      this.lastFrameTime = currentTime
      this.gameTime += deltaTime

      this.update(currentTime, deltaTime)

      this.animationFrameId = requestAnimationFrame(loop)
    }

    this.animationFrameId = requestAnimationFrame(loop)
  }

  private update(_currentTime: number, deltaTime: number): void {
    const state = useGameStore.getState()

    if (state.gameState !== 'playing') return

    useGameStore.getState().setBeatSyncTime(this.gameTime)

    while (
      this.currentBeatIndex < this.beatTimes.length &&
      this.beatTimes[this.currentBeatIndex] <= this.gameTime
    ) {
      const beatTime = this.beatTimes[this.currentBeatIndex]
      eventBus.emit('beat', beatTime)
      useGameStore.getState().setBeatPulse(1)
      this.currentBeatIndex++
    }

    const pulse = state.beatPulse
    if (pulse > 0) {
      useGameStore.getState().setBeatPulse(Math.max(0, pulse - deltaTime * 3))
    }

    this.beatManager.update(this.gameTime, deltaTime)
    this.playerController.update(deltaTime)
    this.checkCollisions()
    this.updateParticles(deltaTime)
    this.updateScorePopups(deltaTime)
    this.updateScreenShake(deltaTime)
    this.updateLevelUp(deltaTime)
    this.checkDifficultyUp()
  }

  private checkCollisions(): void {
    const state = useGameStore.getState()
    if (state.gameState !== 'playing' || state.isHit) return

    const playerLane = state.playerPos
    const playerY = 500

    for (const note of state.notes) {
      if (note.collected) continue
      if (note.lane !== playerLane) continue

      const distance = Math.abs(note.y - playerY)
      if (distance < 40) {
        this.collectNote(note.id)
      }
    }

    for (const obstacle of state.obstacles) {
      if (obstacle.hit) continue
      if (obstacle.lane !== playerLane) continue

      const obstacleBottom = obstacle.y + 30
      const obstacleTop = obstacle.y - 30

      if (playerY >= obstacleTop && playerY <= obstacleBottom) {
        this.hitObstacle(obstacle.id)
        break
      }
    }
  }

  private collectNote(noteId: string): void {
    const state = useGameStore.getState()
    const note = state.notes.find((n) => n.id === noteId)
    if (!note || note.collected) return

    useGameStore.getState().collectNote(noteId)
    useGameStore.getState().addScore(note.isStrongBeat ? 100 : 50)
    useGameStore.getState().incrementCollectedNotes()
    eventBus.emit('noteCollected', noteId)

    const laneX = 60 + note.lane * 120
    this.spawnCollectParticles(laneX, note.y, note.isStrongBeat ? '#FFD700' : '#FF7F50')
    this.spawnScorePopup(laneX, note.y, note.isStrongBeat ? 100 : 50)

    setTimeout(() => {
      useGameStore.getState().removeNote(noteId)
    }, 100)
  }

  private hitObstacle(obstacleId: string): void {
    const state = useGameStore.getState()
    if (state.isHit) return

    useGameStore.getState().hitObstacle(obstacleId)
    useGameStore.getState().setIsHit(true)
    useGameStore.getState().setScreenShake(15)
    eventBus.emit('obstacleHit', obstacleId)

    if (this.audioElement) {
      this.audioElement.pause()
    }

    setTimeout(() => {
      useGameStore.getState().setGameState('gameover')
      this.isRunning = false
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId)
        this.animationFrameId = null
      }
    }, 500)
  }

  private spawnCollectParticles(x: number, y: number, color: string): void {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8
      const speed = 2 + Math.random() * 3
      const particle = {
        id: `particle_${Date.now()}_${i}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5,
        maxLife: 0.5,
        color,
        size: 4 + Math.random() * 4,
      }
      useGameStore.getState().addParticle(particle)
    }
  }

  private spawnScorePopup(x: number, y: number, value: number): void {
    const popup = {
      id: `popup_${Date.now()}`,
      x,
      y,
      value,
      life: 1,
      maxLife: 1,
    }
    useGameStore.getState().addScorePopup(popup)
  }

  private updateParticles(deltaTime: number): void {
    const state = useGameStore.getState()
    const updated = state.particles
      .map((p) => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        life: p.life - deltaTime,
      }))
      .filter((p) => p.life > 0)

    if (updated.length !== state.particles.length || updated.some((p, i) => p !== state.particles[i])) {
      useGameStore.setState({ particles: updated })
    }
  }

  private updateScorePopups(deltaTime: number): void {
    const state = useGameStore.getState()
    const updated = state.scorePopups
      .map((p) => ({
        ...p,
        y: p.y - 30 * deltaTime,
        life: p.life - deltaTime,
      }))
      .filter((p) => p.life > 0)

    if (updated.length !== state.scorePopups.length || updated.some((p, i) => p !== state.scorePopups[i])) {
      useGameStore.setState({ scorePopups: updated })
    }
  }

  private updateScreenShake(deltaTime: number): void {
    const state = useGameStore.getState()
    if (state.screenShake > 0) {
      useGameStore.getState().setScreenShake(Math.max(0, state.screenShake - deltaTime * 50))
    }
  }

  private updateLevelUp(deltaTime: number): void {
    const state = useGameStore.getState()
    if (state.showLevelUp) {
      const newTime = state.levelUpTime + deltaTime
      useGameStore.getState().setLevelUpTime(newTime)
      if (newTime >= 0.5) {
        useGameStore.getState().setShowLevelUp(false)
        useGameStore.getState().setLevelUpTime(0)
      }
    }
  }

  private checkDifficultyUp(): void {
    const state = useGameStore.getState()
    const targetNotes = state.difficulty * 20

    if (state.collectedNotes >= targetNotes && state.difficulty < 10) {
      useGameStore.getState().incrementDifficulty()
      useGameStore.getState().setShowLevelUp(true)
      useGameStore.getState().setLevelUpTime(0)
      eventBus.emit('levelUp', state.difficulty + 1)
    }
  }

  destroy(): void {
    this.isRunning = false
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl)
    }
    if (this.audioElement) {
      this.audioElement.pause()
      this.audioElement = null
    }
    this.playerController.detach()
    this.beatManager.destroy()
    this.unsubscribers.forEach((unsub) => unsub())
    this.unsubscribers = []
  }
}
