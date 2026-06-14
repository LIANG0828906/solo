export class AudioEngine {
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private source: AudioBufferSourceNode | null = null
  private gainNode: GainNode | null = null
  private waveformData: Uint8Array = new Uint8Array()
  private frequencyData: Uint8Array = new Uint8Array()
  private currentBuffer: AudioBuffer | null = null
  private startTime: number = 0
  private pauseTime: number = 0
  private isPaused: boolean = false

  async init(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 1024
      this.analyser.smoothingTimeConstant = 0.8
      this.gainNode = this.audioContext.createGain()
      this.gainNode.gain.value = 0.7
      this.analyser.connect(this.gainNode)
      this.gainNode.connect(this.audioContext.destination)
      this.updateDataArrays()
    }
  }

  async decodeAudioFile(file: File): Promise<AudioBuffer> {
    await this.init()
    const arrayBuffer = await file.arrayBuffer()
    const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer)
    this.currentBuffer = audioBuffer
    return audioBuffer
  }

  play(buffer?: AudioBuffer): void {
    if (!this.audioContext || !this.analyser || !this.gainNode) return

    this.stop()

    const audioBuffer = buffer || this.currentBuffer
    if (!audioBuffer) return

    this.source = this.audioContext.createBufferSource()
    this.source.buffer = audioBuffer
    this.source.connect(this.analyser)
    this.source.onended = () => {
      if (!this.isPaused) {
        this.source = null
        this.startTime = 0
        this.pauseTime = 0
      }
    }

    if (this.isPaused) {
      this.startTime = this.audioContext.currentTime - this.pauseTime
      this.source.start(0, this.pauseTime)
    } else {
      this.startTime = this.audioContext.currentTime
      this.source.start(0)
    }
    this.isPaused = false
  }

  pause(): void {
    if (this.source && this.audioContext) {
      this.pauseTime = this.audioContext.currentTime - this.startTime
      this.isPaused = true
      this.source.stop()
      this.source = null
    }
  }

  stop(): void {
    if (this.source) {
      try {
        this.source.onended = null
        this.source.stop()
      } catch (e) {
        // Source may already be stopped
      }
      this.source = null
    }
    this.isPaused = false
    this.pauseTime = 0
  }

  getWaveformData(): Uint8Array {
    if (this.analyser) {
      this.analyser.getByteTimeDomainData(this.waveformData)
    }
    return this.waveformData
  }

  getFrequencyData(): Uint8Array {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(this.frequencyData)
    }
    return this.frequencyData
  }

  setFftSize(size: number): void {
    if (this.analyser) {
      this.analyser.fftSize = size
      this.updateDataArrays()
    }
  }

  getFftSize(): number {
    return this.analyser?.fftSize || 1024
  }

  getCurrentTime(): number {
    if (!this.audioContext || this.startTime === 0) return 0
    if (this.isPaused) return this.pauseTime
    return this.audioContext.currentTime - this.startTime
  }

  getDuration(): number {
    return this.currentBuffer?.duration || 0
  }

  private updateDataArrays(): void {
    if (this.analyser) {
      const bufferLength = this.analyser.frequencyBinCount
      this.waveformData = new Uint8Array(bufferLength)
      this.frequencyData = new Uint8Array(bufferLength)
    }
  }

  close(): void {
    this.stop()
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    this.analyser = null
    this.gainNode = null
  }
}

export const audioEngine = new AudioEngine()
