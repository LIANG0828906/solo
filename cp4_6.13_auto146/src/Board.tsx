import { useState, useRef, useCallback, useEffect } from 'react'
import Note from './Note'
import type { Note as NoteType, Column } from './types'

interface BoardProps {
  columns: Column[]
  notes: NoteType[]
  nickname: string
  onAddNote: (note: { columnId: string; tempId: string; title: string; content: string; color: string; creator: string }) => void
  onUpdateNote: (note: Partial<NoteType> & { id: string }) => void
  onDeleteNote: (id: string) => void
  onMoveNote: (id: string, toColumnId: string, toIndex: number) => void
}

interface DragState {
  noteId: string
  fromColumnId: string
  currentColumnId: string
  currentIndex: number
  startY: number
  offsetX: number
  offsetY: number
  originalRect: DOMRect
}

function Board({ columns, notes, nickname, onAddNote, onUpdateNote, onDeleteNote, onMoveNote }: BoardProps) {
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [hoverColumn, setHoverColumn] = useState<string | null>(null)
  const [bumpCounts, setBumpCounts] = useState<Record<string, boolean>>({})
  const boardRef = useRef<HTMLDivElement>(null)
  const pendingMoves = useRef<Set<string>>(new Set())

  const getColumnNotes = useCallback(
    (columnId: string) => {
      return notes
        .filter((n) => n.columnId === columnId)
        .sort((a, b) => a.order - b.order)
    },
    [notes]
  )

  const getDropIndex = useCallback(
    (columnId: string, clientY: number): number => {
      const colNotes = getColumnNotes(columnId)
      const colEl = document.querySelector(`[data-column="${columnId}"] .column-body`)
      if (!colEl || colNotes.length === 0) return 0

      const rect = colEl.getBoundingClientRect()
      const relativeY = clientY - rect.top
      const noteEls = colEl.querySelectorAll('.note-wrapper')

      for (let i = 0; i < noteEls.length; i++) {
        const noteRect = (noteEls[i] as HTMLElement).getBoundingClientRect()
        const noteCenter = noteRect.top - rect.top + noteRect.height / 2
        if (relativeY < noteCenter) return i
      }
      return colNotes.length
    },
    [getColumnNotes]
  )

  const handleDoubleClick = useCallback(
    (columnId: string, e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('.note')) return
      const col = columns.find((c) => c.id === columnId)
      if (!col) return
      const tempId = `temp-${Date.now()}-${Math.random()}`
      onAddNote({
        columnId,
        tempId,
        title: '新便签',
        content: '',
        color: col.defaultColor,
        creator: nickname,
      })
    },
    [columns, nickname, onAddNote]
  )

  const handleDragStart = useCallback(
    (note: NoteType, e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault()
      const el = (e.currentTarget as HTMLElement).closest('.note') as HTMLElement
      if (!el) return
      const rect = el.getBoundingClientRect()
      let clientX: number, clientY: number
      if ('touches' in e) {
        clientX = e.touches[0].clientX
        clientY = e.touches[0].clientY
      } else {
        clientX = e.clientX
        clientY = e.clientY
      }

      setDragState({
        noteId: note.id,
        fromColumnId: note.columnId,
        currentColumnId: note.columnId,
        currentIndex: getColumnNotes(note.columnId).findIndex((n) => n.id === note.id),
        startY: clientY,
        offsetX: clientX - rect.left,
        offsetY: clientY - rect.top,
        originalRect: rect,
      })
    },
    [getColumnNotes]
  )

  const handleDragMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!dragState) return
      let clientX: number, clientY: number
      if ('touches' in e) {
        clientX = e.touches[0].clientX
        clientY = e.touches[0].clientY
      } else {
        clientX = e.clientX
        clientY = e.clientY
      }

      let targetColId: string | null = null
      columns.forEach((col) => {
        const colEl = document.querySelector(`[data-column="${col.id}"]`) as HTMLElement
        if (colEl) {
          const rect = colEl.getBoundingClientRect()
          if (clientX >= rect.left && clientX <= rect.right) {
            targetColId = col.id
          }
        }
      })

      if (!targetColId) {
        setHoverColumn(null)
        return
      }

      setHoverColumn(targetColId)
      const dropIndex = getDropIndex(targetColId, clientY)

      if (targetColId !== dragState.currentColumnId || dropIndex !== dragState.currentIndex) {
        setDragState((prev) =>
          prev
            ? { ...prev, currentColumnId: targetColId!, currentIndex: dropIndex }
            : prev
        )

        if (targetColId !== dragState.currentColumnId && !pendingMoves.current.has(dragState.noteId)) {
          setBumpCounts((prev) => {
            const next = { ...prev }
            if (dragState.fromColumnId !== targetColId) {
              next[targetColId!] = true
              next[dragState.currentColumnId] = true
            }
            return next
          })
          setTimeout(() => {
            setBumpCounts((prev) => {
              const next = { ...prev }
              delete next[targetColId!]
              delete next[dragState.currentColumnId]
              return next
            })
          }, 300)
        }
      }
    },
    [dragState, columns, getDropIndex]
  )

  const handleDragEnd = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!dragState) return
      let clientX: number, clientY: number
      if ('changedTouches' in e) {
        clientX = e.changedTouches[0].clientX
        clientY = e.changedTouches[0].clientY
      } else {
        clientX = e.clientX
        clientY = e.clientY
      }

      const boardEl = boardRef.current
      if (boardEl) {
        const rect = boardEl.getBoundingClientRect()
        if (clientX < rect.left - 50 || clientX > rect.right + 50 || clientY < rect.top - 50 || clientY > rect.bottom + 50) {
          setDragState(null)
          setHoverColumn(null)
          const noteEl = document.querySelector(`[data-note-id="${dragState.noteId}"]`) as HTMLElement
          if (noteEl) {
            noteEl.classList.add('returning')
            setTimeout(() => noteEl.classList.remove('returning'), 400)
          }
          return
        }
      }

      if (hoverColumn) {
        onMoveNote(dragState.noteId, dragState.currentColumnId, dragState.currentIndex)
        pendingMoves.current.add(dragState.noteId)
        setTimeout(() => pendingMoves.current.delete(dragState.noteId), 500)
      }

      setDragState(null)
      setHoverColumn(null)
    },
    [dragState, hoverColumn, onMoveNote]
  )

  useEffect(() => {
    if (dragState) {
      const moveHandler = (e: MouseEvent) => handleDragMove(e)
      const upHandler = (e: MouseEvent) => handleDragEnd(e)
      const touchMove = (e: TouchEvent) => handleDragMove(e)
      const touchEnd = (e: TouchEvent) => handleDragEnd(e)
      window.addEventListener('mousemove', moveHandler)
      window.addEventListener('mouseup', upHandler)
      window.addEventListener('touchmove', touchMove, { passive: false })
      window.addEventListener('touchend', touchEnd)
      return () => {
        window.removeEventListener('mousemove', moveHandler)
        window.removeEventListener('mouseup', upHandler)
        window.removeEventListener('touchmove', touchMove)
        window.removeEventListener('touchend', touchEnd)
      }
    }
  }, [dragState, handleDragMove, handleDragEnd])

  const renderColumn = (col: Column) => {
    const colNotes = getColumnNotes(col.id)
    const isHover = hoverColumn === col.id

    let displayNotes = [...colNotes]
    if (dragState && isHover) {
      const dragNote = notes.find((n) => n.id === dragState.noteId)
      if (dragNote) {
        displayNotes = displayNotes.filter((n) => n.id !== dragState.noteId)
        displayNotes.splice(dragState.currentIndex, 0, { ...dragNote, columnId: col.id } as NoteType)
      }
    } else if (dragState && dragState.fromColumnId === col.id) {
      displayNotes = displayNotes.filter((n) => n.id !== dragState.noteId)
    }

    return (
      <div key={col.id} className="column" data-column={col.id}>
        <div className="column-header">
          <span className="column-title">{col.name}</span>
          <span className={`column-count ${bumpCounts[col.id] ? 'bump' : ''}`}>
            {colNotes.length + (dragState && isHover && dragState.fromColumnId !== col.id ? 1 : 0) - (dragState && dragState.fromColumnId === col.id && !isHover ? 1 : 0)}
          </span>
        </div>
        <div
          className={`column-body ${isHover ? 'drag-over' : ''}`}
          onDoubleClick={(e) => handleDoubleClick(col.id, e)}
        >
          {displayNotes.map((note, idx) => (
            <div key={note.id} className="note-wrapper" style={{ position: 'relative' }}>
              {dragState && isHover && idx === dragState.currentIndex && dragState.noteId !== note.id && (
                <div className="drag-indicator" />
              )}
              <Note
                note={note}
                isDragging={dragState?.noteId === note.id}
                onDragStart={(e) => handleDragStart(note, e)}
                onUpdate={(data) => onUpdateNote({ ...data, id: note.id })}
                onDelete={() => onDeleteNote(note.id)}
              />
            </div>
          ))}
          {dragState && isHover && dragState.currentIndex >= displayNotes.length && (
            <div className="drag-indicator" />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="board-container" ref={boardRef}>
      {columns.map(renderColumn)}
    </div>
  )
}

export default Board
