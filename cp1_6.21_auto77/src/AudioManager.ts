export type Difficulty = 'easy' | 'normal' | 'hard'

export interface Song {
  id: string
  title: string
  artist: string
  duration: number
  coverColor: string
  bpm: number
}

export const SONGS: Song[] = [
  { id: '1', title: '星空序曲', artist: '未知创作者', duration: 45, coverColor: '#4488ff', bpm: 120 },
  { id: '2', title: '霓虹之夜', artist: '电子梦境', duration: 60, coverColor: '#ff4466', bpm: 140 },
  { id: '3', title: '光刃传说', artist: '节奏大师', duration: 50, coverColor: '#44ff88', bpm: 160 },
]

class AudioManager {
  private audioContext: AudioContext | null = null
  private beatTimes: number[] = []
  private currentSong: Song | null = null
  private isPlaying = false
  private startTime = 0
  private slashAudioBuffer: AudioBuffer | null = null
  private missAudioBuffer: AudioBuffer | null = null

  getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return this.audioContext
  }

  private async initAudioBuffers() {
    const ctx = this.getContext()
    this.slashAudioBuffer = this.createShortTone(ctx, 880, 0.08, 'sine', 0.3)
    this.missAudioBuffer = this.createShortTone(ctx, 220, 0.2, 'sawtooth', 0.15)
  }

  private createShortTone(ctx: AudioContext, freq: number, duration: number, type: OscillatorType, volume: number): AudioBuffer {
    const sampleRate = ctx.sampleRate
    const length = Math.floor(sampleRate * duration)
    const buffer = ctx.createBuffer(1, length, sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate
      const envelope = Math.exp(-t / (duration * 0.3))
      let sample = 0
      if (type === 'sine') {
        sample = Math.sin(2 * Math.PI * freq * t)
      } else if (type === 'sawtooth') {
        sample = 2 * (t * freq - Math.floor(t * freq + 0.5))
      }
      data[i] = sample * envelope * volume
    }
    return buffer
  }

  playSlashSound() {
    const ctx = this.getContext()
    if (!this.slashAudioBuffer) return
    const source = ctx.createBufferSource()
    source.buffer = this.slashAudioBuffer
    const gain = ctx.createGain()
    gain.gain.value = 0.5
    source.connect(gain)
    gain.connect(ctx.destination)
    source.start()
  }

  playMissSound() {
    const ctx = this.getContext()
    if (!this.missAudioBuffer) return
    const source = ctx.createBufferSource()
    source.buffer = this.missAudioBuffer
    const gain = ctx.createGain()
    gain.gain.value = 0.3
    source.connect(gain)
    gain.connect(ctx.destination)
    source.start()
  }

  private playMetronomeTick(time: number, freq: number, volume: number) {
    const ctx = this.getContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(volume, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(time)
    osc.stop(time + 0.06)
  }

  loadSong(song: Song, difficulty: Difficulty): number[] {
    this.currentSong = song
    this.initAudioBuffers()
    
    const bpm = song.bpm
    const beatInterval = 60 / bpm
    
    let noteCount: number
    switch (difficulty) {
      case 'easy':
        noteCount = Math.floor(song.duration / beatInterval * 0.5)
        break
      case 'normal':
        noteCount = Math.floor(song.duration / beatInterval * 0.75)
        break
      case 'hard':
        noteCount = Math.floor(song.duration / beatInterval)
        break
    }

    this.beatTimes = []
    const startOffset = 3.0
    
    for (let i = 0; i < noteCount; i++) {
      let beatTime: number
      if (difficulty === 'easy') {
        beatTime = startOffset + i * beatInterval * 2
      } else if (difficulty === 'normal') {
        beatTime = startOffset + i * beatInterval * 1.333
      } else {
        beatTime = startOffset + i * beatInterval
      }
      if (beatTime < song.duration) {
        this.beatTimes.push(beatTime)
      }
    }

    return this.beatTimes
  }

  getBeatTimes(): number[] {
    return this.beatTimes
  }

  play() {
    if (this.isPlaying) return
    const ctx = this.getContext()
    this.isPlaying = true
    this.startTime = ctx.currentTime

    const bpm = this.currentSong?.bpm || 120
    const beatInterval = 60 / bpm
    
    for (let i = 0; i < Math.ceil((this.currentSong?.duration || 60) / beatInterval); i++) {
      const time = this.startTime + i * beatInterval
      const freq = i % 4 === 0 ? 1000 : 600
      const vol = i % 4 === 0 ? 0.06 : 0.03
      this.playMetronomeTick(time, freq, vol)
    }
  }

  pause() {
    this.isPlaying = false
  }

  getCurrentTime(): number {
    if (!this.audioContext || !this.isPlaying) return 0
    return this.audioContext.currentTime - this.startTime
  }

  reset() {
    this.isPlaying = false
    this.startTime = 0
  }

  isSongPlaying(): boolean {
    return this.isPlaying
  }
}

export const audioManager = new AudioManager()
