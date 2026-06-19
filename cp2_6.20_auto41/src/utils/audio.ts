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

export class BeatDetector {
  private energyHistory: number[] = []
  private readonly historySize: number = 60
  private readonly threshold: number = 1.3
  private lastBeatTime: number = 0
  private readonly minBeatInterval: number = 150

  detect(averageVolume: number, currentTime: number): boolean {
    this.energyHistory.push(averageVolume)

    if (this.energyHistory.length > this.historySize) {
      this.energyHistory.shift()
    }

    if (this.energyHistory.length < this.historySize) {
      return false
    }

    const averageEnergy =
      this.energyHistory.reduce((sum, val) => sum + val, 0) / this.energyHistory.length

    const variance =
      this.energyHistory.reduce((sum, val) => sum + Math.pow(val - averageEnergy, 2), 0) /
      this.energyHistory.length

    const dynamicThreshold = averageEnergy * this.threshold + Math.sqrt(variance) * 0.5

    const isBeat =
      averageVolume > dynamicThreshold && currentTime - this.lastBeatTime > this.minBeatInterval

    if (isBeat) {
      this.lastBeatTime = currentTime
    }

    return isBeat
  }

  reset(): void {
    this.energyHistory = []
    this.lastBeatTime = 0
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
