export interface SpectrumData {
  frequencies: number[]
  waveform: number[]
  beatIntensity: number
}

type SpectrumCallback = (data: SpectrumData) => void

export class AudioEngine {
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private gainNode: GainNode | null = null
  private sourceNode: AudioBufferSourceNode | null = null
  private audioBuffer: AudioBuffer | null = null
  private startTime = 0
  private pausedAt = 0
  private isPlaying = false
  private spectrumCallback: SpectrumCallback | null = null
  private animationFrameId: number | null = null
  private frequencyData: Uint8Array | null = null
  private timeData: Uint8Array | null = null
  private barCount = 32
  private beatHistory: number[] = []
  private lastBeatTime = 0
  private beatIntensity = 0

  setBarCount(count: number): void {
    this.barCount = count
  }

  async loadFile(file: File): Promise<void> {
    this.cleanupAudio()

    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }

    const arrayBuffer = await file.arrayBuffer()
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)

    this.analyser = this.audioContext.createAnalyser()
    this.analyser.fftSize = 256
    this.analyser.smoothingTimeConstant = 0.8

    this.gainNode = this.audioContext.createGain()
    this.gainNode.gain.value = 0.7

    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount)
    this.timeData = new Uint8Array(this.analyser.frequencyBinCount)

    this.beatHistory = []
    this.beatIntensity = 0
  }

  play(): void {
    if (!this.audioContext || !this.audioBuffer || !this.analyser || !this.gainNode) return

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }

    this.sourceNode = this.audioContext.createBufferSource()
    this.sourceNode.buffer = this.audioBuffer
    this.sourceNode.connect(this.analyser)
    this.analyser.connect(this.gainNode)
    this.gainNode.connect(this.audioContext.destination)

    this.sourceNode.onended = () => {
      if (this.isPlaying) {
        this.isPlaying = false
        this.pausedAt = 0
        this.stopAnimation()
      }
    }

    this.startTime = this.audioContext.currentTime - this.pausedAt
    this.sourceNode.start(0, this.pausedAt)
    this.isPlaying = true
    this.startAnimation()
  }

  pause(): void {
    if (!this.isPlaying || !this.sourceNode || !this.audioContext) return

    this.sourceNode.stop()
    this.pausedAt = this.audioContext.currentTime - this.startTime
    this.isPlaying = false
    this.stopAnimation()
  }

  togglePlay(): void {
    if (this.isPlaying) {
      this.pause()
    } else {
      this.play()
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying
  }

  setVolume(value: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, value))
    }
  }

  getVolume(): number {
    return this.gainNode ? this.gainNode.gain.value : 0.7
  }

  getCurrentTime(): number {
    if (!this.isPlaying) return this.pausedAt
    if (!this.audioContext) return 0
    return this.audioContext.currentTime - this.startTime
  }

  getDuration(): number {
    return this.audioBuffer?.duration || 0
  }

  seek(time: number): void {
    const wasPlaying = this.isPlaying

    if (this.sourceNode) {
      this.sourceNode.stop()
      this.sourceNode.disconnect()
      this.sourceNode = null
    }

    this.pausedAt = Math.max(0, Math.min(time, this.getDuration()))

    if (wasPlaying) {
      this.play()
    }
  }

  setSpectrumCallback(callback: SpectrumCallback): void {
    this.spectrumCallback = callback
  }

  private startAnimation(): void {
    if (this.animationFrameId !== null) return

    const animate = () => {
      this.updateSpectrum()
      this.animationFrameId = requestAnimationFrame(animate)
    }
    this.animationFrameId = requestAnimationFrame(animate)
  }

  private stopAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  private updateSpectrum(): void {
    if (!this.analyser || !this.frequencyData || !this.timeData || !this.spectrumCallback) return

    this.analyser.getByteFrequencyData(this.frequencyData as unknown as Uint8Array<ArrayBuffer>)
    this.analyser.getByteTimeDomainData(this.timeData as unknown as Uint8Array<ArrayBuffer>)

    const frequencies = this.computeBars()
    const waveform = this.computeWaveform()
    const beatIntensity = this.detectBeat()

    this.spectrumCallback({
      frequencies,
      waveform,
      beatIntensity,
    })
  }

  private computeBars(): number[] {
    if (!this.frequencyData) return new Array(this.barCount).fill(0)

    const bars: number[] = []
    const binCount = this.frequencyData.length
    const logBase = Math.log(binCount) / Math.log(this.barCount)

    for (let i = 0; i < this.barCount; i++) {
      const start = Math.floor(Math.pow(i, logBase))
      const end = Math.max(start + 1, Math.floor(Math.pow(i + 1, logBase)))
      let sum = 0

      for (let j = start; j < end && j < binCount; j++) {
        sum += this.frequencyData[j]
      }

      const avg = sum / (end - start)
      const normalized = avg / 255
      bars.push(Math.pow(normalized, 1.5))
    }

    return bars
  }

  private computeWaveform(): number[] {
    if (!this.timeData) return []

    const waveform: number[] = []
    const samples = 128
    const step = Math.floor(this.timeData.length / samples)

    for (let i = 0; i < samples; i++) {
      const value = this.timeData[i * step]
      waveform.push((value - 128) / 128)
    }

    return waveform
  }

  private detectBeat(): number {
    if (!this.frequencyData) return 0

    const lowFreqRange = Math.floor(this.frequencyData.length * 0.1)
    let lowFreqSum = 0

    for (let i = 0; i < lowFreqRange; i++) {
      lowFreqSum += this.frequencyData[i]
    }

    const currentEnergy = lowFreqSum / lowFreqRange / 255

    this.beatHistory.push(currentEnergy)
    if (this.beatHistory.length > 60) {
      this.beatHistory.shift()
    }

    const avgEnergy = this.beatHistory.reduce((a, b) => a + b, 0) / this.beatHistory.length
    const variance = this.beatHistory.reduce((sum, val) => sum + Math.pow(val - avgEnergy, 2), 0) / this.beatHistory.length
    const threshold = avgEnergy + variance * 1.5

    const now = performance.now()
    if (currentEnergy > threshold && now - this.lastBeatTime > 150) {
      this.lastBeatTime = now
      this.beatIntensity = Math.min(1, (currentEnergy - avgEnergy) / Math.max(0.1, avgEnergy))
    } else {
      this.beatIntensity *= 0.92
    }

    return this.beatIntensity
  }

  private cleanupAudio(): void {
    this.stopAnimation()

    if (this.sourceNode) {
      try {
        this.sourceNode.stop()
      } catch (_) {}
      this.sourceNode.disconnect()
      this.sourceNode = null
    }

    if (this.analyser) {
      this.analyser.disconnect()
      this.analyser = null
    }

    if (this.gainNode) {
      this.gainNode.disconnect()
      this.gainNode = null
    }

    this.audioBuffer = null
    this.frequencyData = null
    this.timeData = null
    this.beatHistory = []
    this.beatIntensity = 0
    this.isPlaying = false
    this.pausedAt = 0
  }

  destroy(): void {
    this.cleanupAudio()

    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
  }
}
