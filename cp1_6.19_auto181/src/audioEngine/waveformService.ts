import WaveSurfer from 'wavesurfer.js'

export interface WaveformSlice {
  start: number
  end: number
  waveformData: number[]
}

export interface WaveformServiceResult {
  slices: WaveformSlice[]
  duration: number
  peaks: number[]
}

export class WaveformService {
  private wavesurfer: WaveSurfer | null = null
  private container: HTMLElement | null = null

  public async loadAudio(
    file: File,
    container: HTMLElement,
    onProgress?: (progress: number) => void
  ): Promise<WaveformServiceResult> {
    this.container = container

    return new Promise((resolve, reject) => {
      try {
        this.wavesurfer = WaveSurfer.create({
          container: container,
          waveColor: '#6C63FF',
          progressColor: '#E040FB',
          cursorColor: '#FFFFFF',
          barWidth: 2,
          barGap: 1,
          barRadius: 2,
          height: 120,
          normalize: true,
          backend: 'WebAudio'
        })

        this.wavesurfer.on('loading', (percent: number) => {
          onProgress?.(percent)
        })

        this.wavesurfer.on('ready', () => {
          const duration = this.wavesurfer!.getDuration()
          const peaks = this.wavesurfer!.getDecodedData().getChannelData(0)
          const slices = this.detectRhythmChanges(peaks, duration)
          resolve({ slices, duration, peaks: Array.from(peaks) })
        })

        this.wavesurfer.on('error', (err: Error) => {
          reject(err)
        })

        this.wavesurfer.loadBlob(file)
      } catch (error) {
        reject(error)
      }
    })
  }

  private detectRhythmChanges(peaks: Float32Array, duration: number): WaveformSlice[] {
    const sliceCount = Math.floor(Math.random() * 4) + 5
    const samplesPerSlice = Math.floor(peaks.length / sliceCount)
    const slices: WaveformSlice[] = []

    for (let i = 0; i < sliceCount; i++) {
      const startSample = i * samplesPerSlice
      const endSample = Math.min((i + 1) * samplesPerSlice, peaks.length)
      const start = (startSample / peaks.length) * duration
      const end = (endSample / peaks.length) * duration

      const segmentPeaks = peaks.slice(startSample, endSample)
      const waveformData = this.downsampleWaveform(segmentPeaks, 100)

      slices.push({ start, end, waveformData })
    }

    return slices
  }

  private downsampleWaveform(peaks: Float32Array, targetLength: number): number[] {
    const blockSize = Math.floor(peaks.length / targetLength)
    const result: number[] = []

    for (let i = 0; i < targetLength; i++) {
      const start = i * blockSize
      const end = start + blockSize
      let max = 0
      for (let j = start; j < end; j++) {
        if (j < peaks.length) {
          const abs = Math.abs(peaks[j])
          if (abs > max) max = abs
        }
      }
      result.push(max)
    }

    return result
  }

  public togglePlay(): boolean {
    if (!this.wavesurfer) return false
    this.wavesurfer.playPause()
    return this.wavesurfer.isPlaying()
  }

  public seekTo(time: number): void {
    if (!this.wavesurfer) return
    const duration = this.wavesurfer.getDuration()
    this.wavesurfer.seekTo(time / duration)
  }

  public getCurrentTime(): number {
    if (!this.wavesurfer) return 0
    return this.wavesurfer.getCurrentTime()
  }

  public destroy(): void {
    if (this.wavesurfer) {
      this.wavesurfer.destroy()
      this.wavesurfer = null
    }
  }
}

export const waveformService = new WaveformService()
