import { audioManager, Difficulty, Song } from './AudioManager'

export type SlashDirection = 'up' | 'down' | 'left' | 'right'
export type NoteColor = 'red' | 'blue' | 'green' | 'yellow'

export interface NoteBlock {
  id: number
  spawnTime: number
  beatTime: number
  angle: number
  color: NoteColor
  direction: SlashDirection
  hit: boolean
  missed: boolean
  processed: boolean
}

export interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  color: string
  life: number
  maxLife: number
  size: number
}

export interface TrailPoint {
  x: number
  y: number
  time: number
}

export interface GameState {
  notes: NoteBlock[]
  particles: Particle[]
  trail: TrailPoint[]
  score: number
  maxHealth: number
  currentHealth: number
  heartBreakStates: number[]
  orbitRadius: number
  hitZoneRadius: number
  isGameOver: boolean
  combo: number
  perfectHits: number
  totalNotes: number
}

const COLOR_MAP: Record<NoteColor, string> = {
  red: '#ff4466',
  blue: '#4488ff',
  green: '#44ff88',
  yellow: '#ffdd44',
}

const DIRECTION_MAP: Record<NoteColor, SlashDirection> = {
  red: 'down',
  blue: 'left',
  green: 'right',
  yellow: 'up',
}

const COLORS: NoteColor[] = ['red', 'blue', 'green', 'yellow']

class GameEngine {
  private state: GameState
  private beatTimes: number[] = []
  private noteIdCounter = 0
  private particleIdCounter = 0
  private nextBeatIndex = 0
  private songDuration: number = 0
  private gameStartTime: number = 0
  private isRunning: boolean = false
  private animationFrameId: number = 0
  private onStateChange: (state: GameState) => void = () => {}
  private onGameOver: (score: number) => void = () => {}
  private canvasWidth: number = 0
  private canvasHeight: number = 0
  private isDragging: boolean = false
  private lastPointerPos: { x: number; y: number } | null = null
  private pointerDownTime: number = 0

  constructor() {
    this.state = this.createInitialState()
  }

  private createInitialState(): GameState {
    return {
      notes: [],
      particles: [],
      trail: [],
      score: 0,
      maxHealth: 5,
      currentHealth: 5,
      heartBreakStates: [0, 0, 0, 0, 0],
      orbitRadius: 500,
      hitZoneRadius: 80,
      isGameOver: false,
      combo: 0,
      perfectHits: 0,
      totalNotes: 0,
    }
  }

  setCanvasSize(width: number, height: number) {
    this.canvasWidth = width
    this.canvasHeight = height
    const isMobile = width < 768 && height > width
    this.state.orbitRadius = isMobile ? Math.min(width, height) * 0.35 : Math.min(width, height) * 0.38
    this.state.hitZoneRadius = this.state.orbitRadius * 0.16
  }

  getCenterX(): number {
    return this.canvasWidth / 2
  }

  getCenterY(): number {
    return this.canvasHeight / 2
  }

  setStateChangeCallback(callback: (state: GameState) => void) {
    this.onStateChange = callback
  }

  setGameOverCallback(callback: (score: number) => void) {
    this.onGameOver = callback
  }

  init(song: Song, difficulty: Difficulty) {
    this.state = this.createInitialState()
    this.beatTimes = audioManager.loadSong(song, difficulty)
    this.songDuration = song.duration
    this.nextBeatIndex = 0
    this.noteIdCounter = 0
    this.particleIdCounter = 0
    this.gameStartTime = 0
    this.state.totalNotes = this.beatTimes.length
    this.isRunning = false
  }

  start() {
    this.isRunning = true
    this.gameStartTime = performance.now()
    audioManager.play()
    this.loop()
  }

  stop() {
    this.isRunning = false
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }
    audioManager.reset()
  }

  getState(): GameState {
    return this.state
  }

  getNoteColor(color: NoteColor): string {
    return COLOR_MAP[color]
  }

  private loop = () => {
    if (!this.isRunning) return
    this.update()
    this.onStateChange(this.state)
    this.animationFrameId = requestAnimationFrame(this.loop)
  }

  private update() {
    const currentTime = this.getElapsedTime()
    this.spawnNotes(currentTime)
    this.updateNotes(currentTime)
    this.updateParticles()
    this.updateTrail()
    this.checkGameEnd(currentTime)
  }

  private getElapsedTime(): number {
    return audioManager.getCurrentTime()
  }

  private spawnNotes(currentTime: number) {
    const spawnLeadTime = 2.5
    
    while (this.nextBeatIndex < this.beatTimes.length) {
      const beatTime = this.beatTimes[this.nextBeatIndex]
      const spawnTime = beatTime - spawnLeadTime
      
      if (currentTime >= spawnTime) {
        this.spawnNote(beatTime, spawnTime)
        this.nextBeatIndex++
      } else {
        break
      }
    }
  }

  private spawnNote(beatTime: number, spawnTime: number) {
    const angle = Math.random() * Math.PI * 2
    const color = COLORS[Math.floor(Math.random() * COLORS.length)]
    const direction = DIRECTION_MAP[color]

    const note: NoteBlock = {
      id: this.noteIdCounter++,
      spawnTime,
      beatTime,
      angle,
      color,
      direction,
      hit: false,
      missed: false,
      processed: false,
    }

    this.state.notes.push(note)
  }

  private updateNotes(currentTime: number) {
    const missWindow = 0.4

    for (const note of this.state.notes) {
      if (note.processed) continue

      const timeToBeat = note.beatTime - currentTime

      if (timeToBeat < -missWindow) {
        this.handleMiss(note)
      }
    }

    this.state.notes = this.state.notes.filter(n => {
      if (n.hit) {
        return (performance.now() - (n as any).hitAnimTime) < 300
      }
      if (n.missed) {
        return (performance.now() - (n as any).missAnimTime) < 500
      }
      return n.beatTime - currentTime > -missWindow
    })
  }

  private updateParticles() {
    const dt = 1 / 60
    const gravity = 80

    for (const p of this.state.particles) {
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += gravity * dt
      p.vx *= 0.99
      p.vy *= 0.99
      p.life -= dt
    }

    this.state.particles = this.state.particles.filter(p => p.life > 0)
    
    if (this.state.particles.length > 200) {
      this.state.particles = this.state.particles.slice(-200)
    }
  }

  private updateTrail() {
    const now = performance.now()
    this.state.trail = this.state.trail.filter(p => now - p.time < 200)
  }

  private checkGameEnd(currentTime: number) {
    if (this.state.currentHealth <= 0 && !this.state.isGameOver) {
      this.state.isGameOver = true
      this.stop()
      this.onGameOver(this.state.score)
      return
    }

    const allNotesProcessed = this.nextBeatIndex >= this.beatTimes.length &&
      this.state.notes.filter(n => !n.processed).length === 0
    
    const songEnded = currentTime >= this.songDuration + 1

    if ((allNotesProcessed || songEnded) && !this.state.isGameOver && this.nextBeatIndex >= this.beatTimes.length) {
      if (currentTime > this.songDuration + 1) {
        this.state.isGameOver = true
        this.stop()
        this.onGameOver(this.state.score)
      }
    }
  }

  handlePointerDown(x: number, y: number) {
    this.isDragging = true
    this.lastPointerPos = { x, y }
    this.pointerDownTime = performance.now()
    this.state.trail = [{ x, y, time: performance.now() }]
  }

  handlePointerMove(x: number, y: number) {
    if (!this.isDragging) return
    this.state.trail.push({ x, y, time: performance.now() })
    
    if (this.state.trail.length > 20) {
      this.state.trail.shift()
    }

    if (this.lastPointerPos) {
      const dx = x - this.lastPointerPos.x
      const dy = y - this.lastPointerPos.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      
      if (dist > 20) {
        this.checkSlashHit(this.lastPointerPos.x, this.lastPointerPos.y, x, y)
        this.lastPointerPos = { x, y }
      }
    } else {
      this.lastPointerPos = { x, y }
    }
  }

  handlePointerUp() {
    this.isDragging = false
    this.lastPointerPos = null
  }

  private checkSlashHit(x1: number, y1: number, x2: number, y2: number) {
    const currentTime = this.getElapsedTime()
    const perfectWindow = 0.12
    const goodWindow = 0.25

    const slashDirection = this.getSlashDirection(x1, y1, x2, y2)
    if (!slashDirection) return

    const cx = this.getCenterX()
    const cy = this.getCenterY()

    for (const note of this.state.notes) {
      if (note.processed) continue

      const timeDiff = Math.abs(note.beatTime - currentTime)
      if (timeDiff > goodWindow) continue

      const noteProgress = 1 - (note.beatTime - currentTime) / 2.5
      const clampedProgress = Math.max(0, Math.min(1, noteProgress))
      const noteRadius = this.state.orbitRadius * (1 - clampedProgress)
      const noteX = cx + Math.cos(note.angle) * noteRadius
      const noteY = cy + Math.sin(note.angle) * noteRadius

      const noteSize = 40
      const lineDist = this.pointToLineDistance(noteX, noteY, x1, y1, x2, y2)

      if (lineDist < noteSize) {
        if (note.direction === slashDirection) {
          this.handleHit(note, noteX, noteY, timeDiff, perfectWindow)
        } else {
          this.handleWrongDirection(note, noteX, noteY)
        }
        return
      }
    }
  }

  private getSlashDirection(x1: number, y1: number, x2: number, y2: number): SlashDirection | null {
    const dx = x2 - x1
    const dy = y2 - y1
    const dist = Math.sqrt(dx * dx + dy * dy)
    
    if (dist < 30) return null

    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)

    if (absDx > absDy) {
      return dx > 0 ? 'right' : 'left'
    } else {
      return dy > 0 ? 'down' : 'up'
    }
  }

  private pointToLineDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const A = px - x1
    const B = py - y1
    const C = x2 - x1
    const D = y2 - y1

    const dot = A * C + B * D
    const lenSq = C * C + D * D
    let param = -1

    if (lenSq !== 0) param = dot / lenSq

    let xx, yy

    if (param < 0) {
      xx = x1
      yy = y1
    } else if (param > 1) {
      xx = x2
      yy = y2
    } else {
      xx = x1 + param * C
      yy = y1 + param * D
    }

    const dx = px - xx
    const dy = py - yy
    return Math.sqrt(dx * dx + dy * dy)
  }

  private handleHit(note: NoteBlock, noteX: number, noteY: number, timeDiff: number, perfectWindow: number) {
    note.hit = true
    note.processed = true
    ;(note as any).hitAnimTime = performance.now()

    const isPerfect = timeDiff <= perfectWindow
    const baseScore = isPerfect ? 300 : 100
    const comboBonus = Math.floor(this.state.combo / 10) * 50
    this.state.score += baseScore + comboBonus
    this.state.combo++
    if (isPerfect) {
      this.state.perfectHits++
    }

    this.spawnParticles(noteX, noteY, COLOR_MAP[note.color])
    audioManager.playSlashSound()
  }

  private handleWrongDirection(note: NoteBlock, noteX: number, noteY: number) {
    note.missed = true
    note.processed = true
    ;(note as any).missAnimTime = performance.now()
    this.loseHeart()
    this.state.combo = 0
    this.spawnMissParticles(noteX, noteY)
    audioManager.playMissSound()
  }

  private handleMiss(note: NoteBlock) {
    note.missed = true
    note.processed = true
    ;(note as any).missAnimTime = performance.now()
    this.loseHeart()
    this.state.combo = 0
    audioManager.playMissSound()
  }

  private loseHeart() {
    if (this.state.currentHealth > 0) {
      const heartIndex = this.state.maxHealth - this.state.currentHealth
      this.state.heartBreakStates[heartIndex] = 1
      this.state.currentHealth--
      
      setTimeout(() => {
        this.state.heartBreakStates[heartIndex] = 2
      }, 300)
    }
  }

  private spawnParticles(x: number, y: number, color: string) {
    const particleCount = 30
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.3
      const speed = 100 + Math.random() * 200
      this.state.particles.push({
        id: this.particleIdCounter++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50,
        color,
        life: 1.2,
        maxLife: 1.2,
        size: 4 + Math.random() * 6,
      })
    }
  }

  private spawnMissParticles(x: number, y: number) {
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 50 + Math.random() * 100
      this.state.particles.push({
        id: this.particleIdCounter++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: '#666666',
        life: 0.5,
        maxLife: 0.5,
        size: 3 + Math.random() * 4,
      })
    }
  }

  getNoteProgress(note: NoteBlock, currentTime: number): number {
    const total = 2.5
    const elapsed = currentTime - note.spawnTime
    return Math.max(0, Math.min(1, elapsed / total))
  }
}

export const gameEngine = new GameEngine()
