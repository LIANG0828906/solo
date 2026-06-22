import type { AudioDataPayload } from '../types'

type EventCallback = (data: AudioDataPayload) => void
type StateCallback = (isPlaying: boolean) => void
type ProgressCallback = (current: number, duration: number) => void
type LoadedCallback = (fileName: string, duration: number) => void

export class AudioController {
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private gainNode: GainNode | null = null
  private audioBuffer: AudioBuffer | null = null
  private sourceNode: AudioBufferSourceNode | null = null
  private frequencyData: Uint8Array
  private timeData: Uint8Array
  private animationId: number | null = null
  private startTime = 0
  private pausedAt = 0
  private isPlaying = false
  private fileName = ''
  private volume = 0.8

  private audioDataCallbacks: Set<EventCallback> = new Set()
  private stateCallbacks: Set<StateCallback> = new Set()
  private progressCallbacks: Set<ProgressCallback> = new Set()
  private loadedCallbacks: Set<LoadedCallback> = new Set()

  constructor() {
    this.frequencyData = new Uint8Array(0)
    this.timeData = new Uint8Array(0)
  }

  private ensureContext(): void {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 2048
      this.analyser.smoothingTimeConstant = 0.8
      this.gainNode = this.audioContext.createGain()
      this.gainNode.gain.value = this.volume
      this.gainNode.connect(this.audioContext.destination)
      this.analyser.connect(this.gainNode)
      const bufferLength = this.analyser.frequencyBinCount
      this.frequencyData = new Uint8Array(bufferLength)
      this.timeData = new Uint8Array(bufferLength)
    }
  }

  async loadFile(file: File): Promise<void> {
    this.ensureContext()
    this.stop()
    this.fileName = file.name
    const arrayBuffer = await file.arrayBuffer()
    if (!this.audioContext) throw new Error('AudioContext not initialized')
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
    this.loadedCallbacks.forEach(cb => cb(this.fileName, this.audioBuffer!.duration))
  }

  play(): void {
    if (!this.audioBuffer || !this.audioContext || !this.analyser) return
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }
    if (this.isPlaying) return
    this.sourceNode = this.audioContext.createBufferSource()
    this.sourceNode.buffer = this.audioBuffer
    this.sourceNode.connect(this.analyser)
    this.sourceNode.onended = () => {
      if (this.isPlaying) {
        this.isPlaying = false
        this.pausedAt = 0
        this.stateCallbacks.forEach(cb => cb(false))
        if (this.animationId) {
          cancelAnimationFrame(this.animationId)
          this.animationId = null
        }
      }
    }
    this.sourceNode.start(0, this.pausedAt)
    this.startTime = this.audioContext.currentTime - this.pausedAt
    this.isPlaying = true
    this.stateCallbacks.forEach(cb => cb(true))
    this.startAnalysis()
  }

  pause(): void {
    if (!this.isPlaying || !this.audioContext || !this.sourceNode) return
    this.pausedAt = this.audioContext.currentTime - this.startTime
    this.sourceNode.stop()
    this.sourceNode.disconnect()
    this.sourceNode = null
    this.isPlaying = false
    this.stateCallbacks.forEach(cb => cb(false))
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  stop(): void {
    if (this.sourceNode) {
      try { this.sourceNode.stop() } catch (_e) { /* noop */ }
      this.sourceNode.disconnect()
      this.sourceNode = null
    }
    this.isPlaying = false
    this.pausedAt = 0
    this.stateCallbacks.forEach(cb => cb(false))
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  setVolume(value: number): void {
    this.volume = Math.max(0, Math.min(1, value))
    if (this.gainNode) {
      this.gainNode.gain.value = this.volume
    }
  }

  getVolume(): number {
    return this.volume
  }

  seek(progress: number): void {
    if (!this.audioBuffer) return
    const wasPlaying = this.isPlaying
    this.pausedAt = Math.max(0, Math.min(this.audioBuffer.duration, progress))
    if (wasPlaying) {
      this.stop()
      this.play()
    }
  }

  getCurrentTime(): number {
    if (!this.audioContext) return this.pausedAt
    if (this.isPlaying) {
      return this.audioContext.currentTime - this.startTime
    }
    return this.pausedAt
  }

  getDuration(): number {
    return this.audioBuffer?.duration ?? 0
  }

  getSampleRate(): number {
    return this.audioContext?.sampleRate ?? 0
  }

  isAudioLoaded(): boolean {
    return this.audioBuffer !== null
  }

  getIsPlaying(): boolean {
    return this.isPlaying
  }

  private startAnalysis(): void {
    const analyze = () => {
      if (!this.analyser || !this.audioContext) return
      this.analyser.getByteFrequencyData(this.frequencyData)
      this.analyser.getByteTimeDomainData(this.timeData)
      const payload: AudioDataPayload = {
        frequencyData: this.frequencyData,
        timeData: this.timeData,
        sampleRate: this.audioContext.sampleRate
      }
      this.audioDataCallbacks.forEach(cb => cb(payload))
      this.progressCallbacks.forEach(cb => cb(this.getCurrentTime(), this.getDuration()))
      if (this.isPlaying) {
        this.animationId = requestAnimationFrame(analyze)
      }
    }
    analyze()
  }

  onAudioData(callback: EventCallback): () => void {
    this.audioDataCallbacks.add(callback)
    return () => this.audioDataCallbacks.delete(callback)
  }

  onStateChange(callback: StateCallback): () => void {
    this.stateCallbacks.add(callback)
    return () => this.stateCallbacks.delete(callback)
  }

  onProgress(callback: ProgressCallback): () => void {
    this.progressCallbacks.add(callback)
    return () => this.progressCallbacks.delete(callback)
  }

  onLoaded(callback: LoadedCallback): () => void {
    this.loadedCallbacks.add(callback)
    return () => this.loadedCallbacks.delete(callback)
  }

  dispose(): void {
    this.stop()
    if (this.gainNode) this.gainNode.disconnect()
    if (this.analyser) this.analyser.disconnect()
    if (this.audioContext) this.audioContext.close()
    this.audioDataCallbacks.clear()
    this.stateCallbacks.clear()
    this.progressCallbacks.clear()
    this.loadedCallbacks.clear()
  }
}
