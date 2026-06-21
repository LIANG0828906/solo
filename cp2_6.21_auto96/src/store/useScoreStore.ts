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
  setTempo: (tempo: number) => void
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
  importScore: (data: unknown) => boolean
}

const INSTRUMENTS: InstrumentType[] = ['piano', 'guitar', 'drums', 'violin', 'bass']

const initialTracks: Track[] = INSTRUMENTS.map(instrument => ({
  instrument,
  muted: false,
  volume: -6,
}))

const generateId = () => Math.random().toString(36).substring(2, 11)

function isValidInstrumentType(value: string): value is InstrumentType {
  return INSTRUMENTS.includes(value as InstrumentType)
}

function validateExportScore(data: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['数据必须是一个对象'] }
  }

  const obj = data as Record<string, unknown>

  if (obj.tempo === undefined || obj.tempo === null) {
    errors.push('缺少 tempo 字段')
  } else if (typeof obj.tempo !== 'number' || obj.tempo <= 0) {
    errors.push('tempo 必须是大于0的数字')
  }

  if (!Array.isArray(obj.tracks)) {
    errors.push('缺少 tracks 数组字段')
    return { valid: false, errors }
  }

  const tracks = obj.tracks as unknown[]
  tracks.forEach((track, index) => {
    if (!track || typeof track !== 'object') {
      errors.push(`第${index + 1}个轨道数据无效`)
      return
    }
    const t = track as Record<string, unknown>

    if (typeof t.instrument !== 'string' || !isValidInstrumentType(t.instrument)) {
      errors.push(`第${index + 1}个轨道的 instrument 无效，必须是: ${INSTRUMENTS.join(', ')}`)
    }

    if (!Array.isArray(t.notes)) {
      errors.push(`第${index + 1}个轨道缺少 notes 数组`)
      return
    }

    const notes = t.notes as unknown[]
    notes.forEach((note, noteIndex) => {
      if (!note || typeof note !== 'object') {
        errors.push(`第${index + 1}个轨道的第${noteIndex + 1}个音符数据无效`)
        return
      }
      const n = note as Record<string, unknown>
      if (typeof n.time !== 'number' || n.time < 0 || n.time > 31) {
        errors.push(`第${index + 1}个轨道的第${noteIndex + 1}个音符的 time 无效(0-31)`)
      }
      if (typeof n.duration !== 'number' || n.duration <= 0) {
        errors.push(`第${index + 1}个轨道的第${noteIndex + 1}个音符的 duration 无效`)
      }
    })
  })

  return { valid: errors.length === 0, errors }
}

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

  setTempo: (tempo) => {
    if (tempo > 0 && tempo <= 300) {
      set({ tempo })
    }
  },

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

  importScore: (data: unknown): boolean => {
    const validation = validateExportScore(data)
    if (!validation.valid) {
      console.error('导入验证失败:', validation.errors)
      alert('导入验证失败:\n' + validation.errors.join('\n'))
      return false
    }

    const score = data as ExportScore
    const newNotes: Note[] = []
    score.tracks.forEach(track => {
      const instrument = track.instrument as InstrumentType
      if (isValidInstrumentType(instrument)) {
        track.notes.forEach(note => {
          newNotes.push({
            id: generateId(),
            instrument,
            time: Math.max(0, Math.min(31, Math.floor(note.time))),
            duration: note.duration,
          })
        })
      }
    })

    set({
      notes: newNotes,
      tempo: score.tempo || 120,
      currentBeat: 0,
      isPlaying: false,
      selectedNoteIds: [],
    })
    return true
  },
}))
