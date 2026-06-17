export class AudioAnalyzer {
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private source: AudioBufferSourceNode | null = null
  private audioBuffer: AudioBuffer | null = null
  private spectrumData: Float32Array
  private waveformData: Float32Array
  private isPlaying: boolean = false
  private startTime: number = 0
  private pauseTime: number = 0

  constructor() {
    this.spectrumData = new Float32Array(256)
    this.waveformData = new Float32Array(256)
  }

  async init(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }
  }

  async decodeAudioFile(file: File): Promise<AudioBuffer> {
    await this.init()
    const arrayBuffer = await file.arrayBuffer()
    const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer)

    if (audioBuffer.duration > 30) {
      throw new Error('音频时长不能超过30秒')
    }

    this.audioBuffer = audioBuffer
    return audioBuffer
  }

  setupAnalysis(audioBuffer: AudioBuffer): void {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized')
    }

    this.analyser = this.audioContext.createAnalyser()
    this.analyser.fftSize = 512
    this.analyser.smoothingTimeConstant = 0.8

    this.source = this.audioContext.createBufferSource()
    this.source.buffer = audioBuffer
    this.source.connect(this.analyser)
    this.analyser.connect(this.audioContext.destination)
  }

  play(): void {
    if (!this.source || !this.audioBuffer) return

    if (this.isPlaying) return

    const offset = this.pauseTime > 0 ? this.pauseTime : 0
    this.source.start(0, offset)
    this.startTime = this.audioContext!.currentTime - offset
    this.isPlaying = true

    this.source.onended = () => {
      this.isPlaying = false
      this.pauseTime = 0
    }
  }

  pause(): void {
    if (!this.source || !this.isPlaying) return

    this.source.stop()
    this.pauseTime = this.audioContext!.currentTime - this.startTime
    this.isPlaying = false
  }

  stop(): void {
    if (this.source) {
      try {
        this.source.stop()
      } catch (e) {}
      this.source.disconnect()
      this.source = null
    }
    this.isPlaying = false
    this.pauseTime = 0
  }

  getSpectrum(): Float32Array {
    if (!this.analyser) return this.spectrumData

    const data = new Float32Array(this.analyser.frequencyBinCount)
    this.analyser.getFloatFrequencyData(data)
    
    const normalized = new Float32Array(data.length)
    for (let i = 0; i < data.length; i++) {
      const db = data[i]
      normalized[i] = Math.max(0, Math.min(1, (db + 100) / 100))
    }
    
    return normalized
  }

  getWaveform(): Float32Array {
    if (!this.analyser) return this.waveformData

    const data = new Float32Array(this.analyser.fftSize)
    this.analyser.getFloatTimeDomainData(data)
    return data
  }

  getEnergy(): number {
    const spectrum = this.getSpectrum()
    let sum = 0
    for (let i = 0; i < spectrum.length; i++) {
      sum += spectrum[i]
    }
    return sum / spectrum.length
  }

  getBandEnergy(band: 'low' | 'mid' | 'high'): number {
    const spectrum = this.getSpectrum()
    const length = spectrum.length
    let start: number, end: number

    switch (band) {
      case 'low':
        start = 0
        end = Math.floor(length * 0.2)
        break
      case 'mid':
        start = Math.floor(length * 0.2)
        end = Math.floor(length * 0.6)
        break
      case 'high':
        start = Math.floor(length * 0.6)
        end = length
        break
    }

    let sum = 0
    for (let i = start; i < end; i++) {
      sum += spectrum[i]
    }
    return sum / (end - start)
  }

  getIsPlaying(): boolean {
    return this.isPlaying
  }

  getDuration(): number {
    return this.audioBuffer?.duration || 0
  }

  getCurrentTime(): number {
    if (!this.isPlaying || !this.audioContext) return this.pauseTime
    return this.audioContext.currentTime - this.startTime
  }

  destroy(): void {
    this.stop()
    if (this.analyser) {
      this.analyser.disconnect()
      this.analyser = null
    }
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
  }
}
