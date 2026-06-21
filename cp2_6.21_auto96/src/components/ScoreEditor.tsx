import React, { useRef, useState, useCallback, useEffect } from 'react'
import { useScoreStore, InstrumentType, Note } from '../store/useScoreStore'
import { INSTRUMENT_COLORS } from '../audio/PlayerEngine'

const INSTRUMENTS: InstrumentType[] = ['piano', 'guitar', 'drums', 'violin', 'bass']
const TOTAL_BEATS = 32
const ROW_HEIGHT = 80
const NOTE_SIZE = 14

interface DragState {
  isDragging: boolean
  noteId: string | null
  startX: number
  startBeat: number
  isMultiDrag: boolean
}

export const ScoreEditor: React.FC = React.memo(() => {
  const {
    notes,
    currentBeat,
    selectedNoteIds,
    addNote,
    deleteNote,
    moveNote,
    moveSelectedNotes,
    selectNote,
    clearSelection,
  } = useScoreStore()

  const editorRef = useRef<HTMLDivElement>(null)
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    noteId: null,
    startX: 0,
    startBeat: 0,
    isMultiDrag: false,
  })
  const [mouseDownPos, setMouseDownPos] = useState<{ x: number; y: number } | null>(null)

  const getBeatFromX = useCallback((clientX: number): number => {
    if (!editorRef.current) return 0
    const rect = editorRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const cellWidth = rect.width / TOTAL_BEATS
    return Math.max(0, Math.min(TOTAL_BEATS - 1, Math.floor(x / cellWidth)))
  }, [])

  const getInstrumentRow = useCallback((clientY: number): number => {
    if (!editorRef.current) return 0
    const rect = editorRef.current.getBoundingClientRect()
    const y = clientY - rect.top
    return Math.max(0, Math.min(INSTRUMENTS.length - 1, Math.floor(y / ROW_HEIGHT)))
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent, note?: Note) => {
    if (e.button === 2) return

    getBeatFromX(e.clientX)
    getInstrumentRow(e.clientY)

    setMouseDownPos({ x: e.clientX, y: e.clientY })

    if (note) {
      const isSelected = selectedNoteIds.includes(note.id)
      if (e.shiftKey) {
        selectNote(note.id, true)
      } else if (!isSelected) {
        selectNote(note.id, false)
      }

      setDragState({
        isDragging: true,
        noteId: note.id,
        startX: e.clientX,
        startBeat: note.time,
        isMultiDrag: selectedNoteIds.length > 1 || (e.shiftKey && isSelected),
      })
    } else {
      if (!e.shiftKey) {
        clearSelection()
      }
    }
  }, [getBeatFromX, getInstrumentRow, selectedNoteIds, selectNote, clearSelection])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging) return

    if (!editorRef.current) return
    const rect = editorRef.current.getBoundingClientRect()
    const cellWidth = rect.width / TOTAL_BEATS
    const deltaX = e.clientX - dragState.startX
    const deltaBeats = Math.round(deltaX / cellWidth)

    if (deltaBeats !== 0) {
      if (dragState.isMultiDrag) {
        moveSelectedNotes(deltaBeats)
        setDragState(prev => ({ ...prev, startX: e.clientX }))
      } else if (dragState.noteId) {
        const newBeat = Math.max(0, Math.min(TOTAL_BEATS - 1, dragState.startBeat + deltaBeats))
        moveNote(dragState.noteId, newBeat)
      }
    }
  }, [dragState, moveNote, moveSelectedNotes])

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (mouseDownPos && !dragState.isDragging) {
      const dx = Math.abs(e.clientX - mouseDownPos.x)
      const dy = Math.abs(e.clientY - mouseDownPos.y)
      if (dx < 5 && dy < 5) {
        const beat = getBeatFromX(e.clientX)
        const rowIndex = getInstrumentRow(e.clientY)
        const instrument = INSTRUMENTS[rowIndex]
        addNote(instrument, beat)
      }
    }

    setDragState({
      isDragging: false,
      noteId: null,
      startX: 0,
      startBeat: 0,
      isMultiDrag: false,
    })
    setMouseDownPos(null)
  }, [mouseDownPos, dragState.isDragging, getBeatFromX, getInstrumentRow, addNote])

  const handleContextMenu = useCallback((e: React.MouseEvent, note?: Note) => {
    e.preventDefault()
    if (note) {
      if (selectedNoteIds.includes(note.id) && selectedNoteIds.length > 1) {
        selectedNoteIds.forEach(id => deleteNote(id))
      } else {
        deleteNote(note.id)
      }
    }
  }, [deleteNote, selectedNoteIds])

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  const notesByInstrumentAndTime = new Map<string, Note[]>()
  notes.forEach(note => {
    const key = `${note.instrument}-${note.time}`
    if (!notesByInstrumentAndTime.has(key)) {
      notesByInstrumentAndTime.set(key, [])
    }
    notesByInstrumentAndTime.get(key)!.push(note)
  })

  const renderNote = (note: Note, overlapCount: number) => {
    const rowIndex = INSTRUMENTS.indexOf(note.instrument)
    const color = INSTRUMENT_COLORS[note.instrument]
    const isSelected = selectedNoteIds.includes(note.id)
    const isDragging = dragState.isDragging && dragState.noteId === note.id

    return (
      <div
        key={note.id}
        className={`note ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
        style={{
          left: `calc(${note.time / TOTAL_BEATS * 100}% + (100% / ${TOTAL_BEATS} - ${NOTE_SIZE * (overlapCount > 1 ? 1.3 : 1)}px) / 2)`,
          top: `${rowIndex * ROW_HEIGHT + (ROW_HEIGHT - NOTE_SIZE * (overlapCount > 1 ? 1.3 : 1)) / 2}px`,
          width: `${NOTE_SIZE * (overlapCount > 1 ? 1.3 : 1)}px`,
          height: `${NOTE_SIZE * (overlapCount > 1 ? 1.3 : 1)}px`,
          backgroundColor: color,
          boxShadow: `0 0 10px ${color}80`,
          opacity: overlapCount > 1 ? 0.7 : 1,
        }}
        onMouseDown={(e) => handleMouseDown(e, note)}
        onContextMenu={(e) => handleContextMenu(e, note)}
      />
    )
  }

  return (
    <div className="score-editor" ref={editorRef} onMouseDown={handleMouseDown}>
      <div className="beat-labels">
        {Array.from({ length: TOTAL_BEATS }, (_, i) => (
          <div
            key={i}
            className={`beat-label ${i % 4 === 0 ? 'strong' : ''}`}
          >
            {i + 1}
          </div>
        ))}
      </div>

      <div className="grid-container">
        {INSTRUMENTS.map((instrument) => (
          <div key={instrument} className="track-row-grid">
            {Array.from({ length: TOTAL_BEATS }, (_, beat) => {
              const key = `${instrument}-${beat}`
              notesByInstrumentAndTime.get(key)
              const isEvenBeat = beat % 2 === 0

              return (
                <div
                  key={beat}
                  className={`grid-cell ${isEvenBeat ? 'even' : ''}`}
                  style={{ borderRightWidth: isEvenBeat ? '2px' : '1px' }}
                />
              )
            })}
          </div>
        ))}

        {Array.from(notesByInstrumentAndTime.entries()).map(([_, noteList]) => {
          if (noteList.length === 0) return null
          return noteList.map((note) => renderNote(note, noteList.length))
        })}

        <div
          className="playhead"
          style={{
            left: `${(currentBeat / TOTAL_BEATS) * 100}%`,
            width: `${100 / TOTAL_BEATS}%`,
          }}
        />
      </div>
    </div>
  )
})

ScoreEditor.displayName = 'ScoreEditor'
