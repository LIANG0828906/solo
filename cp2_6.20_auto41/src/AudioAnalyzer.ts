import { Howl } from 'howler'
import { BeatDetector, calculateFrequencyBands, validateAudioFile } from '@/utils/audio'
import { AudioAnalysisResult } from '@/types'

export class AudioAnalyzer {
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private source: MediaElementAudioSourceNode | null = null
  private gainNode: GainNode | null = null
  private howl: Howl | null = null
  private frequencyData: Uint8Array
  private waveformData: Uint8Array
  private beatDetector: BeatDetector
  private onAnalysisCallback: ((result: AudioAnalysisResult) => void) | null = null
  private onStateChangeCallback: ((state: { isPlaying: boolean; currentTime: number; duration: number }) => void) | null = null
  private animationFrameId: number | null = null
  private currentFileName: string = ''
  private isLoading: boolean = false

  constructor() {
    this.frequencyData = new Uint8Array(256)
    this.waveformData = new Uint8Array(256)
    this.beatDetector = new BeatDetector()
  }

  private async initAudioContext(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 512
      this.analyser.smoothingTimeConstant = 0.8
      this.gainNode = this.audioContext.createGain()
      this.analyser.connect(this.gainNode)
      this.gainNode.connect(this.audioContext.destination)
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }
  }

  async loadAudio(file: File): Promise<void> {
    if (!validateAudioFile(file)) {
      throw new Error('不支持的音频格式，请上传 mp3、wav 或 ogg 文件')
    }

    this.isLoading = true
    this.currentFileName = file.name

    await this.initAudioContext()
    this.cleanupExistingAudio()

    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file)

      this.howl = new Howl({
        src: [url],
        html5: true,
        format: ['mp3', 'wav', 'ogg'],
        onload: () => {
          this.connectAudioNode()
          this.isLoading = false
          resolve()
        },
        onloaderror: (_id, error) => {
          this.isLoading = false
          reject(new Error(`音频加载失败: ${error}`))
        },
        onplay: () => {
          this.notifyStateChange()
          this.startAnalysisLoop()
        },
        onpause: () => {
          this.notifyStateChange()
        },
        onstop: () => {
          this.notifyStateChange()
          this.stopAnalysisLoop()
        },
        onend: () => {
          this.notifyStateChange()
          this.stopAnalysisLoop()
        },
      })
    })
  }

  private connectAudioNode(): void {
    if (!this.howl || !this.analyser || !this.audioContext) return

    const howlAny = this.howl as unknown as { _sounds?: { _node?: HTMLAudioElement }[] }
    const audioElement = howlAny._sounds?.[0]?._node
    if (!audioElement) return

    try {
      if (this.source) {
        this.source.disconnect()
      }
      this.source = this.audioContext.createMediaElementSource(audioElement)
      this.source.connect(this.analyser)
    } catch {
      console.warn('音频节点已连接，跳过重复连接')
    }
  }

  private cleanupExistingAudio(): void {
    if (this.howl) {
      this.howl.unload()
      this.howl = null
    }
    if (this.source) {
      this.source.disconnect()
      this.source = null
    }
    this.stopAnalysisLoop()
    this.beatDetector.reset()
  }

  play(): void {
    if (this.howl && !this.howl.playing()) {
      this.howl.play()
    }
  }

  pause(): void {
    if (this.howl && this.howl.playing()) {
      this.howl.pause()
    }
  }

  togglePlay(): void {
    if (this.howl) {
      if (this.howl.playing()) {
        this.pause()
      } else {
        this.play()
      }
    }
  }

  stop(): void {
    if (this.howl) {
      this.howl.stop()
    }
  }

  private startAnalysisLoop(): void {
    const analyze = () => {
      if (!this.analyser || !this.howl?.playing()) {
        return
      }

      this.analyser.getByteFrequencyData(this.frequencyData)
      this.analyser.getByteTimeDomainData(this.waveformData)

      const bands = calculateFrequencyBands(this.frequencyData)
      const currentTime = performance.now()
      const isBeat = this.beatDetector.detect(bands.average, currentTime)

      const result: AudioAnalysisResult = {
        frequencyData: this.frequencyData.slice(),
        waveformData: this.waveformData.slice(),
        lowFrequency: bands.low,
        midFrequency: bands.mid,
        highFrequency: bands.high,
        averageVolume: bands.average,
        isBeat,
        timestamp: currentTime,
      }

      if (this.onAnalysisCallback) {
        this.onAnalysisCallback(result)
      }

      this.notifyStateChange()
      this.animationFrameId = requestAnimationFrame(analyze)
    }

    analyze()
  }

  private stopAnalysisLoop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  private notifyStateChange(): void {
    if (this.onStateChangeCallback && this.howl) {
      this.onStateChangeCallback({
        isPlaying: this.howl.playing(),
        currentTime: this.howl.seek() as number,
        duration: this.howl.duration(),
      })
    }
  }

  getFrequencyData(): Uint8Array {
    return this.frequencyData
  }

  getWaveformData(): Uint8Array {
    return this.waveformData
  }

  getLowFrequency(): number {
    const bands = calculateFrequencyBands(this.frequencyData)
    return bands.low
  }

  getMidFrequency(): number {
    const bands = calculateFrequencyBands(this.frequencyData)
    return bands.mid
  }

  getHighFrequency(): number {
    const bands = calculateFrequencyBands(this.frequencyData)
    return bands.high
  }

  getIsPlaying(): boolean {
    return this.howl?.playing() ?? false
  }

  getCurrentFileName(): string {
    return this.currentFileName
  }

  getIsLoading(): boolean {
    return this.isLoading
  }

  setOnAnalysisCallback(callback: (result: AudioAnalysisResult) => void): void {
    this.onAnalysisCallback = callback
  }

  setOnStateChangeCallback(
    callback: (state: { isPlaying: boolean; currentTime: number; duration: number }) => void
  ): void {
    this.onStateChangeCallback = callback
  }

  destroy(): void {
    this.stopAnalysisLoop()
    this.cleanupExistingAudio()
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    this.onAnalysisCallback = null
    this.onStateChangeCallback = null
  }
}
