import React, { useRef, useEffect, useCallback, useState } from 'react'
import { useStore } from '../store'
import {
  MIN_PITCH,
  MAX_PITCH,
  TICKS_PER_BEAT,
  TOTAL_BEATS,
  PIANO_KEY_WIDTH,
  NOTE_HEIGHT,
  TRACK_COLORS,
  pitchToName,
  pitchIsBlack,
} from '../types'

const HEADER_HEIGHT = 24
const NOTE_RADIUS = 3

interface ScoreEditorProps {
  playheadTick: number
  isPlaying: boolean
}

interface DragState {
  noteId: string
  trackId: string
  offsetTick: number
  offsetPitch: number
}

export default function ScoreEditor({ playheadTick, isPlaying }: ScoreEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasWidth, setCanvasWidth] = useState(800)
  const [dragState, setDragState] = useState<DragState | null>(null)

  const currentProject = useStore((s) => s.currentProject)
  const selectedTrackId = useStore((s) => s.selectedTrackId)
  const addNote = useStore((s) => s.addNote)
  const removeNote = useStore((s) => s.removeNote)
  const updateNote = useStore((s) => s.updateNote)
  const setSelectedNoteId = useStore((s) => s.setSelectedNoteId)
  const selectedNoteId = useStore((s) => s.selectedNoteId)

  const pitchRows = MAX_PITCH - MIN_PITCH + 1
  const canvasHeight = pitchRows * NOTE_HEIGHT
  const pixelsPerTick = (canvasWidth - PIANO_KEY_WIDTH) / (TOTAL_BEATS * TICKS_PER_BEAT)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const totalHeight = canvasHeight + HEADER_HEIGHT

    ctx.clearRect(0, 0, canvasWidth, totalHeight)

    ctx.fillStyle = '#1e1e2e'
    ctx.fillRect(0, 0, canvasWidth, HEADER_HEIGHT)

    ctx.font = '11px monospace'
    ctx.textAlign = 'center'
    for (let beat = 0; beat < TOTAL_BEATS; beat++) {
      const x = PIANO_KEY_WIDTH + (beat + 0.5) * TICKS_PER_BEAT * pixelsPerTick
      ctx.fillStyle = beat % 4 === 0 ? '#ccccff' : '#666688'
      ctx.fillText(beat % 4 === 0 ? `${Math.floor(beat / 4) + 1}` : `${beat + 1}`, x, 16)
    }

    ctx.fillStyle = '#2a2a3e'
    ctx.fillRect(0, HEADER_HEIGHT, canvasWidth, canvasHeight)

    for (let i = 0; i < pitchRows; i++) {
      const pitch = MAX_PITCH - i
      const y = HEADER_HEIGHT + i * NOTE_HEIGHT
      const isBlack = pitchIsBlack(pitch)

      ctx.fillStyle = isBlack ? '#3a3a4e' : '#ddd'
      ctx.fillRect(0, y, PIANO_KEY_WIDTH, NOTE_HEIGHT)
      ctx.strokeStyle = '#555'
      ctx.strokeRect(0, y, PIANO_KEY_WIDTH, NOTE_HEIGHT)

      ctx.fillStyle = isBlack ? '#aaa' : '#333'
      ctx.font = '9px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(pitchToName(pitch), PIANO_KEY_WIDTH / 2, y + NOTE_HEIGHT - 3)

      ctx.strokeStyle = '#ffffff20'
      ctx.beginPath()
      ctx.moveTo(PIANO_KEY_WIDTH, y)
      ctx.lineTo(canvasWidth, y)
      ctx.stroke()
    }

    for (let beat = 0; beat <= TOTAL_BEATS; beat++) {
      const x = PIANO_KEY_WIDTH + beat * TICKS_PER_BEAT * pixelsPerTick
      ctx.strokeStyle = beat % 4 === 0 ? '#ffffff40' : '#ffffff20'
      ctx.beginPath()
      ctx.moveTo(x, HEADER_HEIGHT)
      ctx.lineTo(x, totalHeight)
      ctx.stroke()
    }

    if (currentProject?.tracks) {
      currentProject.tracks.forEach((track, trackIndex) => {
        const color = TRACK_COLORS[trackIndex % TRACK_COLORS.length]
        track.notes.forEach((note) => {
          const x = PIANO_KEY_WIDTH + note.startTick * pixelsPerTick
          const y = HEADER_HEIGHT + (MAX_PITCH - note.pitch) * NOTE_HEIGHT
          const w = Math.max(note.duration * pixelsPerTick, 4)
          const h = NOTE_HEIGHT - 2
          ctx.globalAlpha = note.id === selectedNoteId ? 0.95 : 0.85
          ctx.fillStyle = note.id === selectedNoteId ? '#ffffff' : color
          ctx.beginPath()
          ctx.roundRect(x, y + 1, w, h, NOTE_RADIUS)
          ctx.fill()
          ctx.globalAlpha = 1
        })
      })
    }

    if (isPlaying) {
      const x = PIANO_KEY_WIDTH + playheadTick * pixelsPerTick
      ctx.strokeStyle = '#ff3333'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x, HEADER_HEIGHT)
      ctx.lineTo(x, totalHeight)
      ctx.stroke()
      ctx.lineWidth = 1
    }
  }, [canvasWidth, canvasHeight, pixelsPerTick, currentProject, selectedNoteId, isPlaying, playheadTick])

  useEffect(() => {
    draw()
  }, [draw])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCanvasWidth(entry.contentRect.width)
      }
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNoteId && currentProject) {
        for (const track of currentProject.tracks) {
          const note = track.notes.find((n) => n.id === selectedNoteId)
          if (note) {
            removeNote(track.id, selectedNoteId)
            return
          }
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [selectedNoteId, currentProject, removeNote])

  const getPitchAndTick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current!
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const pitch = MAX_PITCH - Math.floor((y - HEADER_HEIGHT) / NOTE_HEIGHT)
      const tick = Math.round((x - PIANO_KEY_WIDTH) / pixelsPerTick)
      return {
        pitch: Math.max(MIN_PITCH, Math.min(MAX_PITCH, pitch)),
        tick: Math.max(0, Math.min(TOTAL_BEATS * TICKS_PER_BEAT - 1, tick)),
      }
    },
    [pixelsPerTick],
  )

  const findNoteAt = useCallback(
    (pitch: number, tick: number) => {
      if (!currentProject?.tracks) return null
      for (const track of currentProject.tracks) {
        for (const note of track.notes) {
          if (note.pitch === pitch && tick >= note.startTick && tick < note.startTick + note.duration) {
            return { note, trackId: track.id }
          }
        }
      }
      return null
    },
    [currentProject],
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const { pitch, tick } = getPitchAndTick(e)
      if (e.clientX - canvasRef.current!.getBoundingClientRect().left < PIANO_KEY_WIDTH) return

      const hit = findNoteAt(pitch, tick)
      if (hit) {
        setSelectedNoteId(hit.note.id)
        setDragState({
          noteId: hit.note.id,
          trackId: hit.trackId,
          offsetTick: tick - hit.note.startTick,
          offsetPitch: pitch - hit.note.pitch,
        })
      } else {
        const trackId = selectedTrackId || currentProject?.tracks?.[0]?.id
        if (!trackId) return
        addNote(trackId, pitch, tick, TICKS_PER_BEAT)
      }
    },
    [getPitchAndTick, findNoteAt, selectedTrackId, currentProject, addNote, setSelectedNoteId],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!dragState) return
      const { pitch, tick } = getPitchAndTick(e)
      const newStartTick = Math.max(0, tick - dragState.offsetTick)
      const newPitch = Math.max(MIN_PITCH, Math.min(MAX_PITCH, pitch - dragState.offsetPitch))
      updateNote(dragState.trackId, dragState.noteId, { startTick: newStartTick, pitch: newPitch })
    },
    [dragState, getPitchAndTick, updateNote],
  )

  const handleMouseUp = useCallback(() => {
    setDragState(null)
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: canvasHeight + HEADER_HEIGHT,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight + HEADER_HEIGHT}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ display: 'block' }}
      />
    </div>
  )
}
