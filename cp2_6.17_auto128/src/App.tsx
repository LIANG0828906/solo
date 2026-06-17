import React, { useCallback, useRef, useEffect } from 'react'
import { PianoKeyboard } from './components/PianoKeyboard'
import { Visualizer } from './components/Visualizer'
import { usePianoStore } from './store/usePianoStore'
import { useAudioEngine } from './hooks/useAudioEngine'
import { getColorForNote } from './constants/piano'

const App: React.FC = () => {
  const {
    recording,
    recordedEvents,
    isPlaying,
    startRecording,
    stopRecording,
    setIsPlaying,
    addNote,
    removeNote,
    clearAllNotes,
  } = usePianoStore()

  const { playNote, stopNote, initAudioContext } = useAudioEngine()
  const playbackTimeoutsRef = useRef<number[]>([])
  const playbackStartTimeRef = useRef<number>(0)
  const playbackIndexRef = useRef<number>(0)
  const isPausedRef = useRef<boolean>(false)
  const pausedAtRef = useRef<number>(0)
  const rafIdRef = useRef<number | null>(null)
  const activeNotesDuringPlaybackRef = useRef<Set<string>>(new Set())

  const clearAllTimeouts = useCallback(() => {
    playbackTimeoutsRef.current.forEach(id => clearTimeout(id))
    playbackTimeoutsRef.current = []
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
  }, [])

  const handleRecordToggle = useCallback(() => {
    initAudioContext()
    if (recording) {
      stopRecording()
    } else {
      startRecording()
    }
  }, [recording, startRecording, stopRecording, initAudioContext])

  const startPlayback = useCallback(() => {
    if (recordedEvents.length === 0) return

    initAudioContext()
    clearAllTimeouts()
    clearAllNotes()
    activeNotesDuringPlaybackRef.current.clear()
    
    const isResuming = isPausedRef.current
    const startTime = isResuming ? pausedAtRef.current : 0
    playbackStartTimeRef.current = performance.now() - startTime
    playbackIndexRef.current = 0
    isPausedRef.current = false

    const sortedEvents = [...recordedEvents].sort((a, b) => a.timestamp - b.timestamp)
    playbackIndexRef.current = sortedEvents.findIndex(e => e.timestamp >= startTime)
    if (playbackIndexRef.current === -1) playbackIndexRef.current = sortedEvents.length

    const totalDuration = Math.max(...sortedEvents.map(e => e.timestamp)) + 1000

    const playbackLoop = () => {
      const elapsed = performance.now() - playbackStartTimeRef.current
      
      while (
        playbackIndexRef.current < sortedEvents.length &&
        sortedEvents[playbackIndexRef.current].timestamp <= elapsed
      ) {
        const event = sortedEvents[playbackIndexRef.current]
        if (event.type === 'noteOn') {
          if (!activeNotesDuringPlaybackRef.current.has(event.note)) {
            activeNotesDuringPlaybackRef.current.add(event.note)
            const color = getColorForNote(event.note)
            playNote(event.freq, 0.5)
            addNote(event.note, event.freq, color, 80)
          }
        } else {
          activeNotesDuringPlaybackRef.current.delete(event.note)
          stopNote(event.freq)
          removeNote(event.note)
        }
        playbackIndexRef.current++
      }

      if (elapsed < totalDuration && isPausedRef.current === false) {
        rafIdRef.current = requestAnimationFrame(playbackLoop)
      } else if (elapsed >= totalDuration) {
        setIsPlaying(false)
        clearAllNotes()
        isPausedRef.current = false
        pausedAtRef.current = 0
        activeNotesDuringPlaybackRef.current.clear()
      }
    }

    rafIdRef.current = requestAnimationFrame(playbackLoop)
    setIsPlaying(true)
  }, [recordedEvents, clearAllTimeouts, clearAllNotes, setIsPlaying, initAudioContext, playNote, stopNote, addNote, removeNote])

  const pausePlayback = useCallback(() => {
    const elapsed = performance.now() - playbackStartTimeRef.current
    pausedAtRef.current = elapsed
    isPausedRef.current = true
    clearAllTimeouts()
    clearAllNotes()
    activeNotesDuringPlaybackRef.current.forEach(note => {
      const event = recordedEvents.find(e => e.note === note && e.type === 'noteOn')
      if (event) {
        stopNote(event.freq)
      }
    })
    activeNotesDuringPlaybackRef.current.clear()
    setIsPlaying(false)
  }, [clearAllTimeouts, clearAllNotes, setIsPlaying, recordedEvents, stopNote])

  const handlePlayToggle = useCallback(() => {
    if (isPlaying) {
      pausePlayback()
    } else {
      startPlayback()
    }
  }, [isPlaying, pausePlayback, startPlayback])

  useEffect(() => {
    return () => {
      clearAllTimeouts()
      clearAllNotes()
    }
  }, [clearAllTimeouts, clearAllNotes])

  return (
    <div className="app-container">
      <Visualizer />
      <PianoKeyboard
        onRecordToggle={handleRecordToggle}
        onPlayToggle={handlePlayToggle}
        recording={recording}
        hasRecording={recordedEvents.length > 0}
        isPlaying={isPlaying}
      />

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body, html {
          width: 100%;
          height: 100%;
          overflow-x: hidden;
          background-color: #0D0D1A;
        }

        .app-container {
          width: 100%;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: #0D0D1A;
          min-width: 800px;
        }
      `}</style>
    </div>
  )
}

export default App
