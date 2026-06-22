import type { WaveformType, LFOTarget, ADSRParams, Note } from './types'

export class AudioEngine {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null
  private analyser: AnalyserNode | null = null
  private waveform: WaveformType = 'sine'
  private envelope: ADSRParams = {
    attack: 0.1,
    decay: 0.2,
    sustain: 0.7,
    release: 0.5
  }
  private lfoOscillator: OscillatorNode | null = null
  private lfoGain: GainNode | null = null
  private lfoTarget: LFOTarget = 'volume'
  private isLFOActive = false
  private scheduledNotes: { oscillator: OscillatorNode; gain: GainNode; stopTime: number }[] = []
  private waveformData: Float32Array
  private frequencyData: Uint8Array
  private onNotePlayCallback: ((frequency: number, velocity: number) => void) | null = null

  constructor() {
    this.waveformData = new Float32Array(2048)
    this.frequencyData = new Uint8Array(1024)
  }

  async init(): Promise<void> {
    if (this.audioContext) return
    this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    this.masterGain = this.audioContext.createGain()
    this.masterGain.gain.value = 0.3
    this.analyser = this.audioContext.createAnalyser()
    this.analyser.fftSize = 2048
    this.masterGain.connect(this.analyser)
    this.analyser.connect(this.audioContext.destination)
  }

  setOnNotePlayCallback(callback: (frequency: number, velocity: number) => void): void {
    this.onNotePlayCallback = callback
  }

  setWaveform(type: WaveformType): void {
    this.waveform = type
  }

  getWaveform(): WaveformType {
    return this.waveform
  }

  setEnvelope(adsr: ADSRParams): void {
    this.envelope = { ...adsr }
  }

  getEnvelope(): ADSRParams {
    return { ...this.envelope }
  }

  startLFO(frequency: number, target: LFOTarget): void {
    if (!this.audioContext) return
    this.stopLFO()
    this.lfoTarget = target
    this.isLFOActive = true
    this.lfoOscillator = this.audioContext.createOscillator()
    this.lfoGain = this.audioContext.createGain()
    this.lfoOscillator.type = 'sine'
    this.lfoOscillator.frequency.value = frequency
    this.lfoGain.gain.value = target === 'volume' ? 0.2 : target === 'pitch' ? 50 : 0.3
    this.lfoOscillator.connect(this.lfoGain)
    this.lfoOscillator.start()
  }

  stopLFO(): void {
    this.isLFOActive = false
    if (this.lfoOscillator) {
      try {
        this.lfoOscillator.stop()
      } catch (_) { /* ignore */ }
      this.lfoOscillator.disconnect()
      this.lfoOscillator = null
    }
    if (this.lfoGain) {
      this.lfoGain.disconnect()
      this.lfoGain = null
    }
  }

  isLFOEnabled(): boolean {
    return this.isLFOActive
  }

  getLFOTarget(): LFOTarget {
    return this.lfoTarget
  }

  playNote(frequency: number, velocity: number, startTime?: number): void {
    if (!this.audioContext || !this.masterGain) return
    const ctx = this.audioContext
    const now = startTime ?? ctx.currentTime
    const { attack, decay, sustain, release } = this.envelope
    const noteDuration = attack + decay + 0.1 + release
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    oscillator.type = this.waveform
    oscillator.frequency.value = frequency
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(velocity * 0.5, now + attack)
    gainNode.gain.linearRampToValueAtTime(velocity * 0.5 * sustain, now + attack + decay)
    gainNode.gain.setValueAtTime(velocity * 0.5 * sustain, now + noteDuration - release)
    gainNode.gain.linearRampToValueAtTime(0, now + noteDuration)
    if (this.isLFOActive && this.lfoGain) {
      if (this.lfoTarget === 'volume') {
        this.lfoGain.connect(gainNode.gain)
      } else if (this.lfoTarget === 'pitch') {
        this.lfoGain.connect(oscillator.frequency)
      }
    }
    oscillator.connect(gainNode)
    gainNode.connect(this.masterGain)
    oscillator.start(now)
    oscillator.stop(now + noteDuration)
    const scheduledNote = { oscillator, gain: gainNode, stopTime: now + noteDuration }
    this.scheduledNotes.push(scheduledNote)
    oscillator.onended = () => {
      const index = this.scheduledNotes.indexOf(scheduledNote)
      if (index > -1) {
        this.scheduledNotes.splice(index, 1)
      }
      gainNode.disconnect()
    }
    if (this.onNotePlayCallback) {
      this.onNotePlayCallback(frequency, velocity)
    }
  }

  stopNote(): void {
    for (const note of this.scheduledNotes) {
      try {
        note.oscillator.stop()
      } catch (_) { /* ignore */ }
      note.gain.disconnect()
    }
    this.scheduledNotes = []
  }

  playSequence(notes: Note[], loop: boolean = true, onLoopComplete?: () => void): () => void {
    if (!this.audioContext) return () => {}
    let isCancelled = false
    let startTime = this.audioContext.currentTime + 0.1
    const totalDuration = Math.max(...notes.map(n => n.startTime + n.duration)) + 0.5
    const scheduleLoop = () => {
      if (isCancelled || !this.audioContext) return
      const loopStart = startTime
      for (const note of notes) {
        this.playNote(note.frequency, note.velocity, loopStart + note.startTime)
      }
      startTime = loopStart + totalDuration
      const delay = (totalDuration - 0.1) * 1000
      setTimeout(() => {
        if (!isCancelled) {
          if (onLoopComplete) onLoopComplete()
          if (loop) scheduleLoop()
        }
      }, Math.max(50, delay))
    }
    scheduleLoop()
    return () => {
      isCancelled = true
      this.stopNote()
    }
  }

  getWaveformData(): Float32Array {
    if (this.analyser) {
      this.analyser.getFloatTimeDomainData(this.waveformData)
    }
    return this.waveformData
  }

  getFrequencyData(): Uint8Array {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(this.frequencyData)
    }
    return this.frequencyData
  }

  getCurrentTime(): number {
    return this.audioContext?.currentTime ?? 0
  }

  getSampleRate(): number {
    return this.audioContext?.sampleRate ?? 44100
  }

  generateWaveformPreview(type: WaveformType, samples: number = 512): Float32Array {
    const buffer = new Float32Array(samples)
    for (let i = 0; i < samples; i++) {
      const t = i / samples
      const phase = t * Math.PI * 2
      let value = 0
      switch (type) {
        case 'sine':
          value = Math.sin(phase)
          break
        case 'square':
          value = Math.sin(phase) >= 0 ? 1 : -1
          break
        case 'sawtooth':
          value = 2 * (t - Math.floor(t + 0.5))
          break
        case 'triangle':
          value = 2 * Math.abs(2 * (t - Math.floor(t + 0.5))) - 1
          break
      }
      buffer[i] = value
    }
    return buffer
  }
}

export const audioEngine = new AudioEngine()
