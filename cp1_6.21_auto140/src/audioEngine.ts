export class AudioEngine {
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private sourceNode: AudioBufferSourceNode | null = null
  private gainNode: GainNode | null = null
  private audioBuffer: AudioBuffer | null = null
  private frequencyData: Uint8Array | null = null
  private timeDomainData: Uint8Array | null = null
  private startTime = 0
  private pauseTime = 0
  private _isPlaying = false
  private sampleRate = 44100
  private fftSize = 1024

  async decodeAudioFile(file: File): Promise<AudioBuffer> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext({ sampleRate: this.sampleRate })
    }

    const arrayBuffer = await file.arrayBuffer()
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)

    if (!this.analyser) {
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = this.fftSize
      this.analyser.smoothingTimeConstant = 0.8
      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount)
      this.timeDomainData = new Uint8Array(this.analyser.fftSize)
    }

    if (!this.gainNode) {
      this.gainNode = this.audioContext.createGain()
      this.gainNode.gain.value = 0.8
    }

    return this.audioBuffer
  }

  play(): void {
    if (!this.audioContext || !this.audioBuffer || !this.analyser || !this.gainNode) return

    if (this._isPlaying) return

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }

    this.sourceNode = this.audioContext.createBufferSource()
    this.sourceNode.buffer = this.audioBuffer
    this.sourceNode.connect(this.analyser)
    this.analyser.connect(this.gainNode)
    this.gainNode.connect(this.audioContext.destination)

    const offset = this.pauseTime % this.audioBuffer.duration
    this.sourceNode.start(0, offset)
    this.startTime = this.audioContext.currentTime - offset
    this._isPlaying = true

    this.sourceNode.onended = () => {
      if (this._isPlaying && this.getCurrentTime() >= this.audioBuffer!.duration) {
        this._isPlaying = false
        this.pauseTime = 0
      }
    }
  }

  pause(): void {
    if (!this.audioContext || !this.sourceNode || !this._isPlaying) return

    this.pauseTime = this.getCurrentTime()
    this.sourceNode.stop()
    this.sourceNode.disconnect()
    this.sourceNode = null
    this._isPlaying = false
  }

  stop(): void {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop()
      } catch (_) {
        /* ignore */
      }
      this.sourceNode.disconnect()
      this.sourceNode = null
    }
    this._isPlaying = false
    this.pauseTime = 0
  }

  seek(time: number): void {
    if (!this.audioBuffer) return

    const clampedTime = Math.max(0, Math.min(time, this.audioBuffer.duration))
    const wasPlaying = this._isPlaying

    if (this.sourceNode) {
      try {
        this.sourceNode.stop()
      } catch (_) {
        /* ignore */
      }
      this.sourceNode.disconnect()
      this.sourceNode = null
    }

    this.pauseTime = clampedTime
    this._isPlaying = false

    if (wasPlaying) {
      this.play()
    }
  }

  setVolume(value: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, value))
    }
  }

  getFrequencyData(): Uint8Array {
    if (this.analyser && this.frequencyData) {
      this.analyser.getByteFrequencyData(this.frequencyData)
    }
    return this.frequencyData ?? new Uint8Array(0)
  }

  getAmplitudeData(): Uint8Array {
    if (this.analyser && this.timeDomainData) {
      this.analyser.getByteTimeDomainData(this.timeDomainData)
    }
    return this.timeDomainData ?? new Uint8Array(0)
  }

  getBandEnergy(lowFreq: number, highFreq: number): number {
    if (!this.analyser || !this.audioContext || !this.frequencyData) return 0

    this.analyser.getByteFrequencyData(this.frequencyData)

    const nyquist = this.audioContext.sampleRate / 2
    const binCount = this.analyser.frequencyBinCount
    const lowBin = Math.floor((lowFreq / nyquist) * binCount)
    const highBin = Math.min(Math.ceil((highFreq / nyquist) * binCount), binCount - 1)

    let sum = 0
    let count = 0
    for (let i = lowBin; i <= highBin; i++) {
      sum += this.frequencyData[i]
      count++
    }

    return count > 0 ? sum / (count * 255) : 0
  }

  getCurrentTime(): number {
    if (!this.audioContext) return 0
    if (this._isPlaying) {
      return this.audioContext.currentTime - this.startTime
    }
    return this.pauseTime
  }

  getDuration(): number {
    return this.audioBuffer?.duration ?? 0
  }

  get isPlaying(): boolean {
    return this._isPlaying
  }

  get hasAudio(): boolean {
    return this.audioBuffer !== null
  }

  destroy(): void {
    this.stop()
    if (this.audioContext) {
      this.audioContext.close()
    }
  }
}
