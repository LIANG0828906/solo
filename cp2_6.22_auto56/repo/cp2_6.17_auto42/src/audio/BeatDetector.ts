export interface BeatDetectorCallbacks {
  onBeat: () => void
}

export class BeatDetector {
  private previousEnergy: number = 0
  private energyHistory: number[] = []
  private historySize: number = 43
  private lastBeatTime: number = 0
  private minBeatInterval: number = 150
  private callbacks: BeatDetectorCallbacks

  constructor(callbacks: BeatDetectorCallbacks) {
    this.callbacks = callbacks
  }

  analyze(spectrum: Float32Array): void {
    const currentEnergy = this.computeAverageEnergy(spectrum)

    if (this.energyHistory.length >= this.historySize) {
      this.energyHistory.shift()
    }
    this.energyHistory.push(currentEnergy)

    const historyAvg = this.energyHistory.reduce((a, b) => a + b, 0) / this.energyHistory.length
    const variance = this.energyHistory.reduce((sum, e) => sum + Math.pow(e - historyAvg, 2), 0) / this.energyHistory.length
    const sensitivity = -0.0025714 * variance + 1.5142857
    const threshold = historyAvg * Math.max(sensitivity, 1.3)

    const now = Date.now()
    if (
      currentEnergy > threshold &&
      this.previousEnergy > 0 &&
      currentEnergy > this.previousEnergy * 1.5 &&
      now - this.lastBeatTime > this.minBeatInterval
    ) {
      this.lastBeatTime = now
      this.callbacks.onBeat()
    }

    this.previousEnergy = currentEnergy
  }

  private computeAverageEnergy(spectrum: Float32Array): number {
    const lowEnd = Math.floor(spectrum.length * 0.05)
    const highEnd = Math.floor(spectrum.length * 0.35)
    let sum = 0
    for (let i = lowEnd; i < highEnd; i++) {
      sum += spectrum[i] * spectrum[i]
    }
    return sum / (highEnd - lowEnd)
  }

  reset(): void {
    this.previousEnergy = 0
    this.energyHistory = []
    this.lastBeatTime = 0
  }
}
