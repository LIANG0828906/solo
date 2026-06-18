import * as Tone from 'tone'
import { eventBus, type Note, type MelodyTrack, type InstrumentType } from '../eventBus'

interface TrackChannel {
  synth: Tone.PolySynth | Tone.NoiseSynth | Tone.MembraneSynth
  volume: Tone.Volume
  pan: Tone.Panner
  reverbSend: Tone.Gain
  delaySend: Tone.Gain
  pattern?: Tone.Pattern<Note> | Tone.Sequence<Note>
}

class AudioEngine {
  private tracks: Map<string, TrackChannel> = new Map()
  private masterGain: Tone.Gain
  private masterReverb: Tone.Reverb
  private masterDelay: Tone.FeedbackDelay
  private analyser: Tone.Analyser
  private isPlaying: boolean = false
  private bpm: number = 120
  private loop: boolean = false
  private pauseTime: number = 0
  private progressInterval: number | null = null
  private trackData: Map<string, MelodyTrack> = new Map()
  private initialized: boolean = false
  private exportInProgress: boolean = false

  constructor() {
    this.masterGain = new Tone.Gain(0.8).toDestination()
    this.masterReverb = new Tone.Reverb({ decay: 2, wet: 0.3 })
    this.masterDelay = new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.3, wet: 0.2 })
    this.analyser = new Tone.Analyser('waveform', 1024)

    this.masterReverb.connect(this.masterGain)
    this.masterDelay.connect(this.masterGain)
    this.masterGain.connect(this.analyser)

    Tone.Transport.bpm.value = this.bpm
    Tone.Transport.loop = this.loop

    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    eventBus.on('addTrack', (data) => {
      this.addTrack(data.id, data.instrument, data.notes)
    })

    eventBus.on('removeTrack', ({ id }) => {
      this.removeTrack(id)
    })

    eventBus.on('updateTrack', ({ id, volume, pan, mute, reverb, delay }) => {
      this.updateTrack(id, { volume, pan, mute, reverb, delay })
    })

    eventBus.on('updateNotes', ({ id, notes }) => {
      this.updateTrackNotes(id, notes)
    })

    eventBus.on('mixTrack', ({ masterVolume, masterReverb, masterDelay }) => {
      this.setMasterMix(masterVolume, masterReverb, masterDelay)
    })

    eventBus.on('playAll', ({ bpm, loop }) => {
      this.playAll(bpm, loop)
    })

    eventBus.on('stopAll', () => {
      this.stopAll()
    })

    eventBus.on('pauseAll', () => {
      this.pauseAll()
    })

    eventBus.on('seekTo', ({ time }) => {
      this.seekTo(time)
    })

    eventBus.on('setBpm', ({ bpm }) => {
      this.setBpm(bpm)
    })

    eventBus.on('exportWav', () => {
      this.exportWav()
    })

    eventBus.on('reorderTracks', () => {
    })
  }

  async init(): Promise<void> {
    if (this.initialized) return
    await Tone.start()
    await this.masterReverb.generate()
    this.initialized = true
  }

  private createSynth(instrument: InstrumentType): Tone.PolySynth | Tone.NoiseSynth | Tone.MembraneSynth {
    switch (instrument) {
      case 'piano':
        return new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 1.2 }
        })

      case 'guitar':
        return new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'sawtooth' },
          envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.8 }
        })

      case 'bass':
        return new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'sine' },
          envelope: { attack: 0.05, decay: 0.5, sustain: 0.6, release: 0.5 }
        })

      case 'drums':
        return new Tone.MembraneSynth({
          pitchDecay: 0.05,
          octaves: 4,
          oscillator: { type: 'sine' },
          envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4, attackCurve: 'exponential' }
        })

      case 'strings':
        return new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'fatsawtooth', count: 3, spread: 30 },
          envelope: { attack: 0.3, decay: 0.2, sustain: 0.7, release: 1.5 }
        })

      case 'synth':
        return new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'fatsquare', count: 5, spread: 40 },
          envelope: { attack: 0.01, decay: 0.4, sustain: 0.5, release: 0.8 }
        })

      default:
        return new Tone.PolySynth(Tone.Synth)
    }
  }

  addTrack(id: string, instrument: InstrumentType, notes: Note[]): void {
    if (this.tracks.has(id)) {
      this.removeTrack(id)
    }

    const synth = this.createSynth(instrument)
    const volume = new Tone.Volume(0)
    const pan = new Tone.Panner(0)
    const reverbSend = new Tone.Gain(0.2)
    const delaySend = new Tone.Gain(0)

    synth.connect(volume)
    volume.connect(pan)
    pan.connect(this.masterGain)
    pan.connect(reverbSend)
    reverbSend.connect(this.masterReverb)
    pan.connect(delaySend)
    delaySend.connect(this.masterDelay)

    this.tracks.set(id, { synth, volume, pan, reverbSend, delaySend })

    const trackData: MelodyTrack = {
      id,
      name: `${instrument} 音轨`,
      instrument,
      notes,
      volume: 0.8,
      pan: 0,
      mute: false,
      solo: false,
      reverb: 0.2,
      delay: 0
    }
    this.trackData.set(id, trackData)

    this.scheduleTrack(id, notes)
    this.updateTrackVolume(id, 0.8)
  }

  private scheduleTrack(id: string, notes: Note[]): void {
    const track = this.tracks.get(id)
    if (!track) return

    if (track.pattern) {
      track.pattern.dispose()
      track.pattern = undefined
    }

    const trackData = this.trackData.get(id)
    if (!trackData) return

    if (notes.length === 0) return

    const sortedNotes = [...notes].sort((a, b) => a.time - b.time)
    
    const events = sortedNotes.map(note => ({
      ...note,
      time: Tone.Time(note.time * (60 / this.bpm)).toSeconds()
    }))

    const synth = track.synth as Tone.PolySynth
    
    events.forEach(event => {
      const time = event.time
      const duration = event.duration * (60 / this.bpm)
      const midi = event.midi
      const freq = Tone.Frequency(midi, 'midi').toFrequency()
      const velocity = event.velocity

      Tone.Transport.schedule((time) => {
        if (trackData.mute) return
        synth.triggerAttackRelease(freq, duration, time, velocity)
      }, time)
    })
  }

  removeTrack(id: string): void {
    const track = this.tracks.get(id)
    if (track) {
      if (track.pattern) {
        track.pattern.dispose()
      }
      track.synth.dispose()
      track.volume.dispose()
      track.pan.dispose()
      track.reverbSend.dispose()
      track.delaySend.dispose()
      this.tracks.delete(id)
    }
    this.trackData.delete(id)
  }

  updateTrack(id: string, updates: { volume?: number; pan?: number; mute?: boolean; reverb?: number; delay?: number }): void {
    const track = this.tracks.get(id)
    const trackData = this.trackData.get(id)
    if (!track || !trackData) return

    if (updates.volume !== undefined) {
      trackData.volume = updates.volume
      this.updateTrackVolume(id, updates.volume)
    }

    if (updates.pan !== undefined) {
      trackData.pan = updates.pan
      track.pan.pan.value = updates.pan
    }

    if (updates.mute !== undefined) {
      trackData.mute = updates.mute
      this.updateTrackVolume(id, trackData.volume)
    }

    if (updates.reverb !== undefined) {
      trackData.reverb = updates.reverb
      track.reverbSend.gain.value = updates.reverb
    }

    if (updates.delay !== undefined) {
      trackData.delay = updates.delay
      track.delaySend.gain.value = updates.delay
    }
  }

  private updateTrackVolume(id: string, volume: number): void {
    const track = this.tracks.get(id)
    const trackData = this.trackData.get(id)
    if (!track || !trackData) return

    const muted = trackData.mute
    const gainValue = muted ? 0 : Tone.gainToDb(volume)
    track.volume.volume.value = gainValue
  }

  updateTrackNotes(id: string, notes: Note[]): void {
    const trackData = this.trackData.get(id)
    if (!trackData) return

    trackData.notes = notes

    const wasPlaying = this.isPlaying
    if (wasPlaying) {
      this.pauseAll()
    }

    Tone.Transport.cancel()
    
    this.trackData.forEach((data, trackId) => {
      this.scheduleTrack(trackId, data.notes)
    })

    if (wasPlaying) {
      this.playAll(this.bpm, this.loop)
    }
  }

  setMasterMix(masterVolume: number, masterReverb: number, masterDelay: number): void {
    this.masterGain.gain.value = masterVolume
    this.masterReverb.wet.value = masterReverb
    this.masterDelay.wet.value = masterDelay
  }

  async playAll(bpm: number, loop: boolean): Promise<void> {
    await this.init()

    this.bpm = bpm
    this.loop = loop
    Tone.Transport.bpm.value = bpm
    Tone.Transport.loop = loop

    if (this.pauseTime > 0) {
      Tone.Transport.seconds = this.pauseTime
    }

    Tone.Transport.start()
    this.isPlaying = true

    if (loop) {
      const totalDuration = this.getTotalDuration()
      if (totalDuration > 0) {
        Tone.Transport.setLoopPoints(0, totalDuration * (60 / bpm))
      }
    }

    eventBus.emit('playbackState', { isPlaying: true })
    this.startProgressLoop()
  }

  pauseAll(): void {
    if (!this.isPlaying) return

    Tone.Transport.pause()
    this.pauseTime = Tone.Transport.seconds
    this.isPlaying = false

    eventBus.emit('playbackState', { isPlaying: false })
    this.stopProgressLoop()
  }

  stopAll(): void {
    Tone.Transport.stop()
    this.isPlaying = false
    this.pauseTime = 0

    eventBus.emit('playbackState', { isPlaying: false })
    eventBus.emit('playbackProgress', { time: 0, duration: this.getTotalDuration() })
    this.stopProgressLoop()
  }

  seekTo(time: number): void {
    Tone.Transport.seconds = time
    this.pauseTime = time

    if (this.isPlaying) {
      eventBus.emit('playbackProgress', { time, duration: this.getTotalDuration() })
    }
  }

  setBpm(bpm: number): void {
    this.bpm = bpm
    Tone.Transport.bpm.value = bpm
  }

  private getTotalDuration(): number {
    let maxDuration = 0
    this.trackData.forEach(track => {
      if (track.notes.length > 0) {
        const trackDuration = Math.max(...track.notes.map(n => n.time + n.duration))
        if (trackDuration > maxDuration) maxDuration = trackDuration
      }
    })
    return maxDuration
  }

  private startProgressLoop(): void {
    this.stopProgressLoop()
    
    const updateProgress = () => {
      const currentTime = Tone.Transport.seconds
      const duration = this.getTotalDuration() * (60 / this.bpm)
      eventBus.emit('playbackProgress', { time: currentTime, duration })
    }

    updateProgress()
    this.progressInterval = window.setInterval(updateProgress, 50)
  }

  private stopProgressLoop(): void {
    if (this.progressInterval !== null) {
      clearInterval(this.progressInterval)
      this.progressInterval = null
    }
  }

  getWaveformData(): Float32Array {
    return this.analyser.getValue() as Float32Array
  }

  async exportWav(): Promise<void> {
    if (this.exportInProgress) return
    this.exportInProgress = true

    await this.init()

    const totalDuration = Math.min(this.getTotalDuration() * (60 / this.bpm), 60)

    eventBus.emit('exportProgress', { progress: 0 })

    const offlineContext = new Tone.OfflineContext(2, totalDuration, 44100)
    const originalContext = Tone.getContext()
    Tone.setContext(offlineContext)

    const masterGain = new Tone.Gain(0.8)
    const masterReverb = new Tone.Reverb({ decay: 2, wet: 0.3 })
    const masterDelay = new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.3, wet: 0.2 })
    
    masterReverb.connect(masterGain)
    masterDelay.connect(masterGain)
    masterGain.toDestination()

    let progress = 0
    const totalTracks = this.trackData.size
    let trackIndex = 0

    this.trackData.forEach((trackData) => {
      const synth = this.createSynth(trackData.instrument)
      const volume = new Tone.Volume(trackData.mute ? -Infinity : Tone.gainToDb(trackData.volume))
      const pan = new Tone.Panner(trackData.pan)
      const reverbSend = new Tone.Gain(trackData.reverb)
      const delaySend = new Tone.Gain(trackData.delay)

      synth.connect(volume)
      volume.connect(pan)
      pan.connect(masterGain)
      pan.connect(reverbSend)
      reverbSend.connect(masterReverb)
      pan.connect(delaySend)
      delaySend.connect(masterDelay)

      const notes = [...trackData.notes].sort((a, b) => a.time - b.time)
      const synthAny = synth as any
      
      notes.forEach(note => {
        const time = note.time * (60 / this.bpm)
        const duration = note.duration * (60 / this.bpm)
        const freq = Tone.Frequency(note.midi, 'midi').toFrequency()
        
        if (synthAny.triggerAttackRelease) {
          synthAny.triggerAttackRelease(freq, duration, time, note.velocity)
        }
      })

      trackIndex++
      progress = (trackIndex / totalTracks) * 50
      eventBus.emit('exportProgress', { progress })
    })

    const buffer = await offlineContext.render()
    Tone.setContext(originalContext)

    eventBus.emit('exportProgress', { progress: 75 })

    const wavBlob = this.bufferToWav(buffer, 44100)

    eventBus.emit('exportProgress', { progress: 90 })

    const url = URL.createObjectURL(wavBlob)

    eventBus.emit('exportProgress', { progress: 100 })
    eventBus.emit('exportComplete', { url, blob: wavBlob })

    this.exportInProgress = false
  }

  private bufferToWav(buffer: Tone.ToneAudioBuffer, sampleRate: number): Blob {
    const numChannels = buffer.numberOfChannels
    const length = buffer.length
    const bytesPerSample = 2
    const blockAlign = numChannels * bytesPerSample
    const byteRate = sampleRate * blockAlign
    const dataSize = length * blockAlign
    const bufferSize = 44 + dataSize

    const arrayBuffer = new ArrayBuffer(bufferSize)
    const view = new DataView(arrayBuffer)

    this.writeString(view, 0, 'RIFF')
    view.setUint32(4, bufferSize - 8, true)
    this.writeString(view, 8, 'WAVE')
    this.writeString(view, 12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, numChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, byteRate, true)
    view.setUint16(32, blockAlign, true)
    view.setUint16(34, bytesPerSample * 8, true)
    this.writeString(view, 36, 'data')
    view.setUint32(40, dataSize, true)

    const channelData: Float32Array[] = []
    for (let i = 0; i < numChannels; i++) {
      channelData.push(buffer.getChannelData(i))
    }

    let offset = 44
    for (let i = 0; i < length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = Math.max(-1, Math.min(1, channelData[ch][i]))
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF
        view.setInt16(offset, intSample, true)
        offset += 2
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' })
  }

  private writeString(view: DataView, offset: number, str: string): void {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i))
    }
  }

  dispose(): void {
    this.stopProgressLoop()
    this.tracks.forEach(track => {
      track.synth.dispose()
      track.volume.dispose()
      track.pan.dispose()
      track.reverbSend.dispose()
      track.delaySend.dispose()
    })
    this.tracks.clear()
    this.masterGain.dispose()
    this.masterReverb.dispose()
    this.masterDelay.dispose()
    this.analyser.dispose()
  }
}

export const audioEngine = new AudioEngine()
export default audioEngine
