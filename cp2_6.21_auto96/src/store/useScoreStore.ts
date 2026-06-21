import { create } from 'zustand'

export type InstrumentType = 'piano' | 'guitar' | 'drums' | 'violin' | 'bass'

export interface Note {
  id: string
  instrument: InstrumentType
  time: number
  duration: number
}

export interface Track {
  instrument: InstrumentType
  muted: boolean
  volume: number
}

export interface ExportTrack {
  instrument: string
  notes: { time: number; duration: number }[]
}

export interface ExportScore {
  tempo: number
  tracks: ExportTrack[]
}

interface ScoreState {
  selectedInstrument: InstrumentType
  notes: Note[]
  currentBeat: number
  isPlaying: boolean
  isLooping: boolean
  tracks: Track[]
  selectedNoteIds: string[]
  tempo: number

  setSelectedInstrument: (instrument: InstrumentType) => void
  addNote: (instrument: InstrumentType, time: number) => void
  deleteNote: (noteId: string) => void
  moveNote: (noteId: string, newTime: number) => void
  moveSelectedNotes: (deltaTime: number) => void
  toggleMute: (instrument: InstrumentType) => void
  setVolume: (instrument: InstrumentType, volume: number) => void
  togglePlay: () => void
  stop: () => void
  toggleLoop: () => void
  setCurrentBeat: (beat: number) => void
  selectNote: (noteId: string, multiSelect: boolean) => void
  clearSelection: () => void
  setPlaying: (playing: boolean) => void
  exportScore: () => ExportScore
  importScore: (data: ExportScore) => void
}

const INSTRUMENTS: InstrumentType[] = ['piano', 'guitar', 'drums', 'violin', 'bass']

const initialTracks: Track[] = INSTRUMENTS.map(instrument => ({
  instrument,
  muted: false,
  volume: -6,
}))

const generateId = () => Math.random().toString(36).substring(2, 11)

export const useScoreStore = create<ScoreState>((set, get) => ({
  selectedInstrument: 'piano',
  notes: [],
  currentBeat: 0,
  isPlaying: false,
  isLooping: false,
  tracks: initialTracks,
  selectedNoteIds: [],
  tempo: 120,

  setSelectedInstrument: (instrument) => set({ selectedInstrument: instrument }),

  addNote: (instrument, time) => {
    const existingNote = get().notes.find(
      n => n.instrument === instrument && n.time === time
    )
    if (existingNote) return

    const newNote: Note = {
      id: generateId(),
      instrument,
      time,
      duration: 0.25,
    }
    set(state => ({ notes: [...state.notes, newNote] }))
  },

  deleteNote: (noteId) => {
    set(state => ({
      notes: state.notes.filter(n => n.id !== noteId),
      selectedNoteIds: state.selectedNoteIds.filter(id => id !== noteId),
    }))
  },

  moveNote: (noteId, newTime) => {
    if (newTime < 0 || newTime > 31) return
    set(state => ({
      notes: state.notes.map(n =>
        n.id === noteId ? { ...n, time: newTime } : n
      ),
    }))
  },

  moveSelectedNotes: (deltaTime) => {
    const { selectedNoteIds, notes } = get()
    const newNotes = notes.map(n => {
      if (selectedNoteIds.includes(n.id)) {
        const newTime = Math.max(0, Math.min(31, n.time + deltaTime))
        return { ...n, time: newTime }
      }
      return n
    })
    set({ notes: newNotes })
  },

  toggleMute: (instrument) => {
    set(state => ({
      tracks: state.tracks.map(t =>
        t.instrument === instrument ? { ...t, muted: !t.muted } : t
      ),
    }))
  },

  setVolume: (instrument, volume) => {
    set(state => ({
      tracks: state.tracks.map(t =>
        t.instrument === instrument ? { ...t, volume } : t
      ),
    }))
  },

  togglePlay: () => set(state => ({ isPlaying: !state.isPlaying })),

  setPlaying: (playing) => set({ isPlaying: playing }),

  stop: () => set({ isPlaying: false, currentBeat: 0 }),

  toggleLoop: () => set(state => ({ isLooping: !state.isLooping })),

  setCurrentBeat: (beat) => set({ currentBeat: beat }),

  selectNote: (noteId, multiSelect) => {
    set(state => {
      if (multiSelect) {
        if (state.selectedNoteIds.includes(noteId)) {
          return {
            selectedNoteIds: state.selectedNoteIds.filter(id => id !== noteId),
          }
        }
        return { selectedNoteIds: [...state.selectedNoteIds, noteId] }
      }
      return { selectedNoteIds: [noteId] }
    })
  },

  clearSelection: () => set({ selectedNoteIds: [] }),

  exportScore: () => {
    const { notes, tempo } = get()
    const tracks: ExportTrack[] = INSTRUMENTS.map(instrument => ({
      instrument,
      notes: notes
        .filter(n => n.instrument === instrument)
        .map(n => ({ time: n.time, duration: n.duration })),
    }))
    return { tempo, tracks }
  },

  importScore: (data) => {
    const newNotes: Note[] = []
    data.tracks.forEach(track => {
      const instrument = track.instrument as InstrumentType
      if (INSTRUMENTS.includes(instrument)) {
        track.notes.forEach(note => {
          newNotes.push({
            id: generateId(),
            instrument,
            time: note.time,
            duration: note.duration,
          })
        })
      }
    })
    set({
      notes: newNotes,
      tempo: data.tempo || 120,
      currentBeat: 0,
      isPlaying: false,
      selectedNoteIds: [],
    })
  },
}))
