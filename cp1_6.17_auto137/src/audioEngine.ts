class AudioEngine {
  private audioContext: AudioContext | null = null
  private musicOscillators: OscillatorNode[] = []
  private musicGainNodes: GainNode[] = []
  private musicInterval: number | null = null

  private initContext(): void {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }
  }

  playPlaceSound(): void {
    this.initContext()
    if (!this.audioContext) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime)
    
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2)

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.start()
    oscillator.stop(this.audioContext.currentTime + 0.2)
  }

  playErrorSound(): void {
    this.initContext()
    if (!this.audioContext) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.type = 'sawtooth'
    oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime)
    oscillator.frequency.linearRampToValueAtTime(100, this.audioContext.currentTime + 0.3)
    
    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3)

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.start()
    oscillator.stop(this.audioContext.currentTime + 0.3)
  }

  startAmbientMusic(): void {
    this.initContext()
    if (!this.audioContext) return

    const cMajorChords = [
      [261.63, 329.63, 392.00],
      [293.66, 349.23, 440.00],
      [329.63, 392.00, 493.88],
      [349.23, 440.00, 523.25],
    ]

    let chordIndex = 0

    const playChord = () => {
      if (!this.audioContext) return

      this.musicOscillators.forEach(osc => {
        try { osc.stop() } catch { /* ignore */ }
      })
      this.musicOscillators = []
      this.musicGainNodes = []

      const chord = cMajorChords[chordIndex % cMajorChords.length]
      chordIndex++

      chord.forEach((freq, i) => {
        if (!this.audioContext) return
        const osc = this.audioContext.createOscillator()
        const gain = this.audioContext.createGain()

        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, this.audioContext.currentTime)

        gain.gain.setValueAtTime(0, this.audioContext.currentTime)
        gain.gain.linearRampToValueAtTime(0.08, this.audioContext.currentTime + 0.5)
        gain.gain.linearRampToValueAtTime(0.05, this.audioContext.currentTime + 1.5)
        gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 2)

        osc.connect(gain)
        gain.connect(this.audioContext.destination)

        osc.start()
        osc.stop(this.audioContext.currentTime + 2)

        this.musicOscillators.push(osc)
        this.musicGainNodes.push(gain)
        void i
      })
    }

    playChord()
    this.musicInterval = window.setInterval(playChord, 2000)
  }

  stopAmbientMusic(): void {
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval)
      this.musicInterval = null
    }

    this.musicOscillators.forEach(osc => {
      try { osc.stop() } catch { /* ignore */ }
    })
    this.musicOscillators = []
    this.musicGainNodes = []
  }
}

export const audioEngine = new AudioEngine()
