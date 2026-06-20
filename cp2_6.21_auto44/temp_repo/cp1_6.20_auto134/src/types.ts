export interface Note {
  id: string
  pitch: number
  startTick: number
  duration: number
  trackId: string
}

export interface Track {
  id: string
  name: string
  color: string
  clef: string
  keySignature: string
  volume: number
  pan: number
  notes: Note[]
  muted: boolean
  solo: boolean
}

export interface Project {
  id: string
  name: string
  bpm: number
  tracks: Track[]
  createdAt: string
  updatedAt: string
}

export const TRACK_COLORS = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3'] as const
export const TRACK_NAMES = ['Piano', 'Guitar', 'Bass', 'Drums'] as const
export const MIN_PITCH = 60
export const MAX_PITCH = 84
export const TICKS_PER_BEAT = 16
export const TOTAL_BEATS = 32
export const PIANO_KEY_WIDTH = 48
export const NOTE_HEIGHT = 14
export const MIN_BPM = 30
export const MAX_BPM = 240
export const DEFAULT_VOLUME = 80

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

export function pitchToName(pitch: number): string {
  const octave = Math.floor(pitch / 12) - 1
  const noteIndex = pitch % 12
  return `${NOTE_NAMES[noteIndex]}${octave}`
}

export function pitchIsBlack(pitch: number): boolean {
  const n = pitch % 12
  return [1, 3, 6, 8, 10].includes(n)
}
