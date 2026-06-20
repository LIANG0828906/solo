import { EventEmitter } from 'events'

export type AudioState = 'idle' | 'playing' | 'paused' | 'stopped'

export class AudioGuide extends EventEmitter {
  private audioContext: AudioContext | null = null
  private oscillators: OscillatorNode[] = []
  private gainNode: GainNode | null = null
  private state: AudioState = 'idle'
  private duration: number = 0
  private startTime: number = 0
  private pausedAt: number = 0
  private progress: number = 0
  private progressInterval: number | null = null
  private currentExhibitId: string | null = null

  constructor() {
    super()
  }

  private initContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      this.gainNode = this.audioContext.createGain()
      this.gainNode.gain.value = 0.15
      this.gainNode.connect(this.audioContext.destination)
    }
  }

  load(exhibitId: string, duration: number) {
    this.stop()
    this.currentExhibitId = exhibitId
    this.duration = duration
    this.progress = 0
    this.state = 'idle'
    this.emit('loaded', { exhibitId, duration })
    this.emit('stateChange', this.state)
    this.emit('progress', 0)
  }

  play() {
    if (this.state === 'playing') return
    if (!this.currentExhibitId) return

    this.initContext()
    if (!this.audioContext || !this.gainNode) return

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }

    this.oscillators.forEach((o) => {
      try { o.stop() } catch { /* ignore */ }
    })
    this.oscillators = []

    const baseFreqs = [220, 277, 330, 392, 440, 523]
    const pattern = [0, 2, 4, 2, 0, 1, 3, 1, 0, 2, 4, 5, 4, 2, 0]
    const noteDuration = 0.35
    const startOffset = this.pausedAt

    pattern.forEach((step, i) => {
      const osc = this.audioContext!.createOscillator()
      const noteGain = this.audioContext!.createGain()
      osc.type = 'sine'
      osc.frequency.value = baseFreqs[step % baseFreqs.length]

      const noteStartTime = this.audioContext!.currentTime + Math.max(0, i * noteDuration - startOffset)
      const actualNoteDur = Math.max(0, noteDuration - Math.max(0, startOffset - i * noteDuration))
      if (actualNoteDur <= 0) return

      osc.connect(noteGain)
      noteGain.connect(this.gainNode!)
      noteGain.gain.setValueAtTime(0, noteStartTime)
      noteGain.gain.linearRampToValueAtTime(1, noteStartTime + 0.02)
      noteGain.gain.linearRampToValueAtTime(0, noteStartTime + actualNoteDur * 0.9)

      osc.start(noteStartTime)
      osc.stop(noteStartTime + actualNoteDur + 0.05)
      this.oscillators.push(osc)
    })

    this.startTime = this.audioContext.currentTime - this.pausedAt
    this.state = 'playing'
    this.emit('stateChange', this.state)
    this.emit('play', this.currentExhibitId)

    this.startProgressTracking()
  }

  private startProgressTracking() {
    if (this.progressInterval) {
      window.clearInterval(this.progressInterval)
    }
    this.progressInterval = window.setInterval(() => {
      if (this.state !== 'playing' || !this.audioContext) return
      const elapsed = this.audioContext.currentTime - this.startTime
      this.progress = Math.min(elapsed / this.duration, 1)
      this.emit('progress', this.progress)

      if (this.progress >= 1) {
        this.stop()
      }
    }, 50)
  }

  pause() {
    if (this.state !== 'playing' || !this.audioContext) return

    this.pausedAt = this.audioContext.currentTime - this.startTime
    this.oscillators.forEach((o) => {
      try { o.stop() } catch { /* ignore */ }
    })
    this.oscillators = []

    if (this.progressInterval) {
      window.clearInterval(this.progressInterval)
      this.progressInterval = null
    }

    this.state = 'paused'
    this.emit('stateChange', this.state)
    this.emit('pause', this.currentExhibitId)
  }

  stop() {
    this.oscillators.forEach((o) => {
      try { o.stop() } catch { /* ignore */ }
    })
    this.oscillators = []

    if (this.progressInterval) {
      window.clearInterval(this.progressInterval)
      this.progressInterval = null
    }

    this.pausedAt = 0
    this.progress = 0
    this.state = 'stopped'
    this.emit('stateChange', this.state)
    this.emit('progress', 0)
    this.emit('stop', this.currentExhibitId)
  }

  getState(): AudioState {
    return this.state
  }

  getProgress(): number {
    return this.progress
  }

  getDuration(): number {
    return this.duration
  }

  destroy() {
    this.stop()
    if (this.progressInterval) {
      window.clearInterval(this.progressInterval)
    }
    if (this.audioContext) {
      this.audioContext.close()
    }
  }
}
