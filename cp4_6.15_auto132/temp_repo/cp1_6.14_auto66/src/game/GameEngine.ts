import { Howl } from 'howler'
import type { Song, Section, WordFragment, Particle, GameState, GameStatus } from '@/types'

type EventCallback = (event: string, data?: unknown) => void

export class GameEngine {
  private howl: Howl | null = null
  private audioCtx: AudioContext | null = null
  private animFrameId: number = 0
  private startTime: number = 0
  private pausedTime: number = 0
  private fragments: WordFragment[] = []
  private particles: Particle[] = []
  private capturedWords: string[] = []
  private currentSectionIndex: number = 0
  private errorCount: number = 0
  private score: number = 0
  private combo: number = 0
  private maxCombo: number = 0
  private lives: number = 5
  private gameStatus: GameStatus = 'idle'
  private song: Song | null = null
  private sectionStarted: boolean = false
  private particleIdCounter: number = 0
  private onEvent: EventCallback | null = null
  private lastFrameTime: number = 0
  private stars: Array<{x: number; y: number; size: number; twinkle: number; speed: number}> = []

  constructor(callback?: EventCallback) {
    this.onEvent = callback || null
    this.initStars()
  }

  private initStars() {
    this.stars = Array.from({ length: 80 }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() * 2 + 0.5,
      twinkle: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.5 + 0.3
    }))
  }

  getStars() { return this.stars }

  on(callback: EventCallback) {
    this.onEvent = callback
  }

  private emit(event: string, data?: unknown) {
    this.onEvent?.(event, data)
  }

  private ensureAudioCtx() {
    if (!this.audioCtx) {
      this.audioCtx = new AudioContext()
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume()
    }
  }

  private playDing() {
    this.ensureAudioCtx()
    const ctx = this.audioCtx!
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.05)
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.15)
  }

  private playVictoryChord() {
    this.ensureAudioCtx()
    const ctx = this.audioCtx!
    const freqs = [523.25, 659.25, 783.99]
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05 + i * 0.08)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.8)
    })
  }

  private playFailureSound() {
    this.ensureAudioCtx()
    const ctx = this.audioCtx!
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(200, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.5)
    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.5)
  }

  start(song: Song) {
    this.song = song
    this.currentSectionIndex = 0
    this.errorCount = 0
    this.score = 0
    this.combo = 0
    this.maxCombo = 0
    this.lives = 5
    this.capturedWords = []
    this.fragments = []
    this.particles = []
    this.gameStatus = 'playing'
    this.sectionStarted = false
    this.pausedTime = 0
    this.startTime = Date.now()

    if (song.audioSrc) {
      this.howl = new Howl({
        src: [song.audioSrc],
        onend: () => this.onSongEnd()
      })
      this.howl.play()
    }

    this.emit('stateChange', this.getState())
    this.startLoop()
  }

  stop() {
    this.gameStatus = 'idle'
    if (this.howl) {
      this.howl.stop()
      this.howl = null
    }
    cancelAnimationFrame(this.animFrameId)
    this.fragments = []
    this.particles = []
    this.emit('stateChange', this.getState())
  }

  pause() {
    if (this.gameStatus !== 'playing') return
    this.gameStatus = 'paused'
    this.pausedTime = Date.now()
    this.howl?.pause()
    cancelAnimationFrame(this.animFrameId)
    this.emit('stateChange', this.getState())
  }

  resume() {
    if (this.gameStatus !== 'paused') return
    this.gameStatus = 'playing'
    this.startTime += Date.now() - this.pausedTime
    this.howl?.play()
    this.startLoop()
    this.emit('stateChange', this.getState())
  }

  getElapsedTime(): number {
    if (this.gameStatus === 'paused') return (this.pausedTime - this.startTime) / 1000
    return (Date.now() - this.startTime) / 1000
  }

  getCurrentSection(): Section | null {
    if (!this.song) return null
    return this.song.sections[this.currentSectionIndex] || null
  }

  captureFragment(id: string) {
    const frag = this.fragments.find(f => f.id === id && !f.captured)
    if (!frag) return

    frag.captured = true
    frag.entering = false
    this.capturedWords.push(frag.text)
    this.playDing()

    this.emit('fragmentCaptured', { id, text: frag.text })
    this.emit('stateChange', this.getState())

    this.checkCombination()
  }

  removeCapturedWord(index: number) {
    if (index < 0 || index >= this.capturedWords.length) return
    const word = this.capturedWords[index]
    this.capturedWords.splice(index, 1)

    const frag = this.fragments.find(f => f.text === word && f.captured)
    if (frag) {
      frag.captured = false
    }

    this.errorCount++
    this.emit('wordRemoved', { index, word })
    this.emit('stateChange', this.getState())

    if (this.errorCount >= 3) {
      this.onSectionFailed()
    }
  }

  private checkCombination() {
    const section = this.getCurrentSection()
    if (!section) return

    const correct = section.lyrics
    const captured = this.capturedWords

    if (captured.length !== correct.length) return

    const isMatch = captured.every((word, i) => word === correct[i])
    if (isMatch) {
      this.onSectionComplete()
    } else if (captured.length === correct.length) {
      this.errorCount++
      this.emit('stateChange', this.getState())
      if (this.errorCount >= 3) {
        this.onSectionFailed()
      }
    }
  }

  private onSectionComplete() {
    this.combo++
    if (this.combo > this.maxCombo) this.maxCombo = this.combo
    this.score += 100 + this.combo * 20
    this.playVictoryChord()
    this.spawnCelebrationParticles()
    this.emit('sectionComplete', { sectionIndex: this.currentSectionIndex, combo: this.combo, score: this.score })

    setTimeout(() => {
      this.currentSectionIndex++
      this.errorCount = 0
      this.capturedWords = []
      this.sectionStarted = false

      if (this.currentSectionIndex >= (this.song?.sections.length || 0)) {
        this.onSongEnd()
      } else {
        this.emit('stateChange', this.getState())
      }
    }, 1200)
  }

  private onSectionFailed() {
    this.lives--
    this.combo = 0
    this.playFailureSound()
    this.emit('sectionFailed', { lives: this.lives })

    if (this.lives <= 0) {
      this.gameStatus = 'gameover'
      this.howl?.stop()
      cancelAnimationFrame(this.animFrameId)
      this.score = this.getCompletedSectionsCount() * 100 + this.maxCombo * 15
      this.emit('gameOver', { score: this.score, completedSections: this.getCompletedSectionsCount(), maxCombo: this.maxCombo })
      this.emit('stateChange', this.getState())
      return
    }

    setTimeout(() => {
      this.errorCount = 0
      this.capturedWords = []
      this.sectionStarted = false
      this.fragments = this.fragments.filter(f => f.captured).map(f => ({ ...f, captured: false }))
      this.fragments.forEach(f => { f.captured = false })
      this.emit('stateChange', this.getState())
    }, 600)
  }

  private getCompletedSectionsCount(): number {
    return this.currentSectionIndex
  }

  private onSongEnd() {
    this.score = this.getCompletedSectionsCount() * 100 + this.maxCombo * 15
    this.gameStatus = 'gameover'
    this.howl?.stop()
    cancelAnimationFrame(this.animFrameId)
    this.emit('gameOver', { score: this.score, completedSections: this.getCompletedSectionsCount(), maxCombo: this.maxCombo })
    this.emit('stateChange', this.getState())
  }

  private spawnSectionFragments() {
    const section = this.getCurrentSection()
    if (!section) return

    this.fragments = []
    const stageW = 80
    const stageH = 70

    section.lyrics.forEach((word, i) => {
      const beat = section.beats[i] || { volume: 0.5, pitch: 400, time: 0 }
      const normalizedVolume = Math.max(0.3, Math.min(1, beat.volume))
      const normalizedPitch = Math.max(200, Math.min(800, beat.pitch))

      const size = 18 + (normalizedVolume - 0.3) * 30 + (normalizedPitch - 200) / 600 * 14
      const hue = 200 + (normalizedPitch - 200) / 600 * 60
      const saturation = 60 + normalizedVolume * 40
      const lightness = 65 + normalizedVolume * 20
      const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`
      const glowColor = `hsla(${hue}, 80%, 70%, 0.6)`

      const animTypes: Array<'sine' | 'rotate' | 'sway'> = ['sine', 'rotate', 'sway']
      const animType = animTypes[i % 3]

      const margin = 10
      const x = margin + Math.random() * (stageW - 2 * margin)
      const y = margin + Math.random() * (stageH - 2 * margin)

      const side = Math.floor(Math.random() * 4)
      let originX = x, originY = y
      if (side === 0) originY = -10
      else if (side === 1) originY = 110
      else if (side === 2) originX = -10
      else originX = 110

      const frag: WordFragment = {
        id: `frag-${this.currentSectionIndex}-${i}`,
        text: word,
        x: originX,
        y: originY,
        originX: x,
        originY: y,
        size,
        color,
        glowColor,
        opacity: 0,
        rotation: Math.random() * 30 - 15,
        animationType: animType,
        animationOffset: Math.random() * Math.PI * 2,
        animationSpeed: 0.5 + Math.random() * 1.5,
        captured: false,
        beatIndex: i,
        entering: true
      }
      this.fragments.push(frag)
    })

    this.sectionStarted = true
  }

  private spawnCelebrationParticles() {
    const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6bd6']
    for (let i = 0; i < 40; i++) {
      this.particles.push({
        id: this.particleIdCounter++,
        x: 50,
        y: 80,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 5 - 2,
        size: Math.random() * 6 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
        maxLife: 1
      })
    }
  }

  private startLoop() {
    this.lastFrameTime = performance.now()
    const loop = (now: number) => {
      if (this.gameStatus !== 'playing') return
      const dt = Math.min((now - this.lastFrameTime) / 1000, 0.05)
      this.lastFrameTime = now
      this.update(dt)
      this.animFrameId = requestAnimationFrame(loop)
    }
    this.animFrameId = requestAnimationFrame(loop)
  }

  private update(dt: number) {
    const elapsed = this.getElapsedTime()
    const section = this.getCurrentSection()

    if (section && !this.sectionStarted && elapsed >= section.startTime) {
      this.spawnSectionFragments()
    }

    for (const frag of this.fragments) {
      if (frag.captured) continue

      if (frag.entering) {
        frag.x += (frag.originX - frag.x) * 3 * dt
        frag.y += (frag.originY - frag.y) * 3 * dt
        frag.opacity = Math.min(1, frag.opacity + 2 * dt)
        const dx = frag.originX - frag.x
        const dy = frag.originY - frag.y
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
          frag.entering = false
          frag.x = frag.originX
          frag.y = frag.originY
        }
      } else {
        const t = elapsed * frag.animationSpeed + frag.animationOffset
        switch (frag.animationType) {
          case 'sine':
            frag.x = frag.originX + Math.sin(t) * 3
            frag.y = frag.originY + Math.cos(t * 0.7) * 2
            break
          case 'rotate':
            frag.rotation = Math.sin(t * 0.8) * 20
            frag.x = frag.originX + Math.sin(t * 0.5) * 1.5
            frag.y = frag.originY + Math.cos(t * 0.5) * 1.5
            break
          case 'sway':
            frag.x = frag.originX + Math.sin(t) * 4
            frag.y = frag.originY + Math.sin(t * 1.3) * 1
            break
        }
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.x += p.vx * dt * 10
      p.y += p.vy * dt * 10
      p.vy += 1.5 * dt
      p.life -= dt * 1.2
      if (p.life <= 0) {
        this.particles.splice(i, 1)
      }
    }

    if (section && elapsed >= section.endTime && this.sectionStarted) {
      if (this.capturedWords.length === 0) {
        this.onSectionFailed()
      }
    }

    this.emit('update', this.getState())
  }

  getState(): GameState {
    const elapsed = this.getElapsedTime()
    const section = this.getCurrentSection()
    let sectionProgress = 0
    let songProgress = 0

    if (section) {
      const sectionDuration = section.endTime - section.startTime
      sectionProgress = Math.min(1, Math.max(0, (elapsed - section.startTime) / sectionDuration))
    }
    if (this.song) {
      songProgress = Math.min(1, elapsed / this.song.duration)
    }

    return {
      currentSong: this.song,
      currentSectionIndex: this.currentSectionIndex,
      score: this.score,
      combo: this.combo,
      maxCombo: this.maxCombo,
      lives: this.lives,
      isPlaying: this.gameStatus === 'playing',
      isPaused: this.gameStatus === 'paused',
      capturedWords: [...this.capturedWords],
      errorCount: this.errorCount,
      gameStatus: this.gameStatus,
      fragments: this.fragments.map(f => ({ ...f })),
      particles: this.particles.map(p => ({ ...p })),
      sectionProgress,
      songProgress,
      completedSections: this.getCompletedSectionsCount()
    }
  }
}
