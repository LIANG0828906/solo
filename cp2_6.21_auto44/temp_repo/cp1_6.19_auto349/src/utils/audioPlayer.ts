import type { Song } from '../store/useDiaryStore'

type Listener = (playing: boolean, songId: string | null) => void

class AudioPlayer {
  private ctx: AudioContext | null = null
  private currentOsc: OscillatorNode | null = null
  private currentGain: GainNode | null = null
  private playingSongId: string | null = null
  private listeners: Set<Listener> = new Set()
  private scheduledStop: number | null = null

  private ensureCtx() {
    if (!this.ctx) {
      const AC =
        (window as unknown as { AudioContext: typeof AudioContext }).AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new AC()
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
    return this.ctx
  }

  private emit() {
    this.listeners.forEach((l) => l(this.isPlaying(), this.playingSongId))
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  isPlaying() {
    return this.currentOsc !== null
  }

  getPlayingSongId() {
    return this.playingSongId
  }

  play(song: Song, durationMs = 8000) {
    const ctx = this.ensureCtx()
    this.stop()

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.value = song.frequency

    lfo.type = 'sine'
    lfo.frequency.value = 3
    lfoGain.gain.value = song.frequency * 0.02
    lfo.connect(lfoGain)
    lfoGain.connect(osc.frequency)

    const attack = 0.08
    const release = 0.4
    const totalSec = durationMs / 1000
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.18, now + attack)
    gain.gain.setValueAtTime(0.18, now + totalSec - release)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + totalSec)

    const osc2 = ctx.createOscillator()
    osc2.type = 'triangle'
    osc2.frequency.value = song.frequency * 2
    const gain2 = ctx.createGain()
    gain2.gain.setValueAtTime(0, now)
    gain2.gain.linearRampToValueAtTime(0.06, now + attack)
    gain2.gain.setValueAtTime(0.06, now + totalSec - release)
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + totalSec)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)

    osc.start(now)
    osc2.start(now)
    lfo.start(now)
    osc.stop(now + totalSec)
    osc2.stop(now + totalSec)
    lfo.stop(now + totalSec)

    this.currentOsc = osc
    this.currentGain = gain
    this.playingSongId = song.id

    osc.onended = () => {
      if (this.currentOsc === osc) {
        this.currentOsc = null
        this.currentGain = null
        this.playingSongId = null
        this.emit()
      }
    }

    if (this.scheduledStop !== null) {
      window.clearTimeout(this.scheduledStop)
    }
    this.scheduledStop = window.setTimeout(() => {
      this.scheduledStop = null
    }, durationMs + 100)

    this.emit()
  }

  stop() {
    const ctx = this.ctx
    if (ctx && this.currentOsc && this.currentGain) {
      const now = ctx.currentTime
      try {
        this.currentGain.gain.cancelScheduledValues(now)
        this.currentGain.gain.setValueAtTime(this.currentGain.gain.value, now)
        this.currentGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1)
        this.currentOsc.stop(now + 0.12)
      } catch {
        /* noop */
      }
    }
    this.currentOsc = null
    this.currentGain = null
    this.playingSongId = null
    this.emit()
  }
}

export const audioPlayer = new AudioPlayer()
