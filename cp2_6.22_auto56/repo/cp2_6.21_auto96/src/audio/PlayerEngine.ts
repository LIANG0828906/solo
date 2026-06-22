import * as Tone from 'tone'
import { useScoreStore, InstrumentType, Note, Track } from '../store/useScoreStore'

const INSTRUMENT_COLORS: Record<InstrumentType, string> = {
  piano: '#e74c3c',
  guitar: '#f39c12',
  drums: '#f1c40f',
  violin: '#2ecc71',
  bass: '#3498db',
}

class PlayerEngine {
  private synths: Map<InstrumentType, Tone.PolySynth | Tone.MembraneSynth>
  private volumes: Map<InstrumentType, Tone.Volume>
  private masterGain: Tone.Gain | null
  private initialized: boolean
  private scheduledEvents: number[]
  private animationFrameId: number | null

  constructor() {
    this.synths = new Map()
    this.volumes = new Map()
    this.masterGain = null
    this.initialized = false
    this.scheduledEvents = []
    this.animationFrameId = null
  }

  async init() {
    if (this.initialized) return

    await Tone.start()

    const state = useScoreStore.getState()
    Tone.Transport.bpm.value = state.tempo

    this.masterGain = new Tone.Gain(1)
    this.masterGain.toDestination()

    const polyphonicInstruments: InstrumentType[] = ['piano', 'guitar', 'violin', 'bass']
    polyphonicInstruments.forEach(inst => {
      const track = state.tracks.find(t => t.instrument === inst)
      const volume = new Tone.Volume(track ? track.volume : -6)
      const synth = new Tone.PolySynth(Tone.Synth)
      synth.connect(volume)
      volume.connect(this.masterGain!)
      this.synths.set(inst, synth)
      this.volumes.set(inst, volume)
    })

    const drumsTrack = state.tracks.find(t => t.instrument === 'drums')
    const drumsVolume = new Tone.Volume(drumsTrack ? drumsTrack.volume : -6)
    const drumsSynth = new Tone.MembraneSynth()
    drumsSynth.connect(drumsVolume)
    drumsVolume.connect(this.masterGain!)
    this.synths.set('drums', drumsSynth)
    this.volumes.set('drums', drumsVolume)

    this.initialized = true
  }

  scheduleNotes(notes: Note[], tracks: Track[]) {
    this.clearScheduledEvents()

    const state = useScoreStore.getState()
    const startBeat = state.currentBeat
    const isLooping = state.isLooping

    const notesByTime = new Map<number, { note: Note; track: Track }[]>()

    notes.forEach(note => {
      if (note.time >= startBeat) {
        const track = tracks.find(t => t.instrument === note.instrument)
        if (track) {
          if (!notesByTime.has(note.time)) {
            notesByTime.set(note.time, [])
          }
          notesByTime.get(note.time)!.push({ note, track })
        }
      }
    })

    notesByTime.forEach((noteList, beat) => {
      const time = (beat - startBeat) * 0.25

      const eventId = Tone.Transport.schedule((transportTime) => {
        noteList.forEach(({ note, track }) => {
          if (track.muted) return

          const synth = this.synths.get(note.instrument)
          const volume = this.volumes.get(note.instrument)
          if (!synth || !volume) return

          volume.volume.value = track.volume

          const duration = '16n'

          if (note.instrument === 'drums') {
            const drumSynth = synth as Tone.MembraneSynth
            const beatInBar = note.time % 4
            if (beatInBar === 0) {
              drumSynth.triggerAttackRelease('C1', duration, transportTime)
            } else if (beatInBar === 2) {
              drumSynth.triggerAttackRelease('C2', duration, transportTime)
            }
          } else {
            const polySynth = synth as Tone.PolySynth
            polySynth.triggerAttackRelease('C4', duration, transportTime)
          }
        })

        useScoreStore.getState().setCurrentBeat(beat)
      }, time)

      this.scheduledEvents.push(eventId)
    })

    const totalTime = 8
    if (isLooping) {
      const loopEventId = Tone.Transport.schedule(() => {
        useScoreStore.getState().setCurrentBeat(0)
        this.scheduleNotes(notes, tracks)
      }, totalTime)
      this.scheduledEvents.push(loopEventId)
    } else {
      const endEventId = Tone.Transport.schedule(() => {
        useScoreStore.getState().setPlaying(false)
        Tone.Transport.stop()
        useScoreStore.getState().setCurrentBeat(0)
      }, totalTime)
      this.scheduledEvents.push(endEventId)
    }
  }

  clearScheduledEvents() {
    this.scheduledEvents.forEach(id => Tone.Transport.clear(id))
    this.scheduledEvents = []
  }

  async play() {
    if (!this.initialized) {
      await this.init()
    }

    const state = useScoreStore.getState()
    Tone.Transport.bpm.value = state.tempo
    this.scheduleNotes(state.notes, state.tracks)

    Tone.Transport.start()
    this.startProgressUpdate()
  }

  pause() {
    Tone.Transport.pause()
    this.stopProgressUpdate()
  }

  stop() {
    Tone.Transport.stop()
    Tone.Transport.position = 0
    this.clearScheduledEvents()
    this.stopProgressUpdate()
    useScoreStore.getState().setCurrentBeat(0)
  }

  seekToBeat(beat: number) {
    const clampedBeat = Math.max(0, Math.min(31, beat))
    const secondsPerBeat = 60 / useScoreStore.getState().tempo / 4
    Tone.Transport.seconds = clampedBeat * secondsPerBeat
    useScoreStore.getState().setCurrentBeat(clampedBeat)

    if (Tone.Transport.state === 'started') {
      const state = useScoreStore.getState()
      this.clearScheduledEvents()
      this.scheduleNotes(state.notes, state.tracks)
    }
  }

  private startProgressUpdate() {
    const update = () => {
      const position = Tone.Transport.position as number
      const beat = Math.floor(position / 0.25)
      if (beat >= 0 && beat <= 31) {
        useScoreStore.getState().setCurrentBeat(beat)
      }
      this.animationFrameId = requestAnimationFrame(update)
    }
    this.animationFrameId = requestAnimationFrame(update)
  }

  private stopProgressUpdate() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  updateTrackVolume(instrument: InstrumentType, volume: number) {
    const vol = this.volumes.get(instrument)
    if (vol) {
      vol.volume.value = volume
    }
  }

  setMasterVolume(value: number) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, value))
    }
  }

  getInstrumentColor(instrument: InstrumentType): string {
    return INSTRUMENT_COLORS[instrument]
  }

  dispose() {
    this.stop()
    this.synths.forEach(synth => synth.dispose())
    this.volumes.forEach(vol => vol.dispose())
    if (this.masterGain) {
      this.masterGain.dispose()
      this.masterGain = null
    }
    this.synths.clear()
    this.volumes.clear()
    this.initialized = false
  }
}

export const playerEngine = new PlayerEngine()
export { INSTRUMENT_COLORS }
