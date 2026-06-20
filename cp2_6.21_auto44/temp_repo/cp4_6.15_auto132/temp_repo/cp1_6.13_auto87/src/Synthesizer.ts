import { PlayerData, WaveType } from './GameManager'

export class Synthesizer {
  private audioContext: AudioContext
  private player: PlayerData
  private oscillators: Map<number, OscillatorNode> = new Map()
  private gainNodes: Map<number, GainNode> = new Map()
  
  private frequencies: number[] = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00]

  constructor(player: PlayerData) {
    this.player = player
    this.audioContext = new AudioContext()
  }

  playNote(noteIndex: number) {
    if (this.oscillators.has(noteIndex)) {
      this.stopNote(noteIndex)
    }

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.type = this.getWaveType(this.player.waveType)
    oscillator.frequency.setValueAtTime(this.frequencies[noteIndex], this.audioContext.currentTime)

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.05)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3)

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.start(this.audioContext.currentTime)

    this.oscillators.set(noteIndex, oscillator)
    this.gainNodes.set(noteIndex, gainNode)

    setTimeout(() => {
      this.stopNote(noteIndex)
    }, 300)
  }

  stopNote(noteIndex: number) {
    const oscillator = this.oscillators.get(noteIndex)
    const gainNode = this.gainNodes.get(noteIndex)

    if (oscillator && gainNode) {
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1)
      
      setTimeout(() => {
        oscillator.stop()
        oscillator.disconnect()
        gainNode.disconnect()
        this.oscillators.delete(noteIndex)
        this.gainNodes.delete(noteIndex)
      }, 100)
    }
  }

  private getWaveType(type: WaveType): OscillatorType {
    switch (type) {
      case 'sine': return 'sine'
      case 'sawtooth': return 'sawtooth'
      case 'square': return 'square'
      default: return 'sine'
    }
  }

  getFrequency(noteIndex: number): number {
    return this.frequencies[noteIndex]
  }
}
