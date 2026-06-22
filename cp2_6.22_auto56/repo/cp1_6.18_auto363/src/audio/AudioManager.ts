import * as Tone from 'tone'
import type { AudioFeatures } from '../store/useAudioStore'
import { useAudioStore } from '../store/useAudioStore'

const FFT_SIZE = 1024
const SAMPLE_RATE = 44100

const LOW_FREQ_MIN = 20
const LOW_FREQ_MAX = 250
const MID_FREQ_MIN = 250
const MID_FREQ_MAX = 4000
const HIGH_FREQ_MIN = 4000
const HIGH_FREQ_MAX = 20000

class AudioManagerClass {
  private mic: Tone.UserMedia | null = null
  private fft: Tone.FFT | null = null
  private analyser: Tone.Analyser | null = null
  private animationId: number | null = null
  private isRunning = false

  async start(): Promise<boolean> {
    try {
      this.mic = new Tone.UserMedia()
      await this.mic.open()

      this.fft = new Tone.FFT(FFT_SIZE)
      this.analyser = new Tone.Analyser('waveform', FFT_SIZE)

      this.mic.connect(this.fft)
      this.mic.connect(this.analyser)

      this.isRunning = true
      useAudioStore.getState().setPermissionError(false)
      useAudioStore.getState().setCapturing(true)

      this.analyzeLoop()

      return true
    } catch (error) {
      console.error('Microphone access denied:', error)
      useAudioStore.getState().setPermissionError(true)
      useAudioStore.getState().setCapturing(false)
      return false
    }
  }

  stop(): void {
    this.isRunning = false

    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }

    if (this.mic) {
      this.mic.close()
      this.mic.dispose()
      this.mic = null
    }

    if (this.fft) {
      this.fft.dispose()
      this.fft = null
    }

    if (this.analyser) {
      this.analyser.dispose()
      this.analyser = null
    }

    useAudioStore.getState().setCapturing(false)
    useAudioStore.getState().setAudioFeatures({
      lowFreq: 0,
      midFreq: 0,
      highFreq: 0,
      overallVolume: 0,
    })
  }

  private analyzeLoop = (): void => {
    if (!this.isRunning || !this.fft || !this.analyser) return

    const spectrum = this.fft.getValue()
    const waveform = this.analyser.getValue() as Float32Array

    const features = this.extractFeatures(spectrum, waveform)
    useAudioStore.getState().setAudioFeatures(features)

    this.animationId = requestAnimationFrame(this.analyzeLoop)
  }

  private extractFeatures(
    spectrum: Float32Array | number[],
    waveform: Float32Array | number[]
  ): AudioFeatures {
    const nyquist = SAMPLE_RATE / 2
    const binCount = spectrum.length
    const freqPerBin = nyquist / binCount

    const lowBinStart = Math.floor(LOW_FREQ_MIN / freqPerBin)
    const lowBinEnd = Math.floor(LOW_FREQ_MAX / freqPerBin)
    const midBinStart = Math.floor(MID_FREQ_MIN / freqPerBin)
    const midBinEnd = Math.floor(MID_FREQ_MAX / freqPerBin)
    const highBinStart = Math.floor(HIGH_FREQ_MIN / freqPerBin)
    const highBinEnd = Math.min(Math.floor(HIGH_FREQ_MAX / freqPerBin), binCount - 1)

    const lowEnergy = this.averageEnergy(spectrum, lowBinStart, lowBinEnd)
    const midEnergy = this.averageEnergy(spectrum, midBinStart, midBinEnd)
    const highEnergy = this.averageEnergy(spectrum, highBinStart, highBinEnd)

    const overallVolume = this.calculateVolume(waveform)

    return {
      lowFreq: Math.min(1, Math.max(0, lowEnergy)),
      midFreq: Math.min(1, Math.max(0, midEnergy)),
      highFreq: Math.min(1, Math.max(0, highEnergy)),
      overallVolume: Math.min(1, Math.max(0, overallVolume)),
    }
  }

  private averageEnergy(spectrum: Float32Array | number[], start: number, end: number): number {
    if (start >= end) return 0

    let sum = 0
    const count = end - start

    for (let i = start; i < end; i++) {
      const value = spectrum[i]
      const normalized = (value + 100) / 100
      sum += Math.max(0, Math.min(1, normalized))
    }

    return sum / count
  }

  private calculateVolume(waveform: Float32Array | number[]): number {
    let sum = 0

    for (let i = 0; i < waveform.length; i++) {
      sum += waveform[i] * waveform[i]
    }

    const rms = Math.sqrt(sum / waveform.length)
    return Math.min(1, rms * 2)
  }
}

export const AudioManager = new AudioManagerClass()
