import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export type AudioStyle = 'light' | 'soothing' | 'suspense' | 'intense' | 'romantic'

export interface Clip {
  id: string
  filename: string
  duration: number
  trimStart: number
  trimEnd: number
  videoUrl: string
  thumbnailUrl: string
  order: number
}

export interface Subtitle {
  id: string
  clipId: string
  text: string
  startTime: number
  endTime: number
}

export interface AudioTrack {
  style: AudioStyle
  url: string
  volume: number
  enabled: boolean
}

export interface UploadProgress {
  fileId: string
  filename: string
  progress: number
}

interface ProjectState {
  clips: Clip[]
  subtitles: Subtitle[]
  audioTrack: AudioTrack | null
  selectedClipId: string | null
  isPlaying: boolean
  currentTime: number
  uploads: UploadProgress[]
  isMobileDrawerOpen: boolean

  addClip: (clip: Omit<Clip, 'id' | 'order'>) => Clip
  removeClip: (id: string) => void
  trimClip: (id: string, trimStart: number, trimEnd: number) => void
  reorderClips: (fromIndex: number, toIndex: number) => void
  setAudio: (track: AudioTrack | null) => void
  setSelectedClip: (id: string | null) => void
  setPlaying: (playing: boolean) => void
  setCurrentTime: (time: number) => void
  addSubtitle: (subtitle: Omit<Subtitle, 'id'>) => void
  removeSubtitle: (id: string) => void
  updateSubtitle: (id: string, text: string) => void
  addUpload: (fileId: string, filename: string) => void
  updateUploadProgress: (fileId: string, progress: number) => void
  removeUpload: (fileId: string) => void
  setMobileDrawerOpen: (open: boolean) => void
  getTotalDuration: () => number
  getSelectedClip: () => Clip | undefined
  getSubtitlesForClip: (clipId: string) => Subtitle[]
}

const useStore = create<ProjectState>((set, get) => ({
  clips: [],
  subtitles: [],
  audioTrack: null,
  selectedClipId: null,
  isPlaying: false,
  currentTime: 0,
  uploads: [],
  isMobileDrawerOpen: false,

  addClip: (clipData) => {
    const id = uuidv4()
    const order = get().clips.length
    const clip: Clip = { ...clipData, id, order }
    set((state) => ({ clips: [...state.clips, clip] }))
    return clip
  },

  removeClip: (id) => {
    set((state) => {
      const clips = state.clips
        .filter((c) => c.id !== id)
        .map((c, i) => ({ ...c, order: i }))
      const subtitles = state.subtitles.filter((s) => s.clipId !== id)
      const selectedClipId = state.selectedClipId === id ? null : state.selectedClipId
      return { clips, subtitles, selectedClipId }
    })
  },

  trimClip: (id, trimStart, trimEnd) => {
    set((state) => ({
      clips: state.clips.map((c) =>
        c.id === id ? { ...c, trimStart, trimEnd } : c
      ),
    }))
  },

  reorderClips: (fromIndex, toIndex) => {
    set((state) => {
      const clips = [...state.clips].sort((a, b) => a.order - b.order)
      const [moved] = clips.splice(fromIndex, 1)
      clips.splice(toIndex, 0, moved)
      return { clips: clips.map((c, i) => ({ ...c, order: i })) }
    })
  },

  setAudio: (track) => set({ audioTrack: track }),

  setSelectedClip: (id) => set({ selectedClipId: id }),

  setPlaying: (playing) => set({ isPlaying: playing }),

  setCurrentTime: (time) => set({ currentTime: time }),

  addSubtitle: (subtitleData) => {
    const subtitle: Subtitle = { ...subtitleData, id: uuidv4() }
    set((state) => ({ subtitles: [...state.subtitles, subtitle] }))
  },

  removeSubtitle: (id) => {
    set((state) => ({
      subtitles: state.subtitles.filter((s) => s.id !== id),
    }))
  },

  updateSubtitle: (id, text) => {
    set((state) => ({
      subtitles: state.subtitles.map((s) =>
        s.id === id ? { ...s, text } : s
      ),
    }))
  },

  addUpload: (fileId, filename) => {
    set((state) => ({
      uploads: [...state.uploads, { fileId, filename, progress: 0 }],
    }))
  },

  updateUploadProgress: (fileId, progress) => {
    set((state) => ({
      uploads: state.uploads.map((u) =>
        u.fileId === fileId ? { ...u, progress } : u
      ),
    }))
  },

  removeUpload: (fileId) => {
    set((state) => ({
      uploads: state.uploads.filter((u) => u.fileId !== fileId),
    }))
  },

  setMobileDrawerOpen: (open) => set({ isMobileDrawerOpen: open }),

  getTotalDuration: () => {
    const clips = get().clips.sort((a, b) => a.order - b.order)
    return clips.reduce((sum, c) => sum + (c.trimEnd - c.trimStart), 0)
  },

  getSelectedClip: () => {
    const state = get()
    return state.clips.find((c) => c.id === state.selectedClipId)
  },

  getSubtitlesForClip: (clipId) => {
    return get().subtitles.filter((s) => s.clipId === clipId)
  },
}))

export default useStore
