export type NoiseType = 'rain' | 'fan' | 'ocean' | 'none'

export interface AudioEngineState {
  leftFrequency: number
  rightFrequency: number
  noiseType: NoiseType
  reverbDepth: number
  volume: number
  isPlaying: boolean
}

class AudioEngine {
  private audioContext: AudioContext | null = null
  private leftOscillator: OscillatorNode | null = null
  private rightOscillator: OscillatorNode | null = null
  private leftGain: GainNode | null = null
  private rightGain: GainNode | null = null
  private masterGain: GainNode | null = null
  private analyser: AnalyserNode | null = null
  private noiseSource: AudioBufferSourceNode | null = null
  private noiseGain: GainNode | null = null
  private convolver: ConvolverNode | null = null
  private reverbGain: GainNode | null = null
  private dryGain: GainNode | null = null

  private state: AudioEngineState = {
    leftFrequency: 200,
    rightFrequency: 205,
    noiseType: 'none',
    reverbDepth: 30,
    volume: 0.5,
    isPlaying: false,
  }

  async init() {
    if (this.audioContext) return

    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

    this.masterGain = this.audioContext.createGain()
    this.masterGain.gain.value = this.state.volume

    this.analyser = this.audioContext.createAnalyser()
    this.analyser.fftSize = 2048

    this.leftGain = this.audioContext.createGain()
    this.rightGain = this.audioContext.createGain()
    this.leftGain.gain.value = 0.3
    this.rightGain.gain.value = 0.3

    this.noiseGain = this.audioContext.createGain()
    this.noiseGain.gain.value = 0

    this.dryGain = this.audioContext.createGain()
    this.reverbGain = this.audioContext.createGain()
    this.convolver = this.audioContext.createConvolver()

    this.updateReverbDepth(this.state.reverbDepth)
    this.generateImpulseResponse()

    this.leftGain.connect(this.dryGain)
    this.rightGain.connect(this.dryGain)
    this.noiseGain.connect(this.dryGain)

    this.dryGain.connect(this.analyser)
    this.dryGain.connect(this.convolver)
    this.convolver.connect(this.reverbGain)
    this.reverbGain.connect(this.analyser)

    this.analyser.connect(this.masterGain)
    this.masterGain.connect(this.audioContext.destination)
  }

  private generateImpulseResponse() {
    if (!this.audioContext || !this.convolver) return

    const sampleRate = this.audioContext.sampleRate
    const length = sampleRate * 2
    const impulse = this.audioContext.createBuffer(2, length, sampleRate)

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel)
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2)
      }
    }

    this.convolver.buffer = impulse
  }

  private createOscillators() {
    if (!this.audioContext || !this.leftGain || !this.rightGain) return

    this.leftOscillator = this.audioContext.createOscillator()
    this.leftOscillator.type = 'sine'
    this.leftOscillator.frequency.value = this.state.leftFrequency
    this.leftOscillator.connect(this.leftGain)

    this.rightOscillator = this.audioContext.createOscillator()
    this.rightOscillator.type = 'sine'
    this.rightOscillator.frequency.value = this.state.rightFrequency
    this.rightOscillator.connect(this.rightGain)
  }

  private createNoiseBuffer(type: NoiseType): AudioBuffer | null {
    if (!this.audioContext || type === 'none') return null

    const sampleRate = this.audioContext.sampleRate
    const duration = 2
    const length = sampleRate * duration
    const buffer = this.audioContext.createBuffer(2, length, sampleRate)

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel)

      switch (type) {
        case 'rain':
          for (let i = 0; i < length; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.5
            if (Math.random() < 0.001) {
              data[i] *= 3
            }
          }
          break
        case 'fan':
          let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
          for (let i = 0; i < length; i++) {
            const white = Math.random() * 2 - 1
            b0 = 0.99886 * b0 + white * 0.0555179
            b1 = 0.99332 * b1 + white * 0.0750759
            b2 = 0.96900 * b2 + white * 0.1538520
            b3 = 0.86650 * b3 + white * 0.3104856
            b4 = 0.55000 * b4 + white * 0.5329522
            b5 = -0.7616 * b5 - white * 0.0168980
            data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.15
            b6 = white * 0.115926
          }
          break
        case 'ocean':
          for (let i = 0; i < length; i++) {
            const t = i / sampleRate
            const wave = Math.sin(2 * Math.PI * 0.1 * t) * 0.5 + 0.5
            data[i] = (Math.random() * 2 - 1) * wave * 0.6
          }
          break
      }
    }

    return buffer
  }

  async start() {
    if (!this.audioContext) {
      await this.init()
    }

    if (!this.audioContext || this.state.isPlaying) return

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }

    this.createOscillators()

    if (this.leftOscillator && this.rightOscillator) {
      this.leftOscillator.start()
      this.rightOscillator.start()
    }

    if (this.state.noiseType !== 'none') {
      this.startNoise()
    }

    this.state.isPlaying = true
  }

  stop() {
    if (!this.state.isPlaying) return

    if (this.leftOscillator) {
      try { this.leftOscillator.stop() } catch (e) {}
      this.leftOscillator.disconnect()
      this.leftOscillator = null
    }
    if (this.rightOscillator) {
      try { this.rightOscillator.stop() } catch (e) {}
      this.rightOscillator.disconnect()
      this.rightOscillator = null
    }

    this.stopNoise()
    this.state.isPlaying = false
  }

  private startNoise() {
    if (!this.audioContext || !this.noiseGain || this.state.noiseType === 'none') return

    const buffer = this.createNoiseBuffer(this.state.noiseType)
    if (!buffer) return

    this.noiseSource = this.audioContext.createBufferSource()
    this.noiseSource.buffer = buffer
    this.noiseSource.loop = true
    this.noiseSource.connect(this.noiseGain)
    this.noiseSource.start()
  }

  private stopNoise() {
    if (this.noiseSource) {
      try { this.noiseSource.stop() } catch (e) {}
      this.noiseSource.disconnect()
      this.noiseSource = null
    }
  }

  setFrequency(channel: 'left' | 'right', value: number) {
    if (channel === 'left') {
      this.state.leftFrequency = value
      if (this.leftOscillator && this.audioContext) {
        this.leftOscillator.frequency.setTargetAtTime(value, this.audioContext.currentTime, 0.02)
      }
    } else {
      this.state.rightFrequency = value
      if (this.rightOscillator && this.audioContext) {
        this.rightOscillator.frequency.setTargetAtTime(value, this.audioContext.currentTime, 0.02)
      }
    }
  }

  setNoiseType(type: NoiseType) {
    this.state.noiseType = type

    if (this.noiseGain && this.audioContext) {
      const targetGain = type === 'none' ? 0 : 0.3
      this.noiseGain.gain.setTargetAtTime(targetGain, this.audioContext.currentTime, 0.1)
    }

    if (this.state.isPlaying) {
      this.stopNoise()
      if (type !== 'none') {
        this.startNoise()
      }
    }
  }

  private updateReverbDepth(depth: number) {
    if (!this.dryGain || !this.reverbGain || !this.audioContext) return

    const dry = 1 - depth / 100 * 0.8
    const wet = depth / 100 * 0.6

    this.dryGain.gain.setTargetAtTime(dry, this.audioContext.currentTime, 0.1)
    this.reverbGain.gain.setTargetAtTime(wet, this.audioContext.currentTime, 0.1)
  }

  setReverbDepth(value: number) {
    this.state.reverbDepth = value
    this.updateReverbDepth(value)
  }

  setVolume(value: number) {
    this.state.volume = value
    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.setTargetAtTime(value, this.audioContext.currentTime, 0.05)
    }
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser
  }

  getState(): AudioEngineState {
    return { ...this.state }
  }

  getIsPlaying(): boolean {
    return this.state.isPlaying
  }
}

export const audioEngine = new AudioEngine()
