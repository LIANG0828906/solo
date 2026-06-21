export type TrackName =
  | 'kick'
  | 'snare'
  | 'closedHat'
  | 'openHat'
  | 'shaker'
  | 'bass'
  | 'chord'
  | 'vocal'

export const TRACKS: TrackName[] = [
  'kick',
  'snare',
  'closedHat',
  'openHat',
  'shaker',
  'bass',
  'chord',
  'vocal',
]

export const TRACK_LABELS: Record<TrackName, string> = {
  kick: '底鼓',
  snare: '军鼓',
  closedHat: '闭合镲',
  openHat: '开镲',
  shaker: '沙锤',
  bass: '低音合成',
  chord: '和弦合成',
  vocal: '人声采样',
}

export const GRID_COLS = 12
export const GRID_ROWS = 8

export type GridData = boolean[][]

interface AudioEngineCallbacks {
  onStep: (col: number) => void
}

export class AudioEngine {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null
  private analyser: AnalyserNode | null = null
  private isPlaying = false
  private bpm = 120
  private volume = 0.7
  private grid: GridData = this.createEmptyGrid()
  private schedulerTimer: number | null = null
  private nextNoteTime = 0
  private currentStep = 0
  private lookahead = 25
  private scheduleAheadTime = 0.1
  private callbacks: AudioEngineCallbacks
  private metronomeEnabled = false

  constructor(callbacks: AudioEngineCallbacks) {
    this.callbacks = callbacks
  }

  createEmptyGrid(): GridData {
    return Array.from({ length: GRID_ROWS }, () =>
      Array.from({ length: GRID_COLS }, () => false)
    )
  }

  init(): void {
    if (this.audioContext) return
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    this.audioContext = new AudioCtx()
    this.masterGain = this.audioContext.createGain()
    this.masterGain.gain.value = this.volume
    this.analyser = this.audioContext.createAnalyser()
    this.analyser.fftSize = 2048
    this.masterGain.connect(this.analyser)
    this.analyser.connect(this.audioContext.destination)
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser
  }

  getAudioContext(): AudioContext | null {
    return this.audioContext
  }

  setGrid(grid: GridData): void {
    this.grid = grid.map(row => [...row])
  }

  setBpm(bpm: number): void {
    this.bpm = Math.max(40, Math.min(240, bpm))
  }

  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol))
    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.audioContext.currentTime, 0.01)
    }
  }

  setMetronome(enabled: boolean): void {
    this.metronomeEnabled = enabled
  }

  play(): void {
    if (this.isPlaying) return
    this.init()
    if (!this.audioContext) return
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }
    this.isPlaying = true
    this.currentStep = 0
    this.nextNoteTime = this.audioContext.currentTime + 0.01
    this.scheduler()
  }

  stop(): void {
    this.isPlaying = false
    if (this.schedulerTimer !== null) {
      clearTimeout(this.schedulerTimer)
      this.schedulerTimer = null
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying
  }

  private secondsPerStep(): number {
    return 60.0 / this.bpm / 4.0
  }

  private scheduler = (): void => {
    if (!this.audioContext || !this.isPlaying) return
    while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
      this.scheduleStep(this.currentStep, this.nextNoteTime)
      this.nextNoteTime += this.secondsPerStep()
      this.currentStep = (this.currentStep + 1) % GRID_COLS
    }
    this.schedulerTimer = window.setTimeout(this.scheduler, this.lookahead)
  }

  private scheduleStep(step: number, time: number): void {
    const scheduledStep = step
    const scheduledTime = time

    for (let row = 0; row < GRID_ROWS; row++) {
      if (this.grid[row] && this.grid[row][scheduledStep]) {
        this.playTrack(TRACKS[row], scheduledTime)
      }
    }

    if (this.metronomeEnabled && scheduledStep % 4 === 0) {
      this.playMetronome(scheduledTime)
    }

    const delay = Math.max(0, (scheduledTime - (this.audioContext?.currentTime ?? 0)) * 1000)
    setTimeout(() => {
      this.callbacks.onStep(scheduledStep)
    }, delay)
  }

  private connectToMaster(node: AudioNode): void {
    if (this.masterGain) {
      node.connect(this.masterGain)
    }
  }

  playMetronome(time: number): void {
    if (!this.audioContext) return
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1500, time)
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.exponentialRampToValueAtTime(0.3, time + 0.001)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.06)
    osc.connect(gain)
    this.connectToMaster(gain)
    osc.start(time)
    osc.stop(time + 0.1)
  }

  playTrack(track: TrackName, time: number): void {
    switch (track) {
      case 'kick':
        this.playKick(time)
        break
      case 'snare':
        this.playSnare(time)
        break
      case 'closedHat':
        this.playClosedHat(time)
        break
      case 'openHat':
        this.playOpenHat(time)
        break
      case 'shaker':
        this.playShaker(time)
        break
      case 'bass':
        this.playBass(time)
        break
      case 'chord':
        this.playChord(time)
        break
      case 'vocal':
        this.playVocal(time)
        break
    }
  }

  private playKick(time: number): void {
    if (!this.audioContext) return
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(150, time)
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.15)
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.exponentialRampToValueAtTime(1.0, time + 0.001)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.35)
    osc.connect(gain)
    this.connectToMaster(gain)
    osc.start(time)
    osc.stop(time + 0.4)
  }

  private playSnare(time: number): void {
    if (!this.audioContext) return
    const bufferSize = this.audioContext.sampleRate * 0.2
    const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const output = noiseBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1
    }
    const noise = this.audioContext.createBufferSource()
    noise.buffer = noiseBuffer
    const noiseFilter = this.audioContext.createBiquadFilter()
    noiseFilter.type = 'highpass'
    noiseFilter.frequency.value = 1000
    const noiseGain = this.audioContext.createGain()
    noiseGain.gain.setValueAtTime(0.0001, time)
    noiseGain.gain.exponentialRampToValueAtTime(0.7, time + 0.001)
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.2)
    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    this.connectToMaster(noiseGain)
    noise.start(time)
    noise.stop(time + 0.2)

    const osc = this.audioContext.createOscillator()
    const oscGain = this.audioContext.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(250, time)
    oscGain.gain.setValueAtTime(0.0001, time)
    oscGain.gain.exponentialRampToValueAtTime(0.5, time + 0.001)
    oscGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.1)
    osc.connect(oscGain)
    this.connectToMaster(oscGain)
    osc.start(time)
    osc.stop(time + 0.12)
  }

  private playClosedHat(time: number): void {
    if (!this.audioContext) return
    const bufferSize = this.audioContext.sampleRate * 0.05
    const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const output = noiseBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1
    }
    const noise = this.audioContext.createBufferSource()
    noise.buffer = noiseBuffer
    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 7000
    const gain = this.audioContext.createGain()
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.exponentialRampToValueAtTime(0.35, time + 0.001)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05)
    noise.connect(filter)
    filter.connect(gain)
    this.connectToMaster(gain)
    noise.start(time)
    noise.stop(time + 0.06)
  }

  private playOpenHat(time: number): void {
    if (!this.audioContext) return
    const bufferSize = this.audioContext.sampleRate * 0.3
    const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const output = noiseBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1
    }
    const noise = this.audioContext.createBufferSource()
    noise.buffer = noiseBuffer
    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 6000
    const gain = this.audioContext.createGain()
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.exponentialRampToValueAtTime(0.35, time + 0.001)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.3)
    noise.connect(filter)
    filter.connect(gain)
    this.connectToMaster(gain)
    noise.start(time)
    noise.stop(time + 0.32)
  }

  private playShaker(time: number): void {
    if (!this.audioContext) return
    const bufferSize = this.audioContext.sampleRate * 0.08
    const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const output = noiseBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
    }
    const noise = this.audioContext.createBufferSource()
    noise.buffer = noiseBuffer
    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 4000
    filter.Q.value = 1.2
    const gain = this.audioContext.createGain()
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.exponentialRampToValueAtTime(0.25, time + 0.002)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.08)
    noise.connect(filter)
    filter.connect(gain)
    this.connectToMaster(gain)
    noise.start(time)
    noise.stop(time + 0.1)
  }

  private playBass(time: number): void {
    if (!this.audioContext) return
    const osc = this.audioContext.createOscillator()
    const subOsc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(600, time)
    filter.frequency.exponentialRampToValueAtTime(200, time + 0.2)
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(110, time)
    subOsc.type = 'sine'
    subOsc.frequency.setValueAtTime(55, time)
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.exponentialRampToValueAtTime(0.4, time + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.3)
    osc.connect(filter)
    subOsc.connect(filter)
    filter.connect(gain)
    this.connectToMaster(gain)
    osc.start(time)
    subOsc.start(time)
    osc.stop(time + 0.32)
    subOsc.stop(time + 0.32)
  }

  private playChord(time: number): void {
    if (!this.audioContext) return
    const freqs = [261.63, 329.63, 392.0]
    freqs.forEach((freq, idx) => {
      const osc = this.audioContext!.createOscillator()
      const gain = this.audioContext!.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, time)
      const g = 0.22 / (idx + 1)
      gain.gain.setValueAtTime(0.0001, time)
      gain.gain.exponentialRampToValueAtTime(g, time + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.5)
      osc.connect(gain)
      this.connectToMaster(gain)
      osc.start(time)
      osc.stop(time + 0.52)
    })
  }

  private playVocal(time: number): void {
    if (!this.audioContext) return
    const osc1 = this.audioContext.createOscillator()
    const osc2 = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(900, time)
    filter.Q.value = 8
    osc1.type = 'sawtooth'
    osc1.frequency.setValueAtTime(440, time)
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(880, time)
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.exponentialRampToValueAtTime(0.3, time + 0.015)
    gain.gain.setValueAtTime(0.3, time + 0.1)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.3)
    osc1.connect(filter)
    osc2.connect(filter)
    filter.connect(gain)
    this.connectToMaster(gain)
    osc1.start(time)
    osc2.start(time)
    osc1.stop(time + 0.32)
    osc2.stop(time + 0.32)
  }
}
