import WaveSurfer from 'wavesurfer.js'

export interface WaveformData {
  peaks: number[]
  duration: number
  sampleRate: number
  numberOfChannels: number
}

export class AudioWaveform {
  private waveSurfer: WaveSurfer | null = null
  private container: HTMLElement | null = null
  private waveformData: WaveformData | null = null

  constructor() {
    this.container = document.createElement('div')
    this.container.style.position = 'absolute'
    this.container.style.left = '-9999px'
    this.container.style.width = '1000px'
    this.container.style.height = '128px'
    document.body.appendChild(this.container)
  }

  async loadAudio(file: File): Promise<WaveformData> {
    return new Promise((resolve, reject) => {
      if (this.waveSurfer) {
        this.waveSurfer.destroy()
      }

      this.waveSurfer = WaveSurfer.create({
        container: this.container as HTMLElement,
        waveColor: 'transparent',
        progressColor: 'transparent',
        cursorColor: 'transparent',
        barWidth: 1,
        barGap: 0,
        height: 128,
        normalize: true,
      })

      this.waveSurfer.on('ready', () => {
        if (!this.waveSurfer) return

        const decodedData = this.waveSurfer.getDecodedData()
        if (!decodedData) {
          reject(new Error('Failed to decode audio'))
          return
        }

        const duration = this.waveSurfer.getDuration()
        const channelData = decodedData.getChannelData(0)
        const samples = 1000
        const blockSize = Math.floor(channelData.length / samples)
        const peaks: number[] = []

        for (let i = 0; i < samples; i++) {
          const start = i * blockSize
          let max = 0
          for (let j = 0; j < blockSize; j++) {
            const abs = Math.abs(channelData[start + j])
            if (abs > max) max = abs
          }
          peaks.push(max)
        }

        this.waveformData = {
          peaks,
          duration,
          sampleRate: decodedData.sampleRate,
          numberOfChannels: decodedData.numberOfChannels,
        }

        resolve(this.waveformData)
      })

      this.waveSurfer.on('error', (error) => {
        reject(error)
      })

      this.waveSurfer.loadBlob(file)
    })
  }

  getPeaks(): number[] {
    return this.waveformData?.peaks || []
  }

  getDuration(): number {
    return this.waveformData?.duration || 0
  }

  destroy(): void {
    if (this.waveSurfer) {
      this.waveSurfer.destroy()
      this.waveSurfer = null
    }
    if (this.container) {
      document.body.removeChild(this.container)
      this.container = null
    }
    this.waveformData = null
  }
}
