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

  const clearAllTimeouts = useCallback(() => {
    playbackTimeoutsRef.current.forEach(id => clearTimeout(id))
    playbackTimeoutsRef.current = []
  }, [])

  const handleRecordToggle = useCallback(() => {
    initAudioContext()
    if (recording) {
      stopRecording()
    } else {
      startRecording()
    }
  }, [recording, startRecording, stopRecording, initAudioContext])

  const scheduleEvent = useCallback((event: typeof recordedEvents[0], delay: number) => {
    const timeoutId = window.setTimeout(() => {
      if (event.type === 'noteOn') {
        const color = getColorForNote(event.note)
        playNote(event.freq, 0.5)
        addNote(event.note, event.freq, color, 80)
      } else {
        stopNote(event.freq)
        removeNote(event.note)
      }
      playbackIndexRef.current++
    }, delay)
    playbackTimeoutsRef.current.push(timeoutId)
  }, [playNote, stopNote, addNote, removeNote])

  const startPlayback = useCallback(() => {
    if (recordedEvents.length === 0) return

    initAudioContext()
    clearAllTimeouts()
    clearAllNotes()
    
    const isResuming = isPausedRef.current
    const startTime = isResuming ? pausedAtRef.current : 0
    playbackStartTimeRef.current = performance.now() - startTime
    playbackIndexRef.current = 0
    isPausedRef.current = false

    recordedEvents.forEach((event) => {
      if (event.timestamp >= startTime) {
        const delay = event.timestamp - startTime
        scheduleEvent(event, delay)
      }
    })

    const totalDuration = Math.max(...recordedEvents.map(e => e.timestamp)) + 1000
    const endTimeout = window.setTimeout(() => {
      setIsPlaying(false)
      clearAllNotes()
      isPausedRef.current = false
      pausedAtRef.current = 0
    }, totalDuration - startTime)
    playbackTimeoutsRef.current.push(endTimeout)

    setIsPlaying(true)
  }, [recordedEvents, clearAllTimeouts, clearAllNotes, scheduleEvent, setIsPlaying, initAudioContext])

  const pausePlayback = useCallback(() => {
    const elapsed = performance.now() - playbackStartTimeRef.current
    pausedAtRef.current = elapsed
    isPausedRef.current = true
    clearAllTimeouts()
    clearAllNotes()
    setIsPlaying(false)
  }, [clearAllTimeouts, clearAllNotes, setIsPlaying])

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
