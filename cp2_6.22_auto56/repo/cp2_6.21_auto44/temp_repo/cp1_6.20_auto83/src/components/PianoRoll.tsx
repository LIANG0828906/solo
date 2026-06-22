import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { v4 as uuidv4 } from 'uuid'
import {
  MIDI_NOTE_MIN,
  MIDI_NOTE_MAX,
  TOTAL_KEYS,
  midiToNoteName,
  isBlackKey,
  noteColorGradient,
} from '../utils/musicTheory'
import { Note, Track } from '../types'
import synthEngine, { NoteEvent } from './SynthEngine'
import './PianoRoll.css'

const ROW_HEIGHT = 18
const BEAT_WIDTH = 60
const SUB_BEATS = 4
const TOTAL_BEATS = 32
const GRID_WIDTH = BEAT_WIDTH * TOTAL_BEATS
const GRID_HEIGHT = ROW_HEIGHT * TOTAL_KEYS

interface PianoRollProps {
  tracks: Track[]
  activeTrackId: string
  notes: Note[]
  onNotesChange: (notes: Note[]) => void
  onActiveTrackChange: (trackId: string) => void
  onTrackMuteToggle: (trackId: string) => void
}

type DragMode = 'none' | 'create' | 'move' | 'resize'

interface DragState {
  mode: DragMode
  noteId?: string
  startX?: number
  startY?: number
  startNote?: Note
}

const PianoRoll: React.FC<PianoRollProps> = ({
  tracks,
  activeTrackId,
  notes,
  onNotesChange,
  onActiveTrackChange,
  onTrackMuteToggle,
}) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLooping, setIsLooping] = useState(false)
  const [currentBeat, setCurrentBeat] = useState(0)
  const [bpm, setBpm] = useState(120)
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set())
  const [dragState, setDragState] = useState<DragState>({ mode: 'none' })
  const [isInitialized, setIsInitialized] = useState(false)
  const [newNoteIds, setNewNoteIds] = useState<Set<string>>(new Set())

  const gridRef = useRef<HTMLDivElement>(null)
  const pianoKeysRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const rulerRef = useRef<HTMLDivElement>(null)
  const initializedRef = useRef(false)

  const playheadX = currentBeat * BEAT_WIDTH

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    const init = async () => {
      try {
        await synthEngine.init()
        setIsInitialized(true)
      } catch (e) {
        console.error('Failed to init audio:', e)
      }
    }
    init()

    synthEngine.onProgress((time) => {
      const beats = time * (bpm / 60)
      setCurrentBeat(beats)
    })

    synthEngine.onNoteStart((midi, trackId) => {
      if (trackId === activeTrackId) {
        setActiveNotes((prev) => new Set([...prev, midi]))
      }
    })

    synthEngine.onNoteEnd((midi, trackId) => {
      if (trackId === activeTrackId) {
        setActiveNotes((prev) => {
          const next = new Set(prev)
          next.delete(midi)
          return next
        })
      }
    })
  }, [activeTrackId, bpm])

  useEffect(() => {
    if (!isInitialized) return

    tracks.forEach((track, index) => {
      const engineTrack = synthEngine.getTrackState(track.id)
      if (!engineTrack) {
        synthEngine.createTrack(track.id, index)
      } else {
        synthEngine.setTrackVolume(track.id, track.volume)
        synthEngine.setTrackPan(track.id, track.pan)
        synthEngine.setTrackMuted(track.id, track.muted)
      }
    })
  }, [tracks, isInitialized])

  useEffect(() => {
    synthEngine.setBPM(bpm)
  }, [bpm])

  useEffect(() => {
    if (!isInitialized) return

    const beatsPerSecond = bpm / 60
    const noteEvents: NoteEvent[] = notes
      .filter((note) => {
        const track = tracks.find((t) => t.id === note.trackId)
        return track && !track.muted
      })
      .map((note) => ({
        midi: note.midi,
        startTime: note.start / beatsPerSecond,
        duration: note.duration / beatsPerSecond,
        velocity: note.velocity,
        trackId: note.trackId,
      }))

    synthEngine.scheduleNotes(noteEvents)
  }, [notes, tracks, bpm, isInitialized])

  const handlePlay = useCallback(async () => {
    if (!isInitialized) {
      try {
        await synthEngine.init()
        setIsInitialized(true)
      } catch (e) {
        console.error('Failed to init audio:', e)
        return
      }
    }

    if (isPlaying) {
      synthEngine.pause()
      setIsPlaying(false)
    } else {
      synthEngine.play()
      setIsPlaying(true)
    }
  }, [isPlaying, isInitialized])

  const handleStop = useCallback(() => {
    synthEngine.stop()
    setIsPlaying(false)
    setCurrentBeat(0)
  }, [])

  const handleLoopToggle = useCallback(() => {
    const newLooping = !isLooping
    setIsLooping(newLooping)
    synthEngine.setLooping(newLooping)
    if (newLooping) {
      const beatsPerSecond = bpm / 60
      const endTime = TOTAL_BEATS / beatsPerSecond
      synthEngine.setLoop(0, endTime)
    }
  }, [isLooping, bpm])

  const handleGridMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!gridRef.current) return

      const rect = gridRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left + (scrollContainerRef.current?.scrollLeft || 0)
      const y = e.clientY - rect.top + (scrollContainerRef.current?.scrollTop || 0)

      const beatIndex = Math.floor(x / BEAT_WIDTH)
      const subBeatIndex = Math.floor((x % BEAT_WIDTH) / (BEAT_WIDTH / SUB_BEATS))
      const midi = MIDI_NOTE_MAX - Math.floor(y / ROW_HEIGHT)
      const startBeat = beatIndex + subBeatIndex / SUB_BEATS

      const clickedNote = notes.find((note) => {
        const noteLeft = note.start * BEAT_WIDTH
        const noteRight = (note.start + note.duration) * BEAT_WIDTH
        const noteTop = (MIDI_NOTE_MAX - note.midi) * ROW_HEIGHT
        const noteBottom = noteTop + ROW_HEIGHT
        return x >= noteLeft && x <= noteRight && y >= noteTop && y <= noteBottom
      })

      if (clickedNote) {
        if (e.shiftKey) {
          onNotesChange(notes.filter((n) => n.id !== clickedNote.id))
          return
        }

        const resizeAreaWidth = 8
        const noteRight = (clickedNote.start + clickedNote.duration) * BEAT_WIDTH

        if (noteRight - x < resizeAreaWidth) {
          setDragState({
            mode: 'resize',
            noteId: clickedNote.id,
            startX: x,
            startNote: { ...clickedNote },
          })
        } else {
          setDragState({
            mode: 'move',
            noteId: clickedNote.id,
            startX: x,
            startY: y,
            startNote: { ...clickedNote },
          })
        }
        setSelectedNoteId(clickedNote.id)
      } else {
        const newNote: Note = {
          id: uuidv4(),
          midi: Math.max(MIDI_NOTE_MIN, Math.min(MIDI_NOTE_MAX, midi)),
          start: Math.max(0, startBeat),
          duration: 1,
          velocity: 0.8,
          trackId: activeTrackId,
        }

        onNotesChange([...notes, newNote])
        setSelectedNoteId(newNote.id)
        setNewNoteIds((prev) => new Set([...prev, newNote.id]))
        setDragState({
          mode: 'create',
          noteId: newNote.id,
          startX: x,
          startNote: newNote,
        })

        const track = tracks.find((t) => t.id === activeTrackId)
        if (track && !track.muted && isInitialized) {
          synthEngine.triggerAttack(newNote.midi, activeTrackId)
        }

        setTimeout(() => {
          setNewNoteIds((prev) => {
            const next = new Set(prev)
            next.delete(newNote.id)
            return next
          })
        }, 200)
      }
    },
    [notes, activeTrackId, tracks, onNotesChange, isInitialized]
  )

  const handleGridMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (dragState.mode === 'none' || !dragState.noteId || !gridRef.current) return

      const rect = gridRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left + (scrollContainerRef.current?.scrollLeft || 0)
      const y = e.clientY - rect.top + (scrollContainerRef.current?.scrollTop || 0)

      if (dragState.mode === 'create' && dragState.startNote) {
        const durationBeats = Math.max(0.25, (x - dragState.startNote.start * BEAT_WIDTH) / BEAT_WIDTH)
        const snappedDuration = Math.round(durationBeats * SUB_BEATS) / SUB_BEATS

        const updatedNotes = notes.map((n) =>
          n.id === dragState.noteId ? { ...n, duration: Math.max(0.25, snappedDuration) } : n
        )
        onNotesChange(updatedNotes)
      } else if (dragState.mode === 'move' && dragState.startNote && dragState.startX !== undefined && dragState.startY !== undefined) {
        const deltaX = x - dragState.startX
        const deltaY = y - dragState.startY

        const deltaBeats = Math.round((deltaX / BEAT_WIDTH) * SUB_BEATS) / SUB_BEATS
        const deltaMidi = -Math.round(deltaY / ROW_HEIGHT)

        const newStart = Math.max(0, dragState.startNote.start + deltaBeats)
        const newMidi = Math.max(
          MIDI_NOTE_MIN,
          Math.min(MIDI_NOTE_MAX, dragState.startNote.midi + deltaMidi)
        )

        const updatedNotes = notes.map((n) =>
          n.id === dragState.noteId ? { ...n, start: newStart, midi: newMidi } : n
        )
        onNotesChange(updatedNotes)
      } else if (dragState.mode === 'resize' && dragState.startNote) {
        const newDuration = Math.max(
          0.25,
          Math.round(((x - dragState.startNote.start * BEAT_WIDTH) / BEAT_WIDTH) * SUB_BEATS) /
            SUB_BEATS
        )

        const updatedNotes = notes.map((n) =>
          n.id === dragState.noteId ? { ...n, duration: newDuration } : n
        )
        onNotesChange(updatedNotes)
      }
    },
    [dragState, notes, onNotesChange]
  )

  const handleGridMouseUp = useCallback(() => {
    if (dragState.mode === 'create' && dragState.noteId) {
      const note = notes.find((n) => n.id === dragState.noteId)
      if (note && isInitialized) {
        synthEngine.triggerRelease(note.midi, activeTrackId)
      }
    }
    setDragState({ mode: 'none' })
  }, [dragState, notes, activeTrackId, isInitialized])

  const handlePianoKeyMouseDown = useCallback(
    (midi: number) => {
      const track = tracks.find((t) => t.id === activeTrackId)
      if (track && !track.muted && isInitialized) {
        synthEngine.triggerAttack(midi, activeTrackId)
        setActiveNotes((prev) => new Set([...prev, midi]))
      }
    },
    [activeTrackId, tracks, isInitialized]
  )

  const handlePianoKeyMouseUp = useCallback(
    (midi: number) => {
      if (isInitialized) {
        synthEngine.triggerRelease(midi, activeTrackId)
      }
      setActiveNotes((prev) => {
        const next = new Set(prev)
        next.delete(midi)
        return next
      })
    },
    [activeTrackId, isInitialized]
  )

  useEffect(() => {
    const keyboardMap: Record<string, number> = {
      a: 60, w: 61, s: 62, e: 63, d: 64, f: 65, t: 66, g: 67, y: 68, h: 69, u: 70, j: 71,
      k: 72, o: 73, l: 74, p: 75,
    }

    const pressedKeys = new Set<string>()

    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.repeat) return
      const key = e.key.toLowerCase()
      const midi = keyboardMap[key]
      if (midi && !pressedKeys.has(key)) {
        pressedKeys.add(key)
        const track = tracks.find((t) => t.id === activeTrackId)
        if (track && !track.muted && isInitialized) {
          synthEngine.triggerAttack(midi, activeTrackId)
          setActiveNotes((prev) => new Set([...prev, midi]))
        }
      }

      if (key === ' ' && !e.repeat) {
        e.preventDefault()
        handlePlay()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      const midi = keyboardMap[key]
      if (midi) {
        pressedKeys.delete(key)
        if (isInitialized) {
          synthEngine.triggerRelease(midi, activeTrackId)
        }
        setActiveNotes((prev) => {
          const next = new Set(prev)
          next.delete(midi)
          return next
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [activeTrackId, tracks, isInitialized, handlePlay])

  useEffect(() => {
    const handleMouseUp = () => {
      if (dragState.mode !== 'none') {
        handleGridMouseUp()
      }
    }
    window.addEventListener('mouseup', handleMouseUp)
    return () => window.removeEventListener('mouseup', handleMouseUp)
  }, [dragState.mode, handleGridMouseUp])

  const handleScroll = useCallback(() => {
    if (pianoKeysRef.current && scrollContainerRef.current) {
      pianoKeysRef.current.scrollTop = scrollContainerRef.current.scrollTop
    }
    if (rulerRef.current && scrollContainerRef.current) {
      rulerRef.current.scrollLeft = scrollContainerRef.current.scrollLeft
    }
  }, [])

  const pianoKeys = useMemo(() => {
    const keys = []
    for (let midi = MIDI_NOTE_MAX; midi >= MIDI_NOTE_MIN; midi--) {
      const isBlack = isBlackKey(midi)
      const index = MIDI_NOTE_MAX - midi
      const top = index * ROW_HEIGHT
      const noteName = midiToNoteName(midi)
      const isActive = activeNotes.has(midi)

      keys.push(
        <div
          key={midi}
          className={`piano-key ${isBlack ? 'black' : 'white'} ${isActive ? 'active' : ''}`}
          style={{ top: `${top}px`, height: `${ROW_HEIGHT}px` }}
          onMouseDown={() => handlePianoKeyMouseDown(midi)}
          onMouseUp={() => handlePianoKeyMouseUp(midi)}
          onMouseLeave={() => isActive && handlePianoKeyMouseUp(midi)}
        >
          {!isBlack && noteName.match(/^C\d$/) && (
            <span className="piano-key-label">{noteName}</span>
          )}
        </div>
      )
    }
    return keys
  }, [activeNotes, handlePianoKeyMouseDown, handlePianoKeyMouseUp])

  const gridLines = useMemo(() => {
    const lines: React.ReactNode[] = []

    for (let midi = MIDI_NOTE_MAX; midi >= MIDI_NOTE_MIN; midi--) {
      const index = MIDI_NOTE_MAX - midi
      const top = index * ROW_HEIGHT
      const isBlack = isBlackKey(midi)
      const isOctave = midi % 12 === 0

      lines.push(
        <div
          key={`h-${midi}`}
          className={`grid-line-horizontal ${isBlack ? 'black-key-row' : ''} ${isOctave ? 'octave' : ''}`}
          style={{ top: `${top}px` }}
        />
      )
    }

    for (let beat = 0; beat <= TOTAL_BEATS; beat++) {
      const left = beat * BEAT_WIDTH
      const isBar = beat % 4 === 0
      const isBeat = beat % 1 === 0

      lines.push(
        <div
          key={`v-${beat}`}
          className={`grid-line-vertical ${isBar ? 'bar' : isBeat ? 'beat' : ''}`}
          style={{ left: `${left}px` }}
        />
      )
    }

    return lines
  }, [])

  const rulerMarkers = useMemo(() => {
    const markers: React.ReactNode[] = []
    for (let beat = 0; beat <= TOTAL_BEATS; beat++) {
      const left = beat * BEAT_WIDTH
      const isBar = beat % 4 === 0
      const isBeat = beat % 1 === 0

      if (isBar || isBeat) {
        markers.push(
          <div
            key={beat}
            className={`ruler-marker ${isBar ? 'bar' : isBeat ? 'beat' : ''}`}
            style={{ left: `${left}px` }}
          >
            {isBar && `B${beat / 4 + 1}`}
          </div>
        )
      }
    }
    return markers
  }, [])

  const noteBlocks = useMemo(() => {
    return notes
      .filter((note) => note.trackId === activeTrackId)
      .map((note) => {
        const left = note.start * BEAT_WIDTH
        const width = note.duration * BEAT_WIDTH
        const top = (MIDI_NOTE_MAX - note.midi) * ROW_HEIGHT
        const color = noteColorGradient(note.midi)
        const isSelected = note.id === selectedNoteId
        const isNotePlaying =
          currentBeat >= note.start &&
          currentBeat < note.start + note.duration &&
          isPlaying
        const isNew = newNoteIds.has(note.id)

        return (
          <div
            key={note.id}
            className={`note-block ${isSelected ? 'selected' : ''} ${isNotePlaying ? 'playing' : ''} ${isNew ? 'note-block-enter' : ''}`}
            style={{
              left: `${left}px`,
              top: `${top}px`,
              width: `${width}px`,
              height: `${ROW_HEIGHT - 2}px`,
              background: `linear-gradient(135deg, ${color}, ${color}dd)`,
            }}
            onMouseDown={(e) => {
              e.stopPropagation()
              handleGridMouseDown(e)
            }}
          >
            <div className="note-resize-handle" />
          </div>
        )
      })
  }, [notes, activeTrackId, selectedNoteId, currentBeat, isPlaying, newNoteIds, handleGridMouseDown])

  const handleRulerClick = useCallback(
    (e: React.MouseEvent) => {
      if (!rulerRef.current || !isInitialized) return
      const rect = rulerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left + rulerRef.current.scrollLeft
      const beat = x / BEAT_WIDTH
      const beatsPerSecond = bpm / 60
      const time = beat /