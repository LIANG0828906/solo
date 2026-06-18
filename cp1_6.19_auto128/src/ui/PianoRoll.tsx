import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { FiX, FiPlay, FiTrash2, FiZoomIn, FiZoomOut } from 'react-icons/fi'
import type { Note } from '../eventBus'
import { midiToNoteName, getNoteColor } from '../domain/melody'

import './PianoRoll.css'

interface PianoRollProps {
  notes: Note[]
  onClose: () => void
  onSave: (notes: Note[]) => void
}

const MIN_MIDI = 36
const MAX_MIDI = 96
const TOTAL_KEYS = MAX_MIDI - MIN_MIDI + 1
const DEFAULT_BEATS = 16
const BEAT_SUBDIVISIONS = 4
const NOTE_HEIGHT = 24
const BEAT_WIDTH = 40

const PianoRoll: React.FC<PianoRollProps> = ({ notes, onClose, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [localNotes, setLocalNotes] = useState<Note[]>([...notes])
  const [selectedNote, setSelectedNote] = useState<number | null>(null)
  const [dragMode, setDragMode] = useState<'move' | 'resize' | null>(null)
  const [dragStart, setDragStart] = useState<{ x: number; y: number; noteIndex: number; originalNote: Note } | null>(null)
  const [zoom, setZoom] = useState(1)
  const [beatWidth, setBeatWidth] = useState(BEAT_WIDTH)

  const totalBeats = useMemo(() => {
    let maxBeat = DEFAULT_BEATS
    localNotes.forEach(note => {
      const end = note.time + note.duration
      if (end > maxBeat) maxBeat = Math.ceil(end)
    })
    return maxBeat
  }, [localNotes])

  useEffect(() => {
    setBeatWidth(BEAT_WIDTH * zoom)
  }, [zoom])

  const canvasWidth = totalBeats * beatWidth + 100
  const canvasHeight = TOTAL_KEYS * NOTE_HEIGHT + 40

  const midiToY = useCallback((midi: number): number => {
    return (MAX_MIDI - midi) * NOTE_HEIGHT
  }, [])

  const yToMidi = useCallback((y: number): number => {
    return MAX_MIDI - Math.floor(y / NOTE_HEIGHT)
  }, [])

  const timeToX = useCallback((time: number): number => {
    return 80 + time * beatWidth
  }, [beatWidth])

  const xToTime = useCallback((x: number): number => {
    return Math.max(0, (x - 80) / beatWidth)
  }, [beatWidth])

  const isBlackKey = (midi: number): boolean => {
    const note = midi % 12
    return note === 1 || note === 3 || note === 6 || note === 8 || note === 10
  }

  const drawPianoRoll = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = canvasWidth * dpr
    canvas.height = canvasHeight * dpr
    canvas.style.width = `${canvasWidth}px`
    canvas.style.height = `${canvasHeight}px`
    ctx.scale(dpr, dpr)

    ctx.fillStyle = '#1E1E2E'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    for (let i = 0; i <= TOTAL_KEYS; i++) {
      const y = i * NOTE_HEIGHT
      const midi = MAX_MIDI - i

      if (!isBlackKey(midi)) {
        ctx.fillStyle = '#2D2D44'
        ctx.fillRect(0, y, 80, NOTE_HEIGHT)
      } else {
        ctx.fillStyle = '#252538'
        ctx.fillRect(0, y, 80, NOTE_HEIGHT)
      }

      if (midi % 12 === 0) {
        ctx.strokeStyle = '#FFFFFF22'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(80, y)
        ctx.lineTo(canvasWidth, y)
        ctx.stroke()
      }
    }

    for (let beat = 0; beat <= totalBeats; beat++) {
      const x = timeToX(beat)
      
      ctx.strokeStyle = beat % 4 === 0 ? '#FFFFFF33' : '#FFFFFF11'
      ctx.lineWidth = beat % 4 === 0 ? 1 : 0.5
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvasHeight)
      ctx.stroke()

      if (beat % 4 === 0) {
        ctx.fillStyle = '#9CA3AF'
        ctx.font = '11px JetBrains Mono, monospace'
        ctx.textAlign = 'center'
        ctx.fillText(`${Math.floor(beat / 4) + 1}`, x, canvasHeight - 8)
      }
    }

    for (let i = 0; i < TOTAL_KEYS; i++) {
      const y = i * NOTE_HEIGHT
      const midi = MAX_MIDI - i

      if (midi % 12 === 0) {
        ctx.fillStyle = '#9CA3AF'
        ctx.font = '10px JetBrains Mono, monospace'
        ctx.textAlign = 'right'
        ctx.fillText(midiToNoteName(midi), 72, y + NOTE_HEIGHT / 2 + 4)
      }
    }

    localNotes.forEach((note, index) => {
      const x = timeToX(note.time)
      const y = midiToY(note.midi)
      const width = note.duration * beatWidth
      const height = NOTE_HEIGHT - 2
      const color = getNoteColor(note.midi, MIN_MIDI, MAX_MIDI)

      const isSelected = selectedNote === index

      ctx.fillStyle = color
      ctx.globalAlpha = isSelected ? 1 : 0.85
      ctx.beginPath()
      ctx.roundRect(x + 1, y + 1, width - 2, height, 3)
      ctx.fill()

      if (isSelected) {
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.roundRect(x + 1, y + 1, width - 2, height, 3)
        ctx.stroke()
      }

      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.fillRect(x + 4, y + 3, Math.min(width - 8, 15), 3)

      ctx.globalAlpha = 1

      if (width > 30) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        ctx.font = '10px JetBrains Mono, monospace'
        ctx.textAlign = 'left'
        ctx.fillText(midiToNoteName(note.midi), x + 6, y + NOTE_HEIGHT / 2 + 3)
      }

      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
      ctx.fillRect(x + width - 6, y + 1, 5, height)
    })

  }, [localNotes, selectedNote, totalBeats, beatWidth, timeToX, midiToY])

  useEffect(() => {
    drawPianoRoll()
  }, [drawPianoRoll])

  const getNoteAtPosition = (x: number, y: number): { index: number; part: 'body' | 'right' | null } => {
    for (let i = localNotes.length - 1; i >= 0; i--) {
      const note = localNotes[i]
      const noteX = timeToX(note.time)
      const noteY = midiToY(note.midi)
      const noteWidth = note.duration * beatWidth
      const noteHeight = NOTE_HEIGHT

      if (y >= noteY && y < noteY + noteHeight) {
        if (x >= noteX + noteWidth - 10 && x <= noteX + noteWidth) {
          return { index: i, part: 'right' }
        }
        if (x >= noteX && x < noteX + noteWidth) {
          return { index: i, part: 'body' }
        }
      }
    }
    return { index: -1, part: null }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (x < 80) return

    const { index, part } = getNoteAtPosition(x, y)

    if (index >= 0) {
      setSelectedNote(index)
      if (part === 'right') {
        setDragMode('resize')
      } else {
        setDragMode('move')
      }
      setDragStart({
        x,
        y,
        noteIndex: index,
        originalNote: { ...localNotes[index] }
      })
    } else {
      const midi = yToMidi(y)
      const time = Math.floor(xToTime(x) * BEAT_SUBDIVISIONS) / BEAT_SUBDIVISIONS
      
      const newNote: Note = {
        midi,
        time,
        duration: 0.25,
        velocity: 0.8
      }

      setLocalNotes(prev => [...prev, newNote])
      setSelectedNote(localNotes.length)
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragStart || dragMode === null) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const dx = x - dragStart.x
    const dy = y - dragStart.y

    setLocalNotes(prev => {
      const newNotes = [...prev]
      const note = { ...dragStart.originalNote }

      if (dragMode === 'move') {
        const deltaTime = dx / beatWidth
        const deltaMidi = -Math.round(dy / NOTE_HEIGHT)
        
        note.time = Math.max(0, Math.round((note.time + deltaTime) * BEAT_SUBDIVISIONS) / BEAT_SUBDIVISIONS)
        note.midi = Math.max(MIN_MIDI, Math.min(MAX_MIDI, note.midi + deltaMidi))
      } else if (dragMode === 'resize') {
        const deltaDuration = dx / beatWidth
        note.duration = Math.max(0.25, Math.round((note.duration + deltaDuration) * BEAT_SUBDIVISIONS) / BEAT_SUBDIVISIONS)
      }

      newNotes[dragStart.noteIndex] = note
      return newNotes
    })
  }

  const handleMouseUp = () => {
    setDragMode(null)
    setDragStart(null)
  }

  const handleDeleteSelected = () => {
    if (selectedNote !== null) {
      setLocalNotes(prev => prev.filter((_, i) => i !== selectedNote))
      setSelectedNote(null)
    }
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedNote !== null) {
        handleDeleteSelected()
      }
    }
    if (e.key === 'Escape') {
      setSelectedNote(null)
    }
  }, [selectedNote])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleSave = () => {
    const sortedNotes = [...localNotes].sort((a, b) => a.time - b.time || a.midi - b.midi)
    onSave(sortedNotes)
    onClose()
  }

  const handleClearAll = () => {
    if (confirm('确定要清空所有音符吗？')) {
      setLocalNotes([])
      setSelectedNote(null)
    }
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(2, prev + 0.25))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(0.5, prev - 0.25))
  }

  return (
    <div className="piano-roll-overlay" onClick={onClose}>
      <div className="piano-roll-modal" onClick={e => e.stopPropagation()}>
        <div className="piano-roll-header">
          <h2>旋律编辑器</h2>
          <div className="piano-roll-actions">
            <button className="tool-btn" onClick={handleZoomOut} title="缩小">
              <FiZoomOut />
            </button>
            <button className="tool-btn" onClick={handleZoomIn} title="放大">
              <FiZoomIn />
            </button>
            <button className="tool-btn" onClick={handleClearAll} title="清空">
              <FiTrash2 />
            </button>
            <button className="close-btn" onClick={onClose}>
              <FiX />
            </button>
          </div>
        </div>

        <div className="piano-roll-body" ref={containerRef}>
          <canvas
            ref={canvasRef}
            className="piano-roll-canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>

        <div className="piano-roll-footer">
          <div className="note-info">
            {selectedNote !== null && localNotes[selectedNote] ? (
              <span>
                选中音符: {midiToNoteName(localNotes[selectedNote].midi)} | 
                时长: {localNotes[selectedNote].duration.toFixed(2)}拍 | 
                位置: {localNotes[selectedNote].time.toFixed(2)}拍
              </span>
            ) : (
              <span>点击网格创建音符，拖拽调整位置和时长</span>
            )}
          </div>
          <div className="footer-actions">
            <button className="secondary-btn" onClick={onClose}>
              取消
            </button>
            <button className="primary-btn" onClick={handleSave}>
              <FiPlay /> 保存并试听
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PianoRoll
