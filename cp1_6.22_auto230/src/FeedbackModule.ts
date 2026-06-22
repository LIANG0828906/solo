export class FeedbackModule {
  private audioContext: AudioContext | null = null

  private ensureAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }
    return this.audioContext
  }

  playPatternSound(patternIndex: number): void {
    try {
      const ctx = this.ensureAudioContext()
      const frequencies = [220, 280, 340, 400, 460, 520, 600, 720]
      const frequency = frequencies[patternIndex % frequencies.length]

      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.2)
    } catch (e) {
    }
  }

  triggerVibration(patternIndex: number): void {
    if (!('vibrate' in navigator)) return

    const patterns: (number | number[])[] = [
      100,
      [50, 50],
      300,
      [80, 40, 80],
      200,
      [50, 30, 50, 30, 50],
      150,
      [100, 50, 100],
    ]

    const pattern = patterns[patternIndex % patterns.length]
    try {
      if (Array.isArray(pattern)) {
        navigator.vibrate(pattern)
      } else {
        navigator.vibrate(pattern)
      }
    } catch (e) {
    }
  }

  playMatchSound(): void {
    try {
      const ctx = this.ensureAudioContext()

      const freqs = [523.25, 659.25, 783.99]
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1)
        gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.1)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.2)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(ctx.currentTime + i * 0.1)
        osc.stop(ctx.currentTime + i * 0.1 + 0.2)
      })
    } catch (e) {
    }
  }

  playWinSound(): void {
    try {
      const ctx = this.ensureAudioContext()
      const notes = [523.25, 659.25, 783.99, 1046.50]
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15)
        gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.15)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.3)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(ctx.currentTime + i * 0.15)
        osc.stop(ctx.currentTime + i * 0.15 + 0.3)
      })
    } catch (e) {
    }
  }
}
