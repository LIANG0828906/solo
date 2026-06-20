import React, { useState, useCallback, useRef, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import PianoRoll from './components/PianoRoll'
import ControlPanel from './components/ControlPanel'
import { Note, Track, ProjectData } from './types'
import { PresetType } from './components/SynthEngine'
import synthEngine from './components/SynthEngine'

const TRACK_COLORS = ['#6c5ce7', '#00b894', '#e17055', '#fdcb6e']
const TRACK_NAMES = ['轨道 1', '轨道 2', '轨道 3', '轨道 4']
const TRACK_PRESETS: PresetType[] = ['piano', 'electronic', 'bass', 'piano']

const App: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [activeTrackId, setActiveTrackId] = useState<string>('')
  const [isMobile, setIsMobile] = useState(false)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    const initialTracks: Track[] = []
    for (let i = 0; i < 4; i++) {
      const id = uuidv4()
      initialTracks.push({
        id,
        name: TRACK_NAMES[i],
        color: TRACK_COLORS[i],
        volume: 0,
        pan: 0,
        muted: false,
        preset: TRACK_PRESETS[i],
      })
    }

    setTracks(initialTracks)
    setActiveTrackId(initialTracks[0].id)

    initialTracks.forEach((track, index) => {
      synthEngine.createTrack(track.id, index)
    })

    const demoNotes: Note[] = [
      { id: uuidv4(), midi: 60, start: 0, duration: 1, velocity: 0.8, trackId: initialTracks[0].id },
      { id: uuidv4(), midi: 62, start: 1, duration: 1, velocity: 0.8, trackId: initialTracks[0].id },
      { id: uuidv4(), midi: 64, start: 2, duration: 1, velocity: 0.8, trackId: initialTracks[0].id },
      { id: uuidv4(), midi: 65, start: 3, duration: 1, velocity: 0.8, trackId: initialTracks[0].id },
      { id: uuidv4(), midi: 67, start: 4, duration: 2, velocity: 0.8, trackId: initialTracks[0].id },
      { id: uuidv4(), midi: 48, start: 0, duration: 2, velocity: 0.6, trackId: initialTracks[2].id },
      { id: uuidv4(), midi: 43, start: 2, duration: 2, velocity: 0.6, trackId: initialTracks[2].id },
      { id: uuidv4(), midi: 45, start: 4, duration: 2, velocity: 0.6, trackId: initialTracks[2].id },
    ]
    setNotes(demoNotes)
  }, [])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 900)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleNotesChange = useCallback((newNotes: Note[]) => {
    setNotes(newNotes)
  }, [])

  const handleActiveTrackChange = useCallback((trackId: string) => {
    setActiveTrackId(trackId)
  }, [])

  const handleTrackMuteToggle = useCallback((trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === trackId) {
          const newMuted = !t.muted
          synthEngine.setTrackMuted(trackId, newMuted)
          return { ...t, muted: newMuted }
        }
        return t
      })
    )
  }, [])

  const handleTrackVolumeChange = useCallback((trackId: string, volume: number) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === trackId) {
          synthEngine.setTrackVolume(trackId, volume)
          return { ...t, volume }
        }
        return t
      })
    )
  }, [])

  const handleTrackPanChange = useCallback((trackId: string, pan: number) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === trackId) {
          synthEngine.setTrackPan(trackId, pan)
          return { ...t, pan }
        }
        return t
      })
    )
  }, [])

  const handleTrackPresetChange = useCallback((trackId: string, preset: PresetType) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === trackId) {
          return { ...t, preset }
        }
        return t
      })
    )
  }, [])

  const handleExportJSON = useCallback(() => {
    const projectData: ProjectData = {
      version: '1.0.0',
      bpm: 120,
      tracks,
      notes,
    }

    const jsonString = JSON.stringify(projectData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'synth-project.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [tracks, notes])

  const handleImportJSON = useCallback((data: ProjectData) => {
    if (!data.tracks || !data.notes) {
      alert('导入失败：数据格式不正确')
      return
    }

    const importedTracks = data.tracks.map((t) => ({
      ...t,
      id: uuidv4(),
    }))

    const trackIdMap = new Map<string, string>()
    data.tracks.forEach((t, i) => {
      trackIdMap.set(t.id, importedTracks[i].id)
    })

    const importedNotes = data.notes.map((n) => ({
      ...n,
      id: uuidv4(),
      trackId: trackIdMap.get(n.trackId) || importedTracks[0].id,
    }))

    importedTracks.forEach((track, index) => {
      synthEngine.createTrack(track.id, index)
      if (track.preset) {
        synthEngine.setTrackPreset(track.id, track.preset)
      }
    })

    setTracks(importedTracks)
    setNotes(importedNotes)
    if (importedTracks.length > 0) {
      setActiveTrackId(importedTracks[0].id)
    }
  }, [])

  const appStyle: React.CSSProperties = {
    display: 'flex',
    width: '100%',
    height: '100%',
    background: '#1a1a2e',
    flexDirection: isMobile ? 'column' : 'row',
  }

  return (
    <div style={appStyle}>
      <ControlPanel
        tracks={tracks}
        activeTrackId={activeTrackId}
        onTrackVolumeChange={handleTrackVolumeChange}
        onTrackPanChange={handleTrackPanChange}
        onTrackMuteToggle={handleTrackMuteToggle}
        onTrackPresetChange={handleTrackPresetChange}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <PianoRoll
          tracks={tracks}
          activeTrackId={activeTrackId}
          notes={notes}
          onNotesChange={handleNotesChange}
          onActiveTrackChange={handleActiveTrackChange}
          onTrackMuteToggle={handleTrackMuteToggle}
        />
      </div>
    </div>
  )
}

export default App
