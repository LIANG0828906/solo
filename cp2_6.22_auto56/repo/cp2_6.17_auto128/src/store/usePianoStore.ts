import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export interface Note {
  id: string
  note: string
  freq: number
  color: string
  velocity: number
  startTime: number
}

export interface RecordedEvent {
  type: 'noteOn' | 'noteOff'
  note: string
  freq: number
  timestamp: number
}

interface PianoState {
  activeNotes: Note[]
  recording: boolean
  recordedEvents: RecordedEvent[]
  isPlaying: boolean
  recordingStartTime: number
  maxActiveNotes: number
  addNote: (note: string, freq: number, color: string, velocity: number) => void
  removeNote: (note: string) => void
  clearAllNotes: () => void
  startRecording: () => void
  stopRecording: () => void
  setIsPlaying: (playing: boolean) => void
  clearRecordedEvents: () => void
}

export const usePianoStore = create<PianoState>((set, get) => ({
  activeNotes: [],
  recording: false,
  recordedEvents: [],
  isPlaying: false,
  recordingStartTime: 0,
  maxActiveNotes: 12,

  addNote: (note, freq, color, velocity) => {
    const state = get()
    if (state.activeNotes.length >= state.maxActiveNotes) {
      return
    }
    
    const existingNote = state.activeNotes.find(n => n.note === note)
    if (existingNote) {
      return
    }

    const newNote: Note = {
      id: uuidv4(),
      note,
      freq,
      color,
      velocity,
      startTime: Date.now(),
    }

    set({ activeNotes: [...state.activeNotes, newNote] })

    if (state.recording) {
      const event: RecordedEvent = {
        type: 'noteOn',
        note,
        freq,
        timestamp: Date.now() - state.recordingStartTime,
      }
      set({ recordedEvents: [...state.recordedEvents, event] })
    }
  },

  removeNote: (note) => {
    const state = get()
    set({ activeNotes: state.activeNotes.filter(n => n.note !== note) })

    if (state.recording) {
      const freqVal = state.activeNotes.find(n => n.note === note)?.freq || 0
      const event: RecordedEvent = {
        type: 'noteOff',
        note,
        freq: freqVal,
        timestamp: Date.now() - state.recordingStartTime,
      }
      set({ recordedEvents: [...state.recordedEvents, event] })
    }
  },

  clearAllNotes: () => {
    set({ activeNotes: [] })
  },

  startRecording: () => {
    set({
      recording: true,
      recordedEvents: [],
      recordingStartTime: Date.now(),
    })
  },

  stopRecording: () => {
    set({ recording: false })
  },

  setIsPlaying: (playing) => {
    set({ isPlaying: playing })
  },

  clearRecordedEvents: () => {
    set({ recordedEvents: [] })
  },
}))
