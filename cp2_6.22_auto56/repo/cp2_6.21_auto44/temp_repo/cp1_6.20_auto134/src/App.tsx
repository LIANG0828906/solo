import { useCallback, useEffect, useState } from 'react'
import MidiWriter from 'midi-writer-js'
import {
  Save,
  Download,
  FileJson,
  Music,
  Menu,
} from 'lucide-react'
import { useStore } from './store'
import { TOTAL_BEATS, TICKS_PER_BEAT } from './types'
import ScoreEditor from './components/ScoreEditor'
import { useMetronomeMixer } from './components/MetronomeMixer'
import WaveformDisplay from './components/WaveformDisplay'
import ProjectDrawer from './components/ProjectDrawer'
import TrackPanel from './components/TrackPanel'
import TransportBar from './components/TransportBar'
import type { Project } from './types'

export default function App() {
  const {
    currentProject,
    isPlaying,
    playheadTick,
    drawerOpen,
    projects,
    setDrawerOpen,
    setCurrentProject,
    setProjects,
    setIsPlaying,
    setPlayheadTick,
    createProject,
    setLoading,
  } = useStore()

  const [saveStatus, setSaveStatus] = useState<string>('')
  const { togglePlay, handleSeek, analyserNode } = useMetronomeMixer()

  useEffect(() => {
    fetch('/api/projects')
      .then((res) => res.json())
      .then((data: Project[]) => {
        setProjects(data)
      })
      .catch(() => {})
  }, [setProjects])

  const handleSave = useCallback(async () => {
    if (!currentProject) return
    setSaveStatus('Saving...')
    try {
      const exists = projects.some((p) => p.id === currentProject.id)
      if (exists) {
        await fetch(`/api/projects/${currentProject.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(currentProject),
        })
      } else {
        await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: currentProject.name }),
        })
        await fetch(`/api/projects/${currentProject.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(currentProject),
        })
      }
      const res = await fetch('/api/projects')
      const data = await res.json()
      setProjects(data)
      setSaveStatus('Saved!')
    } catch {
      setSaveStatus('Error saving')
    }
    setTimeout(() => setSaveStatus(''), 2000)
  }, [currentProject, projects, setProjects])

  const handleExportMidi = useCallback(() => {
    if (!currentProject) return
    const track = new MidiWriter.Track()
    track.setTempo(currentProject.bpm)

    currentProject.tracks.forEach((t) => {
      t.notes.forEach((note) => {
        const startBeat = note.startTick / TICKS_PER_BEAT
        const durationBeats = note.duration / TICKS_PER_BEAT
        track.addEvent(
          new MidiWriter.NoteEvent({
            pitch: note.pitch,
            startTick: Math.round(startBeat * 128),
            duration: `T${Math.round(durationBeats * 128)}`,
            velocity: Math.round((t.volume / 100) * 100),
          })
        )
      })
    })

    const writer = new MidiWriter.Writer([track])
    const blob = new Blob([writer.buildFile()], { type: 'audio/midi' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentProject.name || 'score'}.mid`
    a.click()
    URL.revokeObjectURL(url)
  }, [currentProject])

  const handleExportJson = useCallback(() => {
    if (!currentProject) return
    const blob = new Blob([JSON.stringify(currentProject, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentProject.name || 'score'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [currentProject])

  const handleLoadProject = useCallback(
    async (id: string) => {
      setLoading(true)
      try {
        const res = await fetch(`/api/projects`)
        const data: Project[] = await res.json()
        const project = data.find((p) => p.id === id)
        if (project) {
          setCurrentProject(project)
          setPlayheadTick(0)
          setIsPlaying(false)
        }
      } catch {}
      setLoading(false)
    },
    [setCurrentProject, setPlayheadTick, setIsPlaying, setLoading]
  )

  const handleDeleteProject = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/projects/${id}`, { method: 'DELETE' })
        const res = await fetch('/api/projects')
        const data = await res.json()
        setProjects(data)
        if (currentProject?.id === id) {
          setCurrentProject(null)
        }
      } catch {}
    },
    [currentProject, setProjects, setCurrentProject]
  )

  const handleCreateProject = useCallback(() => {
    const name = `Project ${projects.length + 1}`
    createProject(name)
  }, [projects.length, createProject])

  const handleBpmChange = useCallback(
    (bpm: number) => {
      useStore.getState().setBpm(bpm)
    },
    []
  )

  return (
    <div className="flex flex-col h-screen bg-bg overflow-hidden">
      <header className="flex items-center justify-between px-4 h-12 bg-panel border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-all"
          >
            <Menu size={18} className="text-muted" />
          </button>
          <div className="flex items-center gap-2">
            <Music size={20} className="text-accent" />
            <span className="font-semibold text-fg tracking-wide text-sm">
              Ensemble Studio
            </span>
          </div>
          {currentProject && (
            <span className="text-muted text-xs ml-2">
              / {currentProject.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {saveStatus && (
            <span className="text-xs text-muted animate-pulse">{saveStatus}</span>
          )}
          <button
            onClick={handleSave}
            disabled={!currentProject}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/20 text-accent text-xs font-medium hover:bg-accent/30 transition-all disabled:opacity-30"
          >
            <Save size={13} />
            Save
          </button>
          <button
            onClick={handleExportMidi}
            disabled={!currentProject}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-fg text-xs font-medium hover:bg-white/10 transition-all disabled:opacity-30"
          >
            <Download size={13} />
            MIDI
          </button>
          <button
            onClick={handleExportJson}
            disabled={!currentProject}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-fg text-xs font-medium hover:bg-white/10 transition-all disabled:opacity-30"
          >
            <FileJson size={13} />
            JSON
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <ProjectDrawer
          onLoadProject={handleLoadProject}
          onDeleteProject={handleDeleteProject}
          onCreateProject={handleCreateProject}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          {!currentProject ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-panel flex items-center justify-center">
                <Music size={36} className="text-accent" />
              </div>
              <h2 className="text-xl font-semibold text-fg">
                Ensemble Studio
              </h2>
              <p className="text-muted text-sm max-w-md text-center">
                Create a new project or load an existing one to start composing your multi-track score.
              </p>
              <button
                onClick={handleCreateProject}
                className="mt-2 px-6 py-2.5 rounded-xl bg-accent text-white font-medium hover:bg-accent/80 transition-all"
              >
                New Project
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-hidden">
                <ScoreEditor
                  playheadTick={playheadTick}
                  isPlaying={isPlaying}
                />
              </div>

              <div className="shrink-0 border-t border-white/5 flex justify-center py-2">
                <TransportBar
                  isPlaying={isPlaying}
                  onTogglePlay={togglePlay}
                  bpm={currentProject.bpm}
                  onBpmChange={handleBpmChange}
                  playheadTick={playheadTick}
                  onSeek={handleSeek}
                  totalBeats={TOTAL_BEATS}
                />
              </div>

              <div className="shrink-0 px-4 py-3 border-t border-white/5 flex justify-center">
                <WaveformDisplay analyserNode={analyserNode} />
              </div>
            </>
          )}
        </div>

        {currentProject && <TrackPanel />}
      </div>
    </div>
  )
}
