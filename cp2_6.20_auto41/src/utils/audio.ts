export function calculateFrequencyBands(
  frequencyData: Uint8Array
): { low: number; mid: number; high: number; average: number } {
  const length = frequencyData.length
  const lowEnd = Math.floor(length * 0.33)
  const midEnd = Math.floor(length * 0.66)

  let lowSum = 0
  let midSum = 0
  let highSum = 0
  let totalSum = 0

  for (let i = 0; i < length; i++) {
    const value = frequencyData[i]
    totalSum += value

    if (i < lowEnd) {
      lowSum += value
    } else if (i < midEnd) {
      midSum += value
    } else {
      highSum += value
    }
  }

  return {
    low: lowSum / lowEnd / 255,
    mid: midSum / (midEnd - lowEnd) / 255,
    high: highSum / (length - midEnd) / 255,
    average: totalSum / length / 255,
  }
}

export function calculateDetailedBands(
  frequencyData: Uint8Array,
  sampleRate: number = 44100,
  fftSize: number = 512
): { bandLow: number; bandMid: number; bandHigh: number; total: number } {
  const binCount = frequencyData.length
  const freqPerBin = sampleRate / fftSize

  const lowEndBin = Math.min(binCount - 1, Math.floor(250 / freqPerBin))
  const midEndBin = Math.min(binCount - 1, Math.floor(2000 / freqPerBin))
  const highStartBin = Math.max(0, Math.floor(2000 / freqPerBin))

  let sumLow = 0, sumMid = 0, sumHigh = 0, sumTotal = 0

  for (let i = 0; i < binCount; i++) {
    const val = frequencyData[i]
    sumTotal += val
    if (i <= lowEndBin) {
      sumLow += val
    } else if (i <= midEndBin) {
      sumMid += val
    } else if (i >= highStartBin) {
      sumHigh += val
    }
  }

  return {
    bandLow: sumLow,
    bandMid: sumMid,
    bandHigh: sumHigh,
    total: sumTotal,
  }
}

export function calculateRhythmDensity(
  beatTimestamps: number[],
  windowMs: number = 5000
): number {
  if (beatTimestamps.length < 2) return 0
  const now = performance.now()
  const recentBeats = beatTimestamps.filter((t) => now - t <= windowMs)
  if (recentBeats.length < 2) return 0
  const density = recentBeats.length / (windowMs / 1000)
  return Math.min(3, density)
}

export interface PeakDetectionResult {
  isPeak: boolean
  peakIntensity: number
  beatPeriod: number | null
}

export class BeatDetector {
  private energyHistory: number[] = []
  private peakHistory: number[] = []
  private waveformHistory: number[][] = []
  private readonly historySize: number = 60
  private readonly threshold: number = 1.35
  private lastBeatTime: number = 0
  private readonly minBeatInterval: number = 120
  private beatIntervals: number[] = []
  private currentBeatStrength: number = 0

  detect(averageVolume: number, currentTime: number): boolean {
    this.energyHistory.push(averageVolume)

    if (this.energyHistory.length > this.historySize) {
      this.energyHistory.shift()
    }

    if (this.energyHistory.length < this.historySize) {
      return false
    }

    const recentEnergies = this.energyHistory.slice(-43)
    const averageEnergy = recentEnergies.reduce((s, v) => s + v, 0) / recentEnergies.length

    const variance = recentEnergies.reduce((s, v) => s + Math.pow(v - averageEnergy, 2), 0) / recentEnergies.length

    const C = -0.0025714 * variance + 1.5142857
    const dynamicThreshold = averageEnergy * Math.min(C, this.threshold)

    const isBeat =
      averageVolume > dynamicThreshold &&
      currentTime - this.lastBeatTime > this.minBeatInterval &&
      this.isLocalPeak(this.energyHistory, this.energyHistory.length - 1)

    if (isBeat) {
      if (this.lastBeatTime > 0) {
        const interval = currentTime - this.lastBeatTime
        if (interval < 2000) {
          this.beatIntervals.push(interval)
          if (this.beatIntervals.length > 20) {
            this.beatIntervals.shift()
          }
        }
      }
      this.lastBeatTime = currentTime
      this.peakHistory.push(currentTime)
      if (this.peakHistory.length > 100) this.peakHistory.shift()
      this.currentBeatStrength = averageVolume
    }

    return isBeat
  }

  private isLocalPeak(arr: number[], idx: number): boolean {
    if (idx < 3 || idx >= arr.length - 3) return false
    const val = arr[idx]
    for (let i = 1; i <= 3; i++) {
      if (arr[idx - i] >= val || arr[idx + i] > val) return false
    }
    return true
  }

  detectFromWaveform(waveform: Uint8Array, currentTime: number): PeakDetectionResult {
    let energy = 0
    for (let i = 0; i < waveform.length; i++) {
      const normalized = (waveform[i] - 128) / 128
      energy += normalized * normalized
    }
    energy = Math.sqrt(energy / waveform.length)

    const waveformArr = Array.from(waveform)
    this.waveformHistory.push(waveformArr)
    if (this.waveformHistory.length > 30) this.waveformHistory.shift()

    const isBeat = this.detect(energy, currentTime)

    let beatPeriod: number | null = null
    if (this.beatIntervals.length >= 4) {
      const sorted = [...this.beatIntervals].sort((a, b) => a - b)
      const median = sorted[Math.floor(sorted.length / 2)]
      beatPeriod = median
    }

    return {
      isPeak: isBeat,
      peakIntensity: Math.min(1, energy * 2),
      beatPeriod,
    }
  }

  calculateAutocorrelation(waveform: Uint8Array): number[] {
    const n = waveform.length
    const result: number[] = new Array(n).fill(0)
    const normalized = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      normalized[i] = (waveform[i] - 128) / 128
    }
    for (let lag = 0; lag < n; lag++) {
      let sum = 0
      for (let i = 0; i < n - lag; i++) {
        sum += normalized[i] * normalized[i + lag]
      }
      result[lag] = sum / (n - lag)
    }
    return result
  }

  estimateBPM(): number | null {
    if (this.beatIntervals.length < 4) return null
    const sum = this.beatIntervals.reduce((s, v) => s + v, 0)
    const avgInterval = sum / this.beatIntervals.length
    return Math.round(60000 / avgInterval)
  }

  getBeatStrength(): number {
    const decay = 0.92
    this.currentBeatStrength *= decay
    return this.currentBeatStrength
  }

  reset(): void {
    this.energyHistory = []
    this.peakHistory = []
    this.waveformHistory = []
    this.beatIntervals = []
    this.lastBeatTime = 0
    this.currentBeatStrength = 0
  }
}

export function getSpectrumBarData(
  frequencyData: Uint8Array,
  barCount: number = 64
): number[] {
  const bars: number[] = []
  const dataLength = frequencyData.length
  const samplesPerBar = Math.floor(dataLength / barCount)

  for (let i = 0; i < barCount; i++) {
    let sum = 0
    const startIndex = i * samplesPerBar
    const endIndex = Math.min(startIndex + samplesPerBar, dataLength)

    for (let j = startIndex; j < endIndex; j++) {
      sum += frequencyData[j]
    }

    bars.push(sum / (endIndex - startIndex) / 255)
  }

  return bars
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function validateAudioFile(file: File): boolean {
  const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/x-wav']
  const validExtensions = ['.mp3', '.wav', '.ogg']

  if (validTypes.includes(file.type)) {
    return true
  }

  const fileName = file.name.toLowerCase()
  return validExtensions.some((ext) => fileName.endsWith(ext))
}
