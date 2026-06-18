import { AudioFeatures } from './store'

export class AudioEngine {
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private dataArray: Uint8Array | null = null
  private source: MediaStreamAudioSourceNode | null = null
  private stream: MediaStream | null = null
  private isListening = false

  private energyHistory: number[] = []
  private peakTimes: number[] = []
  private lastBeatTime = 0
  private currentBpm = 0
  private readonly beatThreshold = 1.4
  private readonly minBeatInterval = 200

  private lowFreqBin = 0
  private highFreqBin = 0

  private smoothedLow = 0
  private smoothedHigh = 0

  async startListening(): Promise<void> {
    try {
      this.audioContext = new AudioContext()
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      })
      this.source = this.audioContext.createMediaStreamSource(this.stream)

      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 2048
      this.analyser.smoothingTimeConstant = 0.4

      this.source.connect(this.analyser)
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount)

      const sampleRate = this.audioContext.sampleRate
      const binSize = sampleRate / this.analyser.fftSize
      this.lowFreqBin = Math.floor(200 / binSize)
      this.highFreqBin = Math.floor(2000 / binSize)

      this.isListening = true
    } catch (err) {
      console.warn('Microphone access denied or unavailable:', err)
      this.isListening = false
    }
  }

  stopListening(): void {
    this.isListening = false
    this.source?.disconnect()
    this.stream?.getTracks().forEach(t => t.stop())
    this.audioContext?.close()
    this.audioContext = null
    this.analyser = null
    this.dataArray = null
    this.source = null
    this.stream = null
    this.energyHistory = []
    this.peakTimes = []
    this.currentBpm = 0
    this.smoothedLow = 0
    this.smoothedHigh = 0
  }

  getIsListening(): boolean {
    return this.isListening
  }

  getAudioFeatures(): AudioFeatures {
    const now = performance.now()

    if (!this.analyser || !this.dataArray || !this.isListening) {
      return {
        lowFreqEnergy: 0,
        highFreqEnergy: 0,
        bpm: 0,
        beatDetected: false,
        beatType: null,
        timestamp: now
      }
    }

    this.analyser.getByteFrequencyData(this.dataArray)

    let rawLow = 0
    for (let i = 0; i <= this.lowFreqBin; i++) {
      rawLow += this.dataArray[i]
    }
    rawLow /= (this.lowFreqBin + 1)

    let rawHigh = 0
    const binCount = this.dataArray.length
    for (let i = this.highFreqBin; i < binCount; i++) {
      rawHigh += this.dataArray[i]
    }
    rawHigh /= (binCount - this.highFreqBin)

    this.smoothedLow = this.smoothedLow * 0.7 + (rawLow / 255) * 0.3
    this.smoothedHigh = this.smoothedHigh * 0.7 + (rawHigh / 255) * 0.3

    const totalEnergy = (this.smoothedLow + this.smoothedHigh) / 2

    this.energyHistory.push(totalEnergy)
    if (this.energyHistory.length > 43) this.energyHistory.shift()

    const avgEnergy = this.energyHistory.length > 0
      ? this.energyHistory.reduce((a, b) => a + b, 0) / this.energyHistory.length
      : 0

    let beatDetected = false
    let beatType: 'low' | 'high' | null = null

    if (totalEnergy > avgEnergy * this.beatThreshold
      && totalEnergy > 0.08
      && now - this.lastBeatTime > this.minBeatInterval) {
      beatDetected = true
      this.lastBeatTime = now
      beatType = this.smoothedLow > this.smoothedHigh ? 'low' : 'high'

      this.peakTimes.push(now)
      if (this.peakTimes.length > 16) this.peakTimes.shift()

      if (this.peakTimes.length >= 3) {
        let totalInterval = 0
        let count = 0
        for (let i = 1; i < this.peakTimes.length; i++) {
          const interval = this.peakTimes[i] - this.peakTimes[i - 1]
          if (interval > 200 && interval < 2000) {
            totalInterval += interval
            count++
          }
        }
        if (count > 0) {
          const avgInterval = totalInterval / count
          this.currentBpm = Math.round(60000 / avgInterval)
          if (this.currentBpm > 300) this.currentBpm = 300
          if (this.currentBpm < 30) this.currentBpm = 0
        }
      }
    }

    return {
      lowFreqEnergy: this.smoothedLow,
      highFreqEnergy: this.smoothedHigh,
      bpm: this.currentBpm,
      beatDetected,
      beatType,
      timestamp: now
    }
  }
}
