import { useStore } from './store'

class AudioEngine {
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private source: AudioBufferSourceNode | null = null
  private gainNode: GainNode | null = null
  private audioBuffer: AudioBuffer | null = null
  private startedAt = 0
  private pausedAt = 0
  private _isPlaying = false
  private rafId = 0

  async loadFile(file: File): Promise<void> {
    this.stop()
    if (!this.audioContext) {
      this.audioContext = new AudioContext()
    }
    const arrayBuffer = await file.arrayBuffer()
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
    this.analyser = this.audioContext.createAnalyser()
    this.analyser.fftSize = 256
    this.gainNode = this.audioContext.createGain()
    this.gainNode.connect(this.audioContext.destination)
    this.analyser.connect(this.gainNode)
    useStore.getState().setDuration(this.audioBuffer.duration)
    useStore.getState().setAudioLoaded(true)
  }

  start(): void {
    if (!this.audioContext || !this.audioBuffer || !this.analyser) return
    if (this._isPlaying) return
    this.source = this.audioContext.createBufferSource()
    this.source.buffer = this.audioBuffer
    this.source.connect(this.analyser)
    const offset = this.pausedAt
    this.source.start(0, offset)
    this.startedAt = this.audioContext.currentTime - offset
    this._isPlaying = true
    useStore.getState().setPlaying(true)
    this.source.onended = () => {
      if (this._isPlaying) {
        this._isPlaying = false
        this.pausedAt = 0
        useStore.getState().setPlaying(false)
        useStore.getState().setCurrentTime(0)
      }
    }
    this.tick()
  }

  stop(): void {
    if (this.source) {
      this._isPlaying = false
      try { this.source.stop() } catch { /* noop */ }
      this.source.disconnect()
      this.source = null
    }
    if (this.audioContext && this._isPlaying) {
      this.pausedAt = this.audioContext.currentTime - this.startedAt
    }
    this._isPlaying = false
    cancelAnimationFrame(this.rafId)
    useStore.getState().setPlaying(false)
  }

  seek(time: number): void {
    const wasPlaying = this._isPlaying
    if (this._isPlaying) {
      this._isPlaying = false
      try { this.source?.stop() } catch { /* noop */ }
      this.source?.disconnect()
      this.source = null
    }
    this.pausedAt = time
    useStore.getState().setCurrentTime(time)
    if (wasPlaying) {
      this.start()
    }
  }

  getFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(128)
    const data = new Uint8Array(this.analyser.frequencyBinCount)
    this.analyser.getByteFrequencyData(data)
    return data
  }

  getTimeData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(128)
    const data = new Uint8Array(this.analyser.frequencyBinCount)
    this.analyser.getByteTimeDomainData(data)
    return data
  }

  isPlaying(): boolean {
    return this._isPlaying
  }

  getCurrentTime(): number {
    if (!this.audioContext) return 0
    if (this._isPlaying) {
      return this.audioContext.currentTime - this.startedAt
    }
    return this.pausedAt
  }

  getDuration(): number {
    return this.audioBuffer?.duration ?? 0
  }

  private tick = (): void => {
    if (!this._isPlaying) return
    const freq = this.getFrequencyData()
    const time = this.getTimeData()
    useStore.getState().setFrequencyData(freq)
    useStore.getState().setTimeData(time)
    useStore.getState().setCurrentTime(this.getCurrentTime())
    this.rafId = requestAnimationFrame(this.tick)
  }
}

export const audioEngine = new AudioEngine()
