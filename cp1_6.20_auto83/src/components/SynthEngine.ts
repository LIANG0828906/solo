import * as Tone from 'tone'

export type PresetType = 'piano' | 'electronic' | 'bass'

export interface EnvelopeParams {
  attack: number
  decay: number
  sustain: number
  release: number
}

export interface EffectParams {
  reverb: number
  reverbDecay: number
  delay: number
  delayFeedback: number
  delayTime: number | string
}

export interface TrackState {
  id: string
  name: string
  color: string
  volume: number
  pan: number
  muted: boolean
  preset: PresetType
  envelope: EnvelopeParams
  effects: EffectParams
}

export interface NoteEvent {
  midi: number
  startTime: number
  duration: number
  velocity: number
  trackId: string
}

const TRACK_COLORS = ['#6c5ce7', '#00b894', '#e17055', '#fdcb6e']
const TRACK_NAMES = ['轨道 1', '轨道 2', '轨道 3', '轨道 4']

const DEFAULT_ENVELOPE: EnvelopeParams = {
  attack: 0.01,
  decay: 0.3,
  sustain: 0.6,
  release: 0.5,
}

const DEFAULT_EFFECTS: EffectParams = {
  reverb: 0.3,
  reverbDecay: 2,
  delay: 0,
  delayFeedback: 0.3,
  delayTime: '8n',
}

interface TrackInstance {
  state: TrackState
  synth: Tone.PolySynth | Tone.MonoSynth | Tone.FMSynth
  reverb: Tone.Reverb
  delay: Tone.FeedbackDelay
  volume: Tone.Volume
  pan: Tone.Panner
  gain: Tone.Gain
}

class SynthEngine {
  private tracks: Map<string, TrackInstance> = new Map()
  private masterGain: Tone.Gain | null = null
  private masterLimiter: Tone.Limiter | null = null
  private isPlaying: boolean = false
  private scheduledEvents: number[] = []
  private loopEventId: number | null = null
  private onProgressCallback: ((time: number) => void) | null = null
  private onNoteStartCallback: ((midi: number, trackId: string) => void) | null = null
  private onNoteEndCallback: ((midi: number, trackId: string) => void) | null = null
  private bpm: number = 120
  private isLooping: boolean = false
  private loopStart: number = 0
  private loopEnd: number = 0
  private initialized: boolean = false
  private audioStarted: boolean = false

  constructor() {}

  private ensureMasterChain(): void {
    if (!this.masterGain || !this.masterLimiter) {
      this.masterGain = new Tone.Gain(0.8)
      this.masterLimiter = new Tone.Limiter(-1)
      this.masterGain.connect(this.masterLimiter)
      this.masterLimiter.toDestination()
    }
  }

  async init(): Promise<void> {
    if (this.initialized) return

    this.ensureMasterChain()

    if (!this.audioStarted) {
      await Tone.start()
      this.audioStarted = true
    }

    Tone.Transport.bpm.value = this.bpm
    this.initialized = true
  }

  createTrack(id: string, index: number): TrackState {
    this.ensureMasterChain()

    if (this.tracks.has(id)) {
      return this.tracks.get(id)!.state
    }

    const color = TRACK_COLORS[index % TRACK_COLORS.length]
    const name = TRACK_NAMES[index % TRACK_NAMES.length]

    const reverb = new Tone.Reverb({ decay: 2, wet: 0.3 })
    const delay = new Tone.FeedbackDelay({
      delayTime: '8n',
      feedback: 0.3,
      wet: 0,
    })
    const volume = new Tone.Volume(0)
    const pan = new Tone.Panner(0)
    const gain = new Tone.Gain(1)

    let synth: Tone.PolySynth | Tone.MonoSynth | Tone.FMSynth
    const preset: PresetType = (index === 0 ? 'piano' : index === 1 ? 'electronic' : 'bass') as PresetType

    if (preset === 'piano') {
      synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { ...DEFAULT_ENVELOPE },
      })
    } else if (preset === 'electronic') {
      synth = new Tone.FMSynth({
        harmonicity: 3,
        modulationIndex: 10,
        oscillator: { type: 'sine' },
        envelope: { ...DEFAULT_ENVELOPE },
      })
    } else {
      synth = new Tone.MonoSynth({
        oscillator: { type: 'sawtooth' },
        filter: { Q: 6, type: 'lowpass', frequency: 800 },
        envelope: { ...DEFAULT_ENVELOPE, attack: 0.05 },
      })
    }

    synth.connect(gain)
    gain.connect(pan)
    pan.connect(volume)
    volume.connect(delay)
    delay.connect(reverb)
    reverb.connect(this.masterGain!)

    const state: TrackState = {
      id,
      name,
      color,
      volume: 0,
      pan: 0,
      muted: false,
      preset,
      envelope: { ...DEFAULT_ENVELOPE },
      effects: { ...DEFAULT_EFFECTS },
    }

    this.tracks.set(id, { state, synth, reverb, delay, volume, pan, gain })
    return state
  }

  removeTrack(id: string): void {
    const track = this.tracks.get(id)
    if (track) {
      track.synth.dispose()
      track.reverb.dispose()
      track.delay.dispose()
      track.volume.dispose()
      track.pan.dispose()
      track.gain.dispose()
      this.tracks.delete(id)
    }
  }

  getTrackState(id: string): TrackState | undefined {
    return this.tracks.get(id)?.state
  }

  getAllTrackStates(): TrackState[] {
    return Array.from(this.tracks.values()).map((t) => t.state)
  }

  setTrackVolume(id: string, volume: number): void {
    const track = this.tracks.get(id)
    if (track) {
      track.state.volume = volume
      track.volume.volume.value = track.state.muted ? -Infinity : volume
    }
  }

  setTrackPan(id: string, pan: number): void {
    const track = this.tracks.get(id)
    if (track) {
      track.state.pan = pan
      track.pan.pan.value = pan
    }
  }

  setTrackMuted(id: string, muted: boolean): void {
    const track = this.tracks.get(id)
    if (track) {
      track.state.muted = muted
      track.volume.volume.value = muted ? -Infinity : track.state.volume
    }
  }

  setTrackPreset(id: string, preset: PresetType): void {
    const track = this.tracks.get(id)
    if (!track) return

    track.state.preset = preset
    const oldSynth = track.synth
    oldSynth.disconnect()

    let newSynth: Tone.PolySynth | Tone.MonoSynth | Tone.FMSynth

    if (preset === 'piano') {
      newSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { ...track.state.envelope },
      })
    } else if (preset === 'electronic') {
      newSynth = new Tone.FMSynth({
        harmonicity: 3,
        modulationIndex: 10,
        oscillator: { type: 'sine' },
        envelope: { ...track.state.envelope },
      })
    } else {
      newSynth = new Tone.MonoSynth({
        oscillator: { type: 'sawtooth' },
        filter: { Q: 6, type: 'lowpass', frequency: 800 },
        envelope: { ...track.state.envelope, attack: 0.05 },
      })
    }

    newSynth.connect(track.gain)
    oldSynth.dispose()
    track.synth = newSynth
  }

  setTrackEnvelope(id: string, envelope: Partial<EnvelopeParams>): void {
    const track = this.tracks.get(id)
    if (!track) return

    track.state.envelope = { ...track.state.envelope, ...envelope }

    if (track.synth instanceof Tone.PolySynth) {
      track.synth.set({ envelope: track.state.envelope })
    } else if (track.synth instanceof Tone.MonoSynth) {
      track.synth.set({ envelope: track.state.envelope })
    } else if (track.synth instanceof Tone.FMSynth) {
      track.synth.set({ envelope: track.state.envelope })
    }
  }

  setTrackEffects(id: string, effects: Partial<EffectParams>): void {
    const track = this.tracks.get(id)
    if (!track) return

    track.state.effects = { ...track.state.effects, ...effects }
    const e = track.state.effects

    track.reverb.wet.value = e.reverb
    track.reverb.decay = e.reverbDecay

    track.delay.wet.value = e.delay
    track.delay.feedback.value = e.delayFeedback
    track.delay.delayTime.value = e.delayTime
  }

  playNote(midi: number, trackId: string, duration: number = 0.5, velocity: number = 0.8): void {
    const track = this.tracks.get(trackId)
    if (!track || track.state.muted) return

    const freq = 440 * Math.pow(2, (midi - 69) / 12)

    if (track.synth instanceof Tone.PolySynth) {
      track.synth.triggerAttackRelease(freq, duration, Tone.now(), velocity)
    } else {
      track.synth.triggerAttackRelease(freq, duration, Tone.now(), velocity)
    }

    this.onNoteStartCallback?.(midi, trackId)
    setTimeout(() => {
      this.onNoteEndCallback?.(midi, trackId)
    }, duration * 1000)
  }

  triggerAttack(midi: number, trackId: string, velocity: number = 0.8): void {
    const track = this.tracks.get(trackId)
    if (!track || track.state.muted) return

    const freq = 440 * Math.pow(2, (midi - 69) / 12)

    if (track.synth instanceof Tone.PolySynth) {
      track.synth.triggerAttack(freq, Tone.now(), velocity)
    } else {
      track.synth.triggerAttack(freq, Tone.now(), velocity)
    }

    this.onNoteStartCallback?.(midi, trackId)
  }

  triggerRelease(midi: number, trackId: string): void {
    const track = this.tracks.get(trackId)
    if (!track) return

    const freq = 440 * Math.pow(2, (midi - 69) / 12)

    if (track.synth instanceof Tone.PolySynth) {
      track.synth.triggerRelease(freq)
    } else {
      track.synth.triggerRelease(freq)
    }

    this.onNoteEndCallback?.(midi, trackId)
  }

  scheduleNotes(notes: NoteEvent[]): void {
    this.clearScheduled()

    for (const note of notes) {
      const track = this.tracks.get(note.trackId)
      if (!track || track.state.muted) continue

      const freq = 440 * Math.pow(2, (note.midi - 69) / 12)

      const eventId = Tone.Transport.schedule((time) => {
        if (track.synth instanceof Tone.PolySynth) {
          track.synth.triggerAttackRelease(freq, note.duration, time, note.velocity)
        } else {
          track.synth.triggerAttackRelease(freq, note.duration, time, note.velocity)
        }

        Tone.Draw.schedule(() => {
          this.onNoteStartCallback?.(note.midi, note.trackId)
        }, time)

        Tone.Draw.schedule(() => {
          this.onNoteEndCallback?.(note.midi, note.trackId)
        }, time + note.duration)
      }, note.startTime)

      this.scheduledEvents.push(eventId)
    }
  }

  clearScheduled(): void {
    for (const id of this.scheduledEvents) {
      Tone.Transport.clear(id)
    }
    this.scheduledEvents = []
  }

  play(): void {
    if (this.isPlaying) return
    Tone.Transport.start()
    this.isPlaying = true
    this.startProgressLoop()
  }

  pause(): void {
    if (!this.isPlaying) return
    Tone.Transport.pause()
    this.isPlaying = false
    this.stopProgressLoop()
  }

  stop(): void {
    Tone.Transport.stop()
    this.isPlaying = false
    this.stopProgressLoop()
    this.onProgressCallback?.(0)
  }

  seek(time: number): void {
    Tone.Transport.position = time
    if (!this.isPlaying) {
      this.onProgressCallback?.(time)
    }
  }

  getCurrentTime(): number {
    return Tone.Transport.seconds
  }

  getCurrentBeat(): number {
    return Tone.Transport.seconds * (this.bpm / 60)
  }

  setBPM(bpm: number): void {
    this.bpm = bpm
    Tone.Transport.bpm.value = bpm
  }

  getBPM(): number {
    return this.bpm
  }

  setLoop(start: number, end: number): void {
    this.loopStart = start
    this.loopEnd = end
    this.isLooping = true
    Tone.Transport.setLoopPoints(start, end)
    Tone.Transport.loop = true
  }

  setLooping(enabled: boolean): void {
    this.isLooping = enabled
    Tone.Transport.loop = enabled
    if (enabled && this.loopEnd > this.loopStart) {
      Tone.Transport.setLoopPoints(this.loopStart, this.loopEnd)
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying
  }

  getIsLooping(): boolean {
    return this.isLooping
  }

  getIsInitialized(): boolean {
    return this.initialized
  }

  private startProgressLoop(): void {
    this.stopProgressLoop()
    const update = () => {
      if (this.isPlaying) {
        this.onProgressCallback?.(Tone.Transport.seconds)
        this.loopEventId = requestAnimationFrame(update)
      }
    }
    this.loopEventId = requestAnimationFrame(update)
  }

  private stopProgressLoop(): void {
    if (this.loopEventId !== null) {
      cancelAnimationFrame(this.loopEventId)
      this.loopEventId = null
    }
  }

  onProgress(callback: (time: number) => void): void {
    this.onProgressCallback = callback
  }

  onNoteStart(callback: (midi: number, trackId: string) => void): void {
    this.onNoteStartCallback = callback
  }

  onNoteEnd(callback: (midi: number, trackId: string) => void): void {
    this.onNoteEndCallback = callback
  }

  dispose(): void {
    this.stopProgressLoop()
    this.clearScheduled()
    Tone.Transport.stop()
    Tone.Transport.cancel()

    for (const id of Array.from(this.tracks.keys())) {
      this.removeTrack(id)
    }

    if (this.masterGain) {
      this.masterGain.dispose()
      this.masterGain = null
    }
    if (this.masterLimiter) {
      this.masterLimiter.dispose()
      this.masterLimiter = null
    }

    this.initialized = false
    this.isPlaying = false
  }
}

export const synthEngine = new SynthEngine()
export default synthEngine
