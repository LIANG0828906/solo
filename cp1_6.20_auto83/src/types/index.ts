export interface Note {
  id: string
  midi: number
  start: number
  duration: number
  velocity: number
  trackId: string
}

export interface Track {
  id: string
  name: string
  color: string
  volume: number
  pan: number
  muted: boolean
  preset: 'piano' | 'electronic' | 'bass'
}

export interface ProjectData {
  version: string
  bpm: number
  tracks: Track[]
  notes: Note[]
}
