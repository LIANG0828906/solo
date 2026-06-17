export class SoundManager {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null
  public enabled = true

  private ensureContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.masterGain = this.audioContext.createGain()
      this.masterGain.connect(this.audioContext.destination)
      this.masterGain.gain.value = 0.3
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }
  }

  public playPew() {
    if (!this.enabled) return
    this.ensureContext()
    if (!this.audioContext || !this.masterGain) return

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(800, this.audioContext.currentTime)
    osc.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.2)
    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2)
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start()
    osc.stop(this.audioContext.currentTime + 0.2)
  }

  public playExplosion() {
    if (!this.enabled) return
    this.ensureContext()
    if (!this.audioContext || !this.masterGain) return

    const bufferSize = this.audioContext.sampleRate * 0.4
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
    }
    const noise = this.audioContext.createBufferSource()
    noise.buffer = buffer
    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(2000, this.audioContext.currentTime)
    filter.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.4)
    const gain = this.audioContext.createGain()
    gain.gain.setValueAtTime(0.4, this.audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.4)
    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)
    noise.start()
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled
  }
}
