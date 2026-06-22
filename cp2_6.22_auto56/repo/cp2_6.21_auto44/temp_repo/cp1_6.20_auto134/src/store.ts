import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { Project, Track, Note } from './types'
import {
  TRACK_COLORS,
  TRACK_NAMES,
  MIN_BPM,
  DEFAULT_VOLUME,
} from './types'

interface AppState {
  projects: Project[]
  currentProject: Project | null
  isPlaying: boolean
  playheadTick: number
  drawerOpen: boolean
  trackPanelOpen: boolean
  selectedTrackId: string | null
  selectedNoteId: string | null
  loading: boolean

  setProjects: (projects: Project[]) => void
  setCurrentProject: (project: Project | null) => void
  setIsPlaying: (playing: boolean) => void
  setPlayheadTick: (tick: number) => void
  setDrawerOpen: (open: boolean) => void
  setTrackPanelOpen: (open: boolean) => void
  setSelectedTrackId: (id: string | null) => void
  setSelectedNoteId: (id: string | null) => void
  setLoading: (loading: boolean) => void

  createProject: (name: string) => void
  addTrack: () => void
  removeTrack: (trackId: string) => void
  updateTrack: (trackId: string, updates: Partial<Track>) => void
  addNote: (trackId: string, pitch: number, startTick: number, duration?: number) => void
  removeNote: (trackId: string, noteId: string) => void
  updateNote: (trackId: string, noteId: string, updates: Partial<Note>) => void
  setBpm: (bpm: number) => void
  setProjectName: (name: string) => void
}

function createDefaultTracks(): Track[] {
  return [
    {
      id: uuidv4(),
      name: TRACK_NAMES[0],
      color: TRACK_COLORS[0],
      clef: 'treble',
      keySignature: 'C',
      volume: DEFAULT_VOLUME,
      pan: 0,
      notes: [],
      muted: false,
      solo: false,
    },
  ]
}

export const useStore = create<AppState>((set, get) => ({
  projects: [],
  currentProject: null,
  isPlaying: false,
  playheadTick: 0,
  drawerOpen: false,
  trackPanelOpen: true,
  selectedTrackId: null,
  selectedNoteId: null,
  loading: false,

  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) =>
    set({ currentProject: project, selectedTrackId: project?.tracks[0]?.id ?? null }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setPlayheadTick: (tick) => set({ playheadTick: tick }),
  setDrawerOpen: (open) => set({ drawerOpen: open }),
  setTrackPanelOpen: (open) => set({ trackPanelOpen: open }),
  setSelectedTrackId: (id) => set({ selectedTrackId: id }),
  setSelectedNoteId: (id) => set({ selectedNoteId: id }),
  setLoading: (loading) => set({ loading }),

  createProject: (name) => {
    const now = new Date().toISOString()
    const project: Project = {
      id: uuidv4(),
      name,
      bpm: MIN_BPM * 4,
      tracks: createDefaultTracks(),
      createdAt: now,
      updatedAt: now,
    }
    set((state) => ({
      projects: [...state.projects, project],
      currentProject: project,
      selectedTrackId: project.tracks[0].id,
      selectedNoteId: null,
    }))
  },

  addTrack: () => {
    const { currentProject } = get()
    if (!currentProject || currentProject.tracks.length >= 4) return
    const idx = currentProject.tracks.length
    const track: Track = {
      id: uuidv4(),
      name: TRACK_NAMES[idx] || `Track ${idx + 1}`,
      color: TRACK_COLORS[idx] || '#e0e0e0',
      clef: 'treble',
      keySignature: 'C',
      volume: DEFAULT_VOLUME,
      pan: 0,
      notes: [],
      muted: false,
      solo: false,
    }
    set({
      currentProject: {
        ...currentProject,
        tracks: [...currentProject.tracks, track],
        updatedAt: new Date().toISOString(),
      },
    })
  },

  removeTrack: (trackId) => {
    const { currentProject } = get()
    if (!currentProject || currentProject.tracks.length <= 1) return
    set({
      currentProject: {
        ...currentProject,
        tracks: currentProject.tracks.filter((t) => t.id !== trackId),
        updatedAt: new Date().toISOString(),
      },
    })
  },

  updateTrack: (trackId, updates) => {
    const { currentProject } = get()
    if (!currentProject) return
    set({
      currentProject: {
        ...currentProject,
        tracks: currentProject.tracks.map((t) =>
          t.id === trackId ? { ...t, ...updates } : t
        ),
        updatedAt: new Date().toISOString(),
      },
    })
  },

  addNote: (trackId, pitch, startTick, duration = 4) => {
    const { currentProject } = get()
    if (!currentProject) return
    const note: Note = {
      id: uuidv4(),
      pitch,
      startTick,
      duration,
      trackId,
    }
    set({
      currentProject: {
        ...currentProject,
        tracks: currentProject.tracks.map((t) =>
          t.id === trackId ? { ...t, notes: [...t.notes, note] } : t
        ),
        updatedAt: new Date().toISOString(),
      },
      selectedNoteId: note.id,
    })
  },

  removeNote: (trackId, noteId) => {
    const { currentProject } = get()
    if (!currentProject) return
    set({
      currentProject: {
        ...currentProject,
        tracks: currentProject.tracks.map((t) =>
          t.id === trackId
            ? { ...t, notes: t.notes.filter((n) => n.id !== noteId) }
            : t
        ),
        updatedAt: new Date().toISOString(),
      },
      selectedNoteId: null,
    })
  },

  updateNote: (trackId, noteId, updates) => {
    const { currentProject } = get()
    if (!currentProject) return
    set({
      currentProject: {
        ...currentProject,
        tracks: currentProject.tracks.map((t) =>
          t.id === trackId
            ? {
                ...t,
                notes: t.notes.map((n) =>
                  n.id === noteId ? { ...n, ...updates } : n
                ),
              }
            : t
        ),
        updatedAt: new Date().toISOString(),
      },
    })
  },

  setBpm: (bpm) => {
    const { currentProject } = get()
    if (!currentProject) return
    set({
      currentProject: { ...currentProject, bpm, updatedAt: new Date().toISOString() },
    })
  },

  setProjectName: (name) => {
    const { currentProject } = get()
    if (!currentProject) return
    set({
      currentProject: { ...currentProject, name, updatedAt: new Date().toISOString() },
    })
  },
}))
