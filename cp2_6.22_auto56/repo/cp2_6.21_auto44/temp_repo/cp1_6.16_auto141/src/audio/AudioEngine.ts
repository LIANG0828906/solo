import { NOTE_FREQUENCIES, type NoteName, type WaveType } from '@/types'

class AudioEngine {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = 0.5
      this.masterGain.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
    return this.ctx
  }

  private getMasterGain(): GainNode {
    this.getContext()
    return this.masterGain!
  }

  playNote(
    note: NoteName,
    waveType: WaveType = 'sine',
    duration: number = 0.8,
    startTime?: number
  ): void {
    const ctx = this.getContext()
    const gain = this.getMasterGain()
    const freq = NOTE_FREQUENCIES[note]
    if (!freq) return

    const when = startTime ?? ctx.currentTime

    const osc = ctx.createOscillator()
    osc.type = waveType
    osc.frequency.setValueAtTime(freq, when)

    const envGain = ctx.createGain()
    envGain.gain.setValueAtTime(0.001, when)
    envGain.gain.exponentialRampToValueAtTime(0.6, when + 0.02)
    envGain.gain.exponentialRampToValueAtTime(0.3, when + 0.1)
    envGain.gain.exponentialRampToValueAtTime(0.001, when + duration)

    osc.connect(envGain)
    envGain.connect(gain)

    osc.start(when)
    osc.stop(when + duration + 0.05)
  }

  playInterval(
    note1: NoteName,
    note2: NoteName,
    waveType: WaveType = 'sine',
    gap: number = 0.6
  ): void {
    const ctx = this.getContext()
    this.playNote(note1, waveType, 0.8, ctx.currentTime)
    this.playNote(note2, waveType, 0.8, ctx.currentTime + gap)
  }

  playChord(
    notes: NoteName[],
    waveType: WaveType = 'sine',
    duration: number = 1.5
  ): void {
    const ctx = this.getContext()
    for (const note of notes) {
      this.playNote(note, waveType, duration, ctx.currentTime)
    }
  }

  playScale(
    notes: NoteName[],
    waveType: WaveType = 'sine',
    noteDuration: number = 0.4,
    gap: number = 0.05
  ): void {
    const ctx = this.getContext()
    notes.forEach((note, i) => {
      this.playNote(note, waveType, noteDuration, ctx.currentTime + i * (noteDuration + gap))
    })
  }
}

export const audioEngine = new AudioEngine()
