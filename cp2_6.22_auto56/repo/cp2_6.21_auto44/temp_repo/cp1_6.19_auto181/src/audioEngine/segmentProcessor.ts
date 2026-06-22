import type { WaveformSlice } from './waveformService'

export type EmotionType = 'excited' | 'melancholy' | 'restless' | 'ethereal' | 'energetic'

export interface EmotionConfig {
  label: string
  color: string
  threshold?: [number, number]
}

export interface AudioSegment {
  id: string
  start: number
  end: number
  emotion: EmotionType
  waveformThumb: number[]
}

export const EMOTION_CONFIG: Record<EmotionType, EmotionConfig> = {
  excited: { label: '兴奋', color: '#FF6B6B', threshold: [0.7, 1.0] },
  melancholy: { label: '忧郁', color: '#5B86E5', threshold: [0.0, 0.3] },
  restless: { label: '躁动', color: '#FFA94D', threshold: [0.5, 0.7] },
  ethereal: { label: '空灵', color: '#B197FC', threshold: [0.3, 0.5] },
  energetic: { label: '激昂', color: '#FF6B6B' }
}

export const EMOTION_OPTIONS: EmotionType[] = ['excited', 'melancholy', 'restless', 'ethereal', 'energetic']

export class SegmentProcessor {
  public async processSlices(slices: WaveformSlice[]): Promise<AudioSegment[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const segments = slices.map((slice, index) => {
          const energy = this.calculateSpectrumEnergy(slice.waveformData)
          const emotion = this.mapEnergyToEmotion(energy)
          const waveformThumb = this.generateThumbnail(slice.waveformData)

          return {
            id: `segment-${Date.now()}-${index}`,
            start: slice.start,
            end: slice.end,
            emotion,
            waveformThumb
          }
        })

        resolve(segments)
      }, 300)
    })
  }

  private calculateSpectrumEnergy(waveformData: number[]): number {
    if (waveformData.length === 0) return 0
    const sum = waveformData.reduce((acc, val) => acc + val * val, 0)
    const rms = Math.sqrt(sum / waveformData.length)
    return Math.min(rms * 2, 1)
  }

  private mapEnergyToEmotion(energy: number): EmotionType {
    if (energy > 0.7) return 'excited'
    if (energy < 0.3) return 'melancholy'
    if (energy >= 0.5 && energy <= 0.7) return 'restless'
    if (energy >= 0.3 && energy < 0.5) return 'ethereal'
    return 'energetic'
  }

  private generateThumbnail(waveformData: number[]): number[] {
    const targetLength = 60
    if (waveformData.length <= targetLength) {
      return [...waveformData]
    }

    const blockSize = Math.floor(waveformData.length / targetLength)
    const result: number[] = []

    for (let i = 0; i < targetLength; i++) {
      const start = i * blockSize
      const end = Math.min(start + blockSize, waveformData.length)
      let sum = 0
      for (let j = start; j < end; j++) {
        sum += waveformData[j]
      }
      result.push(sum / (end - start))
    }

    const max = Math.max(...result) || 1
    return result.map(v => v / max)
  }

  public formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
}

export const segmentProcessor = new SegmentProcessor()
