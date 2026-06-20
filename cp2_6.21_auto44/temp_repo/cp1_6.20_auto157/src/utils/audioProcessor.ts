export interface WaveformData {
  samples: number[]
  duration: number
  sampleRate: number
}

export async function decodeAudioFile(file: File): Promise<WaveformData> {
  const arrayBuffer = await file.arrayBuffer()
  const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

  const channelData = audioBuffer.getChannelData(0)
  const samples: number[] = []
  const targetSamples = 1024
  const blockSize = Math.floor(channelData.length / targetSamples)

  for (let i = 0; i < targetSamples; i++) {
    let sum = 0
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(channelData[i * blockSize + j])
    }
    samples.push(sum / blockSize)
  }

  const max = Math.max(...samples)
  const normalized = samples.map((s) => (max > 0 ? s / max : 0))

  return {
    samples: normalized,
    duration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
  }
}

export class AudioAnalyzer {
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private audioElement: HTMLAudioElement | null = null
  private source: MediaElementAudioSourceNode | null = null
  private frequencyData: Uint8Array | null = null

  async init(audioUrl: string): Promise<void> {
    this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    this.analyser = this.audioContext.createAnalyser()
    this.analyser.fftSize = 256
    this.analyser.smoothingTimeConstant = 0.8

    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount)

    this.audioElement = new Audio(audioUrl)
    this.audioElement.crossOrigin = 'anonymous'

    this.source = this.audioContext.createMediaElementSource(this.audioElement)
    this.source.connect(this.analyser)
    this.analyser.connect(this.audioContext.destination)
  }

  getAudioElement(): HTMLAudioElement | null {
    return this.audioElement
  }

  getFrequencyData(): number[] {
    if (!this.analyser || !this.frequencyData) {
      return new Array(128).fill(0)
    }
    this.analyser.getByteFrequencyData(this.frequencyData)
    return Array.from(this.frequencyData).map((v) => v / 255)
  }

  play(): void {
    if (this.audioElement && this.audioContext) {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume()
      }
      this.audioElement.play()
    }
  }

  pause(): void {
    if (this.audioElement) {
      this.audioElement.pause()
    }
  }

  isPlaying(): boolean {
    return this.audioElement ? !this.audioElement.paused : false
  }

  destroy(): void {
    if (this.audioElement) {
      this.audioElement.pause()
      this.audioElement.src = ''
    }
    if (this.audioContext) {
      this.audioContext.close()
    }
  }
}
