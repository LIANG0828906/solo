import { useAudioStore } from '@/store/AudioStore'
import { BeatDetector } from './BeatDetector'

export class AudioEngine {
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private source: AudioNode | null = null
  private mediaStream: MediaStream | null = null
  private audioElement: HTMLAudioElement | null = null
  private gainNode: GainNode | null = null
  private animationFrameId: number | null = null
  private beatDetector: BeatDetector
  private fftSize: number = 512
  private spectrumData: Uint8Array = new Uint8Array(this.fftSize / 2)
  private floatSpectrum: Float32Array = new Float32Array(this.fftSize / 2)
  private isInitialized: boolean = false

  constructor() {
    this.beatDetector = new BeatDetector({
      onBeat: () => {
        useAudioStore.getState().triggerBeat()
      },
    })
  }

  private async ensureContext(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = this.fftSize
      this.analyser.smoothingTimeConstant = 0.8
      this.gainNode = this.audioContext.createGain()
      this.gainNode.gain.value = 0
      this.analyser.connect(this.gainNode)
      this.gainNode.connect(this.audioContext.destination)
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }
    this.isInitialized = true
  }

  async startMicrophone(): Promise<void> {
    this.stop()
    await this.ensureContext()

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.source = this.audioContext!.createMediaStreamSource(this.mediaStream)
      this.source.connect(this.analyser!)
      useAudioStore.getState().setSourceType('mic')
      this.startAnalysisLoop()
    } catch (error) {
      console.error('麦克风权限获取失败:', error)
      throw error
    }
  }

  async startFile(file: File): Promise<void> {
    this.stop()
    await this.ensureContext()

    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file)
      this.audioElement = new Audio(url)
      this.audioElement.crossOrigin = 'anonymous'
      this.audioElement.loop = true

      this.audioElement.oncanplay = async () => {
        try {
          this.source = this.audioContext!.createMediaElementSource(this.audioElement!)
          this.source.connect(this.analyser!)
          await this.audioElement!.play()
          useAudioStore.getState().setSourceType('file')
          this.startAnalysisLoop()
          resolve()
        } catch (err) {
          reject(err)
        }
      }

      this.audioElement.onerror = () => {
        reject(new Error('音频文件加载失败'))
      }
    })
  }

  private startAnalysisLoop(): void {
    const loop = () => {
      this.analyzeFrame()
      this.animationFrameId = requestAnimationFrame(loop)
    }
    loop()
  }

  private analyzeFrame(): void {
    if (!this.analyser || !this.isInitialized) return

    this.analyser.getByteFrequencyData(this.spectrumData)

    let totalVolume = 0
    for (let i = 0; i < this.spectrumData.length; i++) {
      const normalized = this.spectrumData[i] / 255
      this.floatSpectrum[i] = normalized
      totalVolume += this.spectrumData[i]
    }

    const avgVolume = totalVolume / this.spectrumData.length
    const volumePercent = Math.min(100, (avgVolume / 255) * 100 * 2)

    useAudioStore.getState().setSpectrum(new Float32Array(this.floatSpectrum))
    useAudioStore.getState().setVolume(volumePercent)

    this.beatDetector.analyze(this.floatSpectrum)

    const state = useAudioStore.getState()
    if (state.beat && Date.now() - state.beatTimestamp > 50) {
      useAudioStore.setState({ beat: false })
    }
  }

  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop())
      this.mediaStream = null
    }

    if (this.audioElement) {
      this.audioElement.pause()
      this.audioElement.src = ''
      this.audioElement = null
    }

    if (this.source) {
      try { this.source.disconnect() } catch (_) {}
      this.source = null
    }

    this.beatDetector.reset()
    useAudioStore.getState().reset()
  }

  destroy(): void {
    this.stop()
    if (this.gainNode) {
      try { this.gainNode.disconnect() } catch (_) {}
    }
    if (this.analyser) {
      try { this.analyser.disconnect() } catch (_) {}
    }
    if (this.audioContext) {
      try { this.audioContext.close() } catch (_) {}
      this.audioContext = null
    }
    this.analyser = null
    this.isInitialized = false
  }
}
