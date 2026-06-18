import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import type { AudioEngine } from '@/engine/audioEngine'

export type EffectType = 'fadeIn' | 'fadeOut' | 'echo' | 'lowpass' | 'highpass'

export interface EffectConfig {
  type: EffectType
  params: Record<string, number>
}

export interface Clip {
  id: string
  trackId: string
  audioUrl?: string
  audioBufferRef?: string
  isBeat: boolean
  startAt: number
  trimStart: number
  trimEnd: number
  duration: number
  name: string
  effects: EffectConfig[]
}

export interface Track {
  id: string
  name: string
  color: string
  volume: number
  pan: number
  muted: boolean
  solo: boolean
  isBeatTrack: boolean
  clips: Clip[]
}

export interface ProjectJSON {
  version: string
  bpm: number
  masterVolume: number
  tracks: Track[]
}

interface HistoryEntry {
  tracks: Track[]
}

interface ProjectState {
  tracks: Track[]
  masterVolume: number
  bpm: number
  playing: boolean
  playhead: number
  playheadFlash: boolean
  selectedClipId: string | null
  effectPanelClipId: string | null
  exporting: boolean
  history: HistoryEntry[]
  future: HistoryEntry[]
  audioEngine: AudioEngine | null

  initEngine: (engine: AudioEngine) => void
  snapshot: () => void
  undo: () => void
  redo: () => void

  addTrack: (beforeIdx?: number) => void
  removeTrack: (id: string) => void
  reorderTrack: (fromIdx: number, toIdx: number) => void
  renameTrack: (id: string, name: string) => void
  setTrackVolume: (id: string, v: number) => void
  setTrackPan: (id: string, p: number) => void
  toggleMute: (id: string) => void
  toggleSolo: (id: string) => void

  addClipFromBuffer: (trackId: string, data: {
    audioUrl?: string
    duration: number
    name: string
    isBeat?: boolean
    audioBufferRef?: string
    startAt?: number
  }) => string
  removeClip: (id: string) => void
  moveClip: (id: string, newStartAt: number, newTrackId?: string) => void
  trimClip: (id: string, side: 'start' | 'end', seconds: number) => void
  selectClip: (id: string | null) => void
  openEffectPanel: (id: string | null) => void

  updateEffect: (clipId: string, type: EffectType, params: Record<string, number>) => void
  removeEffect: (clipId: string, type: EffectType) => void

  generateBeatClip: () => Promise<string | null>
  setPlayhead: (t: number, flash?: boolean) => void
  setPlaying: (p: boolean) => void
  setMasterVolume: (v: number) => void
  setExporting: (v: boolean) => void

  exportProject: () => ProjectJSON
  importProject: (json: ProjectJSON) => void
}

const TRACK_COLORS = ['#E94560', '#5096FF', '#FFD54F', '#66BB6A', '#AB47BC', '#26C6DA', '#FF7043', '#EC407A']

const BEAT_TRACK_ID = uuid()

function makeInitialTracks(): Track[] {
  return [
    {
      id: BEAT_TRACK_ID,
      name: '节拍轨道',
      color: '#5096FF',
      volume: 0.8,
      pan: 0,
      muted: false,
      solo: false,
      isBeatTrack: true,
      clips: []
    },
    ...Array.from({ length: 3 }).map((_, i) => ({
      id: uuid(),
      name: `轨道 ${i + 2}`,
      color: TRACK_COLORS[(i + 1) % TRACK_COLORS.length],
      volume: 0.8,
      pan: 0,
      muted: false,
      solo: false,
      isBeatTrack: false,
      clips: [] as Clip[]
    }))
  ]
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  tracks: makeInitialTracks(),
  masterVolume: 0.9,
  bpm: 120,
  playing: false,
  playhead: 0,
  playheadFlash: false,
  selectedClipId: null,
  effectPanelClipId: null,
  exporting: false,
  history: [],
  future: [],
  audioEngine: null,

  initEngine: (engine) => set({ audioEngine: engine }),

  snapshot: () => {
    const { tracks, history } = get()
    const snap = { tracks: JSON.parse(JSON.stringify(tracks)) as Track[] }
    set({
      history: [...history.slice(-49), snap],
      future: []
    })
  },

  undo: () => {
    const { history, future } = get()
    if (history.length === 0) return
    const prev = history[history.length - 1]
    const current = { tracks: JSON.parse(JSON.stringify(get().tracks)) as Track[] }
    set({
      history: history.slice(0, -1),
      future: [...future, current],
      tracks: prev.tracks
    })
  },

  redo: () => {
    const { future, history } = get()
    if (future.length === 0) return
    const next = future[future.length - 1]
    const current = { tracks: JSON.parse(JSON.stringify(get().tracks)) as Track[] }
    set({
      history: [...history, current],
      future: future.slice(0, -1),
      tracks: next.tracks
    })
  },

  addTrack: (beforeIdx) => {
    get().snapshot()
    const { tracks } = get()
    const idx = beforeIdx ?? tracks.length
    const newTrack: Track = {
      id: uuid(),
      name: `轨道 ${tracks.length + 1}`,
      color: TRACK_COLORS[idx % TRACK_COLORS.length],
      volume: 0.8,
      pan: 0,
      muted: false,
      solo: false,
      isBeatTrack: false,
      clips: []
    }
    const next = [...tracks]
    next.splice(idx, 0, newTrack)
    set({ tracks: next })
  },

  removeTrack: (id) => {
    get().snapshot()
    set({ tracks: get().tracks.filter((t) => t.id !== id) })
  },

  reorderTrack: (fromIdx, toIdx) => {
    get().snapshot()
    const { tracks } = get()
    if (fromIdx < 0 || toIdx < 0 || fromIdx >= tracks.length || toIdx >= tracks.length) return
    const next = [...tracks]
    const [moved] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, moved)
    set({ tracks: next })
  },

  renameTrack: (id, name) => {
    get().snapshot()
    set({
      tracks: get().tracks.map((t) => (t.id === id ? { ...t, name } : t))
    })
  },

  setTrackVolume: (id, v) => {
    const { audioEngine } = get()
    if (audioEngine) audioEngine.setTrackVolume(id, v)
    set({ tracks: get().tracks.map((t) => (t.id === id ? { ...t, volume: v } : t)) })
  },

  setTrackPan: (id, p) => {
    const { audioEngine } = get()
    if (audioEngine) audioEngine.setTrackPan(id, p)
    set({ tracks: get().tracks.map((t) => (t.id === id ? { ...t, pan: p } : t)) })
  },

  toggleMute: (id) => {
    const { audioEngine } = get()
    const tracks = get().tracks.map((t) => {
      if (t.id === id) {
        const muted = !t.muted
        if (audioEngine) audioEngine.setTrackMuted(id, muted)
        return { ...t, muted }
      }
      return t
    })
    set({ tracks })
  },

  toggleSolo: (id) => {
    const { audioEngine } = get()
    const tracks = get().tracks.map((t) => {
      if (t.id === id) return { ...t, solo: !t.solo }
      return t
    })
    const anySolo = tracks.some((t) => t.solo)
    tracks.forEach((t) => {
      if (audioEngine) audioEngine.setTrackSolo(t.id, anySolo ? t.solo : true)
    })
    set({ tracks })
  },

  addClipFromBuffer: (trackId, data) => {
    get().snapshot()
    const clipId = uuid()
    const clip: Clip = {
      id: clipId,
      trackId,
      audioUrl: data.audioUrl,
      audioBufferRef: data.audioBufferRef,
      isBeat: !!data.isBeat,
      startAt: data.startAt ?? 0,
      trimStart: 0,
      trimEnd: data.duration,
      duration: data.duration,
      name: data.name,
      effects: []
    }
    const tracks = get().tracks.map((t) => {
      if (t.id !== trackId) return t
      return { ...t, clips: [...t.clips, clip] }
    })
    set({ tracks, selectedClipId: clipId })
    return clipId
  },

  removeClip: (id) => {
    get().snapshot()
    set({
      tracks: get().tracks.map((t) => ({
        ...t,
        clips: t.clips.filter((c) => c.id !== id)
      })),
      selectedClipId: get().selectedClipId === id ? null : get().selectedClipId,
      effectPanelClipId: get().effectPanelClipId === id ? null : get().effectPanelClipId
    })
  },

  moveClip: (id, newStartAt, newTrackId) => {
    get().snapshot()
    const state = get()
    let clip: Clip | null = null
    let fromTrackId: string | null = null
    for (const t of state.tracks) {
      const c = t.clips.find((c) => c.id === id)
      if (c) {
        clip = { ...c, startAt: Math.max(0, newStartAt), trackId: newTrackId ?? c.trackId }
        fromTrackId = t.id
        break
      }
    }
    if (!clip || !fromTrackId) return
    const targetTrackId = newTrackId ?? fromTrackId
    const tracks = state.tracks.map((t) => {
      if (t.id === fromTrackId && fromTrackId === targetTrackId) {
        return { ...t, clips: t.clips.map((c) => (c.id === id ? clip! : c)) }
      }
      if (t.id === fromTrackId) {
        return { ...t, clips: t.clips.filter((c) => c.id !== id) }
      }
      if (t.id === targetTrackId) {
        return { ...t, clips: [...t.clips, clip!] }
      }
      return t
    })
    set({ tracks })
  },

  trimClip: (id, side, seconds) => {
    get().snapshot()
    const tracks = get().tracks.map((t) => ({
      ...t,
      clips: t.clips.map((c) => {
        if (c.id !== id) return c
        const next = { ...c }
        if (side === 'start') {
          next.trimStart = Math.max(0, Math.min(seconds, next.trimEnd - 0.05))
        } else {
          next.trimEnd = Math.min(next.duration, Math.max(seconds, next.trimStart + 0.05))
        }
        return next
      })
    }))
    set({ tracks })
  },

  selectClip: (id) => set({ selectedClipId: id }),

  openEffectPanel: (id) => set({ effectPanelClipId: id }),

  updateEffect: (clipId, type, params) => {
    get().snapshot()
    const tracks = get().tracks.map((t) => ({
      ...t,
      clips: t.clips.map((c) => {
        if (c.id !== clipId) return c
        const existing = c.effects.findIndex((e) => e.type === type)
        let effects = [...c.effects]
        if (existing >= 0) {
          effects[existing] = { type, params: { ...effects[existing].params, ...params } }
        } else {
          if (effects.length >= 2) effects = effects.slice(1)
          effects.push({ type, params })
        }
        return { ...c, effects }
      })
    }))
    set({ tracks })
  },

  removeEffect: (clipId, type) => {
    get().snapshot()
    const tracks = get().tracks.map((t) => ({
      ...t,
      clips: t.clips.map((c) => c.id === clipId
        ? { ...c, effects: c.effects.filter((e) => e.type !== type) }
        : c
      )
    }))
    set({ tracks })
  },

  generateBeatClip: async () => {
    const { audioEngine, tracks } = get()
    if (!audioEngine) return null
    const beatTrack = tracks.find((t) => t.isBeatTrack) ?? tracks[0]
    const { buffer, refKey } = await audioEngine.generateBeatBuffer(get().bpm)
    const clipId = get().addClipFromBuffer(beatTrack.id, {
      duration: buffer.duration,
      name: `4/4 鼓点 ${get().bpm}BPM`,
      isBeat: true,
      audioBufferRef: refKey
    })
    return clipId
  },

  setPlayhead: (t, flash) => {
    const value = Math.max(0, t)
    if (flash) {
      set({ playhead: value, playheadFlash: true })
      setTimeout(() => set({ playheadFlash: false }), 300)
    } else {
      set({ playhead: value })
    }
    const eng = get().audioEngine
    if (eng) eng.seek(value)
  },

  setPlaying: (p) => {
    set({ playing: p })
    const eng = get().audioEngine
    if (!eng) return
    if (p) eng.startPlayback(get().playhead)
    else eng.stopPlayback()
  },

  setMasterVolume: (v) => {
    const eng = get().audioEngine
    if (eng) eng.setMasterVolume(v)
    set({ masterVolume: v })
  },

  setExporting: (v) => set({ exporting: v }),

  exportProject: () => {
    const { bpm, masterVolume, tracks } = get()
    return { version: '1.0', bpm, masterVolume, tracks }
  },

  importProject: (json) => {
    get().snapshot()
    set({
      bpm: json.bpm ?? 120,
      masterVolume: json.masterVolume ?? 0.9,
      tracks: json.tracks ?? makeInitialTracks()
    })
  }
}))
