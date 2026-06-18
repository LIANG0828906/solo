import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { eventBus, type MelodyTrack, type InstrumentType, type Note } from '../eventBus'
import { createEmptyTrack } from '../domain/melody'

interface AppState {
  tracks: MelodyTrack[]
  isPlaying: boolean
  currentTime: number
  duration: number
  bpm: number
  loop: boolean
  masterVolume: number
  masterReverb: number
  masterDelay: number
  selectedTrackId: string | null
  editorOpen: boolean
  editingTrackId: string | null
  exportProgress: number
  exportUrl: string | null
}

interface AppContextType extends AppState {
  addTrack: (instrument: InstrumentType) => void
  removeTrack: (id: string) => void
  updateTrack: (id: string, updates: Partial<MelodyTrack>) => void
  updateNotes: (id: string, notes: Note[]) => void
  setMasterMix: (volume: number, reverb: number, delay: number) => void
  playPause: () => void
  stop: () => void
  seekTo: (time: number) => void
  setBpm: (bpm: number) => void
  setLoop: (loop: boolean) => void
  openEditor: (trackId: string) => void
  closeEditor: () => void
  reorderTracks: (trackIds: string[]) => void
  exportWav: () => void
  clearExport: () => void
}

const AppContext = createContext<AppContextType | null>(null)

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}

let trackIdCounter = 0
const generateTrackId = () => {
  trackIdCounter++
  return `track_${Date.now()}_${trackIdCounter}`
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tracks, setTracks] = useState<MelodyTrack[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [bpm, setBpmState] = useState(120)
  const [loop, setLoopState] = useState(false)
  const [masterVolume, setMasterVolume] = useState(0.8)
  const [masterReverb, setMasterReverb] = useState(0.3)
  const [masterDelay, setMasterDelay] = useState(0.2)
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportUrl, setExportUrl] = useState<string | null>(null)
  
  const tracksRef = useRef(tracks)
  tracksRef.current = tracks

  useEffect(() => {
    const unsub1 = eventBus.on('playbackProgress', ({ time, duration }) => {
      setCurrentTime(time)
      setDuration(duration)
    })

    const unsub2 = eventBus.on('playbackState', ({ isPlaying }) => {
      setIsPlaying(isPlaying)
    })

    const unsub3 = eventBus.on('exportProgress', ({ progress }) => {
      setExportProgress(progress)
    })

    const unsub4 = eventBus.on('exportComplete', ({ url }) => {
      setExportUrl(url)
    })

    const unsub5 = eventBus.on('openEditor', ({ trackId }) => {
      setEditorOpen(true)
      setEditingTrackId(trackId)
    })

    const unsub6 = eventBus.on('closeEditor', () => {
      setEditorOpen(false)
      setEditingTrackId(null)
    })

    return () => {
      unsub1()
      unsub2()
      unsub3()
      unsub4()
      unsub5()
      unsub6()
    }
  }, [])

  const addTrack = useCallback((instrument: InstrumentType) => {
    if (tracksRef.current.length >= 6) return
    
    const id = generateTrackId()
    const newTrack = createEmptyTrack(id, instrument)
    
    setTracks(prev => {
      const updated = [...prev, newTrack]
      eventBus.emit('tracksChanged', { tracks: updated })
      return updated
    })
    
    eventBus.emit('addTrack', { id, instrument, notes: [] })
  }, [])

  const removeTrack = useCallback((id: string) => {
    setTracks(prev => {
      const updated = prev.filter(t => t.id !== id)
      eventBus.emit('tracksChanged', { tracks: updated })
      return updated
    })
    eventBus.emit('removeTrack', { id })
    
    if (selectedTrackId === id) setSelectedTrackId(null)
    if (editingTrackId === id) {
      setEditorOpen(false)
      setEditingTrackId(null)
    }
  }, [selectedTrackId, editingTrackId])

  const updateTrack = useCallback((id: string, updates: Partial<MelodyTrack>) => {
    setTracks(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, ...updates } : t)
      eventBus.emit('tracksChanged', { tracks: updated })
      return updated
    })
    eventBus.emit('updateTrack', { id, ...updates })
  }, [])

  const updateNotes = useCallback((id: string, notes: Note[]) => {
    setTracks(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, notes } : t)
      eventBus.emit('tracksChanged', { tracks: updated })
      return updated
    })
    eventBus.emit('updateNotes', { id, notes })
  }, [])

  const setMasterMix = useCallback((volume: number, reverb: number, delay: number) => {
    setMasterVolume(volume)
    setMasterReverb(reverb)
    setMasterDelay(delay)
    eventBus.emit('mixTrack', { masterVolume: volume, masterReverb: reverb, masterDelay: delay })
  }, [])

  const playPause = useCallback(() => {
    if (isPlaying) {
      eventBus.emit('pauseAll', undefined as any)
    } else {
      eventBus.emit('playAll', { bpm, loop })
    }
  }, [isPlaying, bpm, loop])

  const stop = useCallback(() => {
    eventBus.emit('stopAll', undefined as any)
  }, [])

  const seekTo = useCallback((time: number) => {
    eventBus.emit('seekTo', { time })
    setCurrentTime(time)
  }, [])

  const setBpm = useCallback((newBpm: number) => {
    setBpmState(newBpm)
    eventBus.emit('setBpm', { bpm: newBpm })
  }, [])

  const setLoop = useCallback((newLoop: boolean) => {
    setLoopState(newLoop)
  }, [])

  const openEditor = useCallback((trackId: string) => {
    eventBus.emit('openEditor', { trackId })
  }, [])

  const closeEditor = useCallback(() => {
    eventBus.emit('closeEditor', undefined as any)
  }, [])

  const reorderTracks = useCallback((trackIds: string[]) => {
    setTracks(prev => {
      const idToTrack = new Map(prev.map(t => [t.id, t]))
      const updated = trackIds.map(id => idToTrack.get(id)!).filter(Boolean)
      eventBus.emit('tracksChanged', { tracks: updated })
      return updated
    })
    eventBus.emit('reorderTracks', { trackIds })
  }, [])

  const exportWav = useCallback(() => {
    setExportProgress(0)
    setExportUrl(null)
    eventBus.emit('exportWav', undefined as any)
  }, [])

  const clearExport = useCallback(() => {
    setExportProgress(0)
    setExportUrl(null)
  }, [])

  const value: AppContextType = {
    tracks,
    isPlaying,
    currentTime,
    duration,
    bpm,
    loop,
    masterVolume,
    masterReverb,
    masterDelay,
    selectedTrackId,
    editorOpen,
    editingTrackId,
    exportProgress,
    exportUrl,
    addTrack,
    removeTrack,
    updateTrack,
    updateNotes,
    setMasterMix,
    playPause,
    stop,
    seekTo,
    setBpm,
    setLoop,
    openEditor,
    closeEditor,
    reorderTracks,
    exportWav,
    clearExport,
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export default AppContext
