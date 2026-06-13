import { Application, Container } from 'pixi.js'
import { Synthesizer } from './Synthesizer'
import { BulletManager } from './BulletManager'
import { PlayerUI } from './PlayerUI'
import { VFXManager } from './VFXManager'

export type WaveType = 'sine' | 'sawtooth' | 'square'

export interface PlayerData {
  id: number
  name: string
  health: number
  maxHealth: number
  waveType: WaveType
  position: { x: number; y: number }
  color: number
  glowColor: number
}

export class GameManager {
  private app: Application
  private container: Container
  private synthesizers: Synthesizer[] = []
  private bulletManager: BulletManager
  private playerUIs: PlayerUI[] = []
  private vfxManager: VFXManager
  private players: PlayerData[] = []
  private gameTime: number = 60
  private gameRunning: boolean = false
  private timerInterval: number | null = null
  private lastTime: number = 0
  private animationId: number = 0

  private player1Keys = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH']
  private player2Keys = ['KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote', 'Enter']
  private player1WaveKeys = ['Digit1', 'Digit2', 'Digit3']
  private player2WaveKeys = ['Digit7', 'Digit8', 'Digit9']

  private keyState = new Map<string, boolean>()

  init() {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    
    this.app = new Application({
      canvas,
      background: 0x0a0a0f,
      antialias: true,
    })

    this.container = new Container()
    this.app.stage.addChild(this.container)

    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight

    this.players = [
      {
        id: 1,
        name: 'PLAYER 1',
        health: 10,
        maxHealth: 10,
        waveType: 'sine',
        position: { x: screenWidth * 0.2, y: screenHeight * 0.5 },
        color: 0xbf00ff,
        glowColor: 0xbf00ff,
      },
      {
        id: 2,
        name: 'PLAYER 2',
        health: 10,
        maxHealth: 10,
        waveType: 'sine',
        position: { x: screenWidth * 0.8, y: screenHeight * 0.5 },
        color: 0x00ffff,
        glowColor: 0x00ffff,
      },
    ]

    this.synthesizers = [
      new Synthesizer(this.players[0]),
      new Synthesizer(this.players[1]),
    ]

    this.bulletManager = new BulletManager(this, this.container)
    this.vfxManager = new VFXManager(this.container)

    this.playerUIs = [
      new PlayerUI(this.app, this.players[0], true),
      new PlayerUI(this.app, this.players[1], false),
    ]

    window.addEventListener('keydown', this.handleKeyDown.bind(this))
    window.addEventListener('keyup', this.handleKeyUp.bind(this))
    window.addEventListener('resize', this.handleResize.bind(this))

    const startBtn = document.getElementById('startBtn')
    if (startBtn) {
      startBtn.addEventListener('click', this.startGame.bind(this))
    }

    this.updateUI()
    this.gameLoop()
  }

  private startGame() {
    const startScreen = document.getElementById('startScreen')
    if (startScreen) {
      startScreen.style.display = 'none'
    }

    this.gameRunning = true
    this.gameTime = 60
    this.players[0].health = 10
    this.players[1].health = 10

    this.timerInterval = window.setInterval(() => {
      this.gameTime--
      const timerEl = document.getElementById('timer')
      if (timerEl) {
        timerEl.textContent = this.gameTime.toString()
      }

      if (this.gameTime <= 0) {
        this.endGame()
      }
    }, 1000)
  }

  private endGame() {
    this.gameRunning = false
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
      this.timerInterval = null
    }

    const winner = this.players[0].health > this.players[1].health ? this.players[0] : 
                   this.players[1].health > this.players[0].health ? this.players[1] : null

    const gameOver = document.getElementById('gameOver')
    const winnerEl = document.getElementById('winner')
    const finalScore = document.getElementById('finalScore')

    if (gameOver && winnerEl && finalScore) {
      gameOver.classList.add('show')
      if (winner) {
        winnerEl.textContent = `${winner.name} WINS!`
        winnerEl.style.textShadow = winner.id === 1 
          ? '0 0 20px #bf00ff, 0 0 40px #bf00ff' 
          : '0 0 20px #00ffff, 0 0 40px #00ffff'
      } else {
        winnerEl.textContent = 'DRAW!'
        winnerEl.style.textShadow = '0 0 20px #bf00ff, 0 0 40px #00ffff'
      }
      finalScore.textContent = `P1: ${this.players[0].health.toFixed(1)} HP | P2: ${this.players[1].health.toFixed(1)} HP`
    }

    this.vfxManager.explosion(window.innerWidth / 2, window.innerHeight / 2, winner?.color || 0xffffff)
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (!this.gameRunning) return

    this.keyState.set(e.code, true)

    const player1Index = this.player1Keys.indexOf(e.code)
    const player2Index = this.player2Keys.indexOf(e.code)

    if (player1Index !== -1) {
      this.playNote(0, player1Index)
    } else if (player2Index !== -1) {
      this.playNote(1, player2Index)
    }

    const wave1Index = this.player1WaveKeys.indexOf(e.code)
    const wave2Index = this.player2WaveKeys.indexOf(e.code)

    if (wave1Index !== -1) {
      this.setWaveType(0, ['sine', 'sawtooth', 'square'][wave1Index] as WaveType)
    } else if (wave2Index !== -1) {
      this.setWaveType(1, ['sine', 'sawtooth', 'square'][wave2Index] as WaveType)
    }
  }

  private handleKeyUp(e: KeyboardEvent) {
    this.keyState.delete(e.code)
  }

  private playNote(playerId: number, noteIndex: number) {
    const player = this.players[playerId]
    const synthesizer = this.synthesizers[playerId]
    const playerUI = this.playerUIs[playerId]

    synthesizer.playNote(noteIndex)
    playerUI.notePressed(noteIndex)
    this.bulletManager.createBullet(playerId, noteIndex)
    this.vfxManager.noteEffect(player.position.x, player.position.y, noteIndex, player.color)
  }

  private setWaveType(playerId: number, waveType: WaveType) {
    const player = this.players[playerId]
    const playerUI = this.playerUIs[playerId]

    player.waveType = waveType
    playerUI.wavePressed(waveType)
  }

  takeDamage(playerId: number, damage: number) {
    if (!this.gameRunning) return

    const player = this.players[playerId]
    player.health = Math.max(0, player.health - damage)

    this.updateUI()

    if (player.health <= 0) {
      this.endGame()
    }
  }

  private updateUI() {
    this.playerUIs.forEach((ui, index) => {
      ui.updateHealth(this.players[index].health)
    })
  }

  private gameLoop(currentTime: number = 0) {
    const deltaTime = (currentTime - this.lastTime) / 1000
    this.lastTime = currentTime

    this.bulletManager.update(deltaTime)
    this.vfxManager.update(deltaTime)
    this.playerUIs.forEach(ui => ui.update(deltaTime))

    this.animationId = requestAnimationFrame(this.gameLoop.bind(this))
  }

  private handleResize() {
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
    
    try {
      const canvas = this.app.canvas
      if (canvas && canvas instanceof HTMLCanvasElement) {
        canvas.width = screenWidth
        canvas.height = screenHeight
      }
    } catch (e) {
      console.warn('Canvas resize skipped:', e)
    }
    
    this.players[0].position = { x: screenWidth * 0.2, y: screenHeight * 0.5 }
    this.players[1].position = { x: screenWidth * 0.8, y: screenHeight * 0.5 }

    if (this.playerUIs.length > 0) {
      this.playerUIs.forEach((ui, index) => {
        ui.resize(this.players[index].position)
      })
    }
  }

  getPlayerData(playerId: number): PlayerData {
    return this.players[playerId]
  }

  getPlayerUI(playerId: number): PlayerUI {
    return this.playerUIs[playerId]
  }

  getApp(): Application {
    return this.app
  }
}
